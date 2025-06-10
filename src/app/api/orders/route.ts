import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validateSearchParams, 
  validateRequestBody,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createServerErrorResponse,
  schemas,
  paginationSchema
} from '@/lib/validation'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Enhanced validation schema for order search
const orderSearchSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ALL']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ...paginationSchema.shape
})

export async function GET(request: NextRequest) {
  let session: any
  
  try {
    session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return createAuthErrorResponse('Authentication required')
    }

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const validation = validateSearchParams(searchParams, orderSearchSchema)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }
    
    const params = validation.data
    const skip = ((params.page || 1) - 1) * (params.limit || 10)

    // Build where clause with enhanced filtering
    const where: any = {
      userId: session.user.id
    }

    // Add status filter if provided
    if (params.status && params.status !== 'ALL') {
      where.status = params.status
    }

    // Add date range filter if provided
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate)
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate)
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[params.sortBy || 'createdAt'] = params.sortOrder || 'desc'

    // Get user's orders with items and product details
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take: params.limit || 10
    })

    // Get total count for pagination
    const totalOrders = await prisma.order.count({
      where
    })

    // Get order statistics
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: {
        userId: session.user.id
      },
      _count: {
        status: true
      }
    })

    const stats = orderStats.reduce((acc: any, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {})

    return Response.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / (params.limit || 10)),
          hasMore: (params.page || 1) * (params.limit || 10) < totalOrders,
          hasPrevious: (params.page || 1) > 1
        },
        stats,
        filters: {
          status: params.status,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder
        }
      }
    })
  } catch (error) {
    logger.error('Failed to fetch user orders', {
      userId: session?.user?.id,
      params: Object.fromEntries(request.nextUrl.searchParams.entries())
    }, error instanceof Error ? error : new Error(String(error)))
    
    return createServerErrorResponse('Failed to fetch orders')
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  let session: any
  let orderData: any
  
  try {
    session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return createAuthErrorResponse('Authentication required')
    }

    // Validate request body
    const validation = await validateRequestBody(request, schemas.createOrder)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    orderData = validation.data

    // Verify all products exist and have sufficient stock
    const productChecks = await Promise.all(
      orderData.items.map(async (item: any) => {
        const sku = await prisma.productSku.findUnique({
          where: { id: item.skuId },
          include: { product: true }
        })
        
        if (!sku) {
          throw new Error(`SKU ${item.skuId} not found`)
        }
        
        if (!sku.product.isActive) {
          throw new Error(`Product ${sku.product.name} is not active`)
        }
        
        if (sku.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${sku.product.name}. Available: ${sku.stock}, requested: ${item.quantity}`)
        }
        
        return { sku, item }
      })
    )

    // Calculate total
    const total = productChecks.reduce((sum, { sku, item }) => {
      return sum + (Number(sku.price) * item.quantity)
    }, 0)

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          orderNumber: `ORD-${Date.now()}`,
          status: 'PENDING',
          subtotal: total,
          shippingCost: 0,
          total,
          shippingName: orderData.shippingAddress.fullName,
          shippingEmail: orderData.customerEmail,
          shippingPhone: orderData.shippingAddress.phone,
          shippingAddress: orderData.shippingAddress.street,
          shippingCity: orderData.shippingAddress.city,
          shippingCountry: orderData.shippingAddress.country,
          shippingZip: orderData.shippingAddress.postalCode,
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
          items: {
            create: orderData.items.map((item: any) => ({
              skuId: item.skuId,
              quantity: item.quantity,
              price: item.price,
              productName: productChecks.find(p => p.sku.id === item.skuId)?.sku.product.name || '',
              productSku: productChecks.find(p => p.sku.id === item.skuId)?.sku.sku || ''
            }))
          }
        },
        include: {
          items: {
            include: {
              sku: {
                include: {
                  product: {
                    include: {
                      images: { where: { isPrimary: true }, take: 1 }
                    }
                  }
                }
              }
            }
          }
        }
      })

      // Update stock
      for (const { sku, item } of productChecks) {
        await tx.productSku.update({
          where: { id: sku.id },
          data: { stock: { decrement: item.quantity } }
        })
      }

      return newOrder
    })

    return Response.json({
      success: true,
      data: order
    }, { status: 201 })
    
  } catch (error) {
    logger.error('Failed to create order via POST', {
      userId: session?.user?.id,
      itemCount: orderData?.items?.length
    }, error instanceof Error ? error : new Error(String(error)))
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createValidationErrorResponse([{
        field: 'items',
        message: error.message
      }])
    }
    
    if (error instanceof Error && error.message.includes('Insufficient stock')) {
      return createValidationErrorResponse([{
        field: 'items',
        message: error.message
      }])
    }
    
    return createServerErrorResponse('Failed to create order')
  }
}