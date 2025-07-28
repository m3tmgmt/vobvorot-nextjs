import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validateRequestBody,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createServerErrorResponse,
  schemas
} from '@/lib/validation'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Mock SKU data for fallback when database is unavailable
const mockSkuData = {
  "mock-sku-1": {
    id: "mock-sku-1",
    sku: "classic-t-shirt-default",
    price: 29.99,
    stock: 10,
    reservedStock: 0,
    size: "M",
    color: "Black",
    isActive: true,
    product: {
      id: "mock-product-1",
      name: "Classic T-Shirt",
      slug: "classic-t-shirt",
      isActive: true,
      images: [{ url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", isPrimary: true }]
    }
  },
  "mock-sku-2": {
    id: "mock-sku-2",
    sku: "designer-sneakers-default",
    price: 89.99,
    stock: 5,
    reservedStock: 0,
    size: "9",
    color: "White",
    isActive: true,
    product: {
      id: "mock-product-2",
      name: "Designer Sneakers",
      slug: "designer-sneakers",
      isActive: true,
      images: [{ url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500", isPrimary: true }]
    }
  },
  "mock-sku-3": {
    id: "mock-sku-3",
    sku: "luxury-watch-default",
    price: 299.99,
    stock: 3,
    reservedStock: 0,
    size: "One Size",
    color: "Silver",
    isActive: true,
    product: {
      id: "mock-product-3",
      name: "Luxury Watch",
      slug: "luxury-watch",
      isActive: true,
      images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", isPrimary: true }]
    }
  },
  "mock-sku-4": {
    id: "mock-sku-4",
    sku: "stylish-hat-default",
    price: 39.99,
    stock: 8,
    reservedStock: 0,
    size: "One Size",
    color: "Black",
    isActive: true,
    product: {
      id: "mock-product-4",
      name: "Stylish Hat",
      slug: "stylish-hat",
      isActive: true,
      images: [{ url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500", isPrimary: true }]
    }
  },
  "mock-sku-5": {
    id: "mock-sku-5",
    sku: "exvicpmour-special-edition-default",
    price: 149.99,
    stock: 2,
    reservedStock: 0,
    size: "One Size",
    color: "Gold",
    isActive: true,
    product: {
      id: "mock-product-5",
      name: "EXVICPMOUR Special Edition",
      slug: "exvicpmour-special-edition",
      isActive: true,
      images: [{ url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500", isPrimary: true }]
    }
  },
  "mock-sku-6": {
    id: "mock-sku-6",
    sku: "designer-handbag-default",
    price: 199.99,
    stock: 4,
    reservedStock: 0,
    size: "Medium",
    color: "Brown",
    isActive: true,
    product: {
      id: "mock-product-6",
      name: "Designer Handbag",
      slug: "designer-handbag",
      isActive: true,
      images: [{ url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500", isPrimary: true }]
    }
  }
}

interface CartItem {
  productId: string
  skuId: string
  quantity: number
  price: number
  selectedSize?: string
  selectedColor?: string
}

// GET - Get cart details (client-side managed)
export async function GET(request: NextRequest) {
  let session: any = null
  
  try {
    session = await getServerSession(authOptions)
    
    // Cart is managed client-side for both guest and authenticated users
    // This endpoint can be used for cart validation or server-side operations
    return Response.json({
      success: true,
      data: {
        items: [],
        total: 0,
        itemCount: 0,
        isGuest: !session?.user?.id,
        userId: session?.user?.id || null
      },
      message: 'Cart is managed client-side. Use this endpoint for validation or server operations.'
    })
  } catch (error) {
    logger.error('Failed to fetch cart data', {
      userId: session?.user?.id,
      isGuest: !session?.user?.id
    }, error instanceof Error ? error : new Error(String(error)))
    
    return createServerErrorResponse('Failed to fetch cart')
  }
}

// POST - Validate cart item before adding (cart managed client-side)
export async function POST(request: NextRequest) {
  let productId: string | undefined
  let skuId: string | undefined
  let quantity: number | undefined
  
  try {
    // Validate request body
    const validation = await validateRequestBody(request, schemas.addToCart)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    productId = validation.data.productId
    skuId = validation.data.skuId
    quantity = validation.data.quantity

    // Check if this is a mock SKU first
    let sku = null
    
    if (skuId.startsWith('mock-sku-')) {
      // Use mock data for mock SKUs
      sku = mockSkuData[skuId as keyof typeof mockSkuData]
      if (!sku) {
        return createValidationErrorResponse([{
          field: 'skuId',
          message: 'Mock SKU not found'
        }])
      }
    } else {
      // Try to get from database for real SKUs
      try {
        sku = await prisma.productSku.findUnique({
          where: { id: skuId },
          include: { 
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 }
              }
            }
          }
        })
      } catch (dbError) {
        console.error('Database error, checking mock data as fallback:', dbError)
        sku = mockSkuData[skuId as keyof typeof mockSkuData]
      }
      
      if (!sku) {
        return createValidationErrorResponse([{
          field: 'skuId',
          message: 'SKU not found'
        }])
      }
    }

    if (!sku.product.isActive) {
      return createValidationErrorResponse([{
        field: 'productId',
        message: 'Product is not available'
      }])
    }

    if (sku.stock < quantity) {
      return createValidationErrorResponse([{
        field: 'quantity',
        message: `Only ${sku.stock} items available in stock`
      }])
    }

    // Return validated product data for client-side cart
    return Response.json({
      success: true,
      data: {
        sku,
        validated: true,
        availableStock: sku.stock
      },
      message: 'Item validated successfully. Manage cart client-side.'
    })
    
  } catch (error) {
    logger.error('Failed to validate cart item', {
      productId,
      skuId,
      quantity
    }, error instanceof Error ? error : new Error(String(error)))
    
    return createServerErrorResponse('Failed to validate cart item')
  }
}

// PUT - Validate stock for cart update
export async function PUT(request: NextRequest) {
  let skuId: string | undefined
  let quantity: number | undefined
  
  try {
    // Validate request body
    const validation = await validateRequestBody(request, schemas.updateCartItem.extend({
      skuId: z.string().uuid('Invalid SKU ID')
    }))
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    skuId = validation.data.skuId
    quantity = validation.data.quantity

    // Find SKU to validate stock
    const sku = await prisma.productSku.findUnique({
      where: { id: skuId },
      include: { product: true }
    })

    if (!sku) {
      return createValidationErrorResponse([{
        field: 'skuId',
        message: 'SKU not found'
      }])
    }

    // Check stock availability
    if (quantity > sku.stock) {
      return createValidationErrorResponse([{
        field: 'quantity',
        message: `Only ${sku.stock} items available in stock`
      }])
    }

    return Response.json({
      success: true,
      data: {
        skuId,
        validatedQuantity: quantity,
        availableStock: sku.stock,
        isActive: sku.product.isActive
      },
      message: 'Stock validated successfully'
    })
    
  } catch (error) {
    logger.error('Failed to validate stock for cart', {
      skuId,
      quantity
    }, error instanceof Error ? error : new Error(String(error)))
    
    return createServerErrorResponse('Failed to validate stock')
  }
}

// PATCH - Validate multiple cart items for archived/deleted products
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return createValidationErrorResponse([{
        field: 'items',
        message: 'Items must be an array'
      }])
    }

    const validationResults = await Promise.all(
      items.map(async (item: CartItem) => {
        try {
          const sku = await prisma.productSku.findUnique({
            where: { id: item.skuId },
            include: { 
              product: true,
              reservations: {
                where: {
                  expiresAt: {
                    gt: new Date()
                  }
                }
              }
            }
          })

          if (!sku) {
            return {
              skuId: item.skuId,
              isValid: false,
              reason: 'Product deleted',
              availableStock: 0,
              shouldRemove: true
            }
          }

          if (!sku.product.isActive) {
            return {
              skuId: item.skuId,
              isValid: false,
              reason: 'Product archived',
              availableStock: 0,
              shouldRemove: true
            }
          }

          // Calculate available stock considering reservations
          const reservedStock = sku.reservations.reduce((sum, res) => sum + res.quantity, 0)
          const availableStock = Math.max(0, sku.stock - reservedStock)

          if (availableStock < item.quantity) {
            return {
              skuId: item.skuId,
              isValid: false,
              reason: 'Insufficient stock',
              availableStock,
              maxQuantity: availableStock,
              shouldUpdate: true
            }
          }

          return {
            skuId: item.skuId,
            isValid: true,
            availableStock,
            product: {
              id: sku.product.id,
              name: sku.product.name,
              slug: sku.product.slug
            }
          }
        } catch (error) {
          logger.error('Error validating cart item', {
            skuId: item.skuId
          }, error instanceof Error ? error : new Error(String(error)))

          return {
            skuId: item.skuId,
            isValid: false,
            reason: 'Validation error',
            shouldRemove: true
          }
        }
      })
    )

    const invalidItems = validationResults.filter(result => !result.isValid)
    const validItems = validationResults.filter(result => result.isValid)

    logger.info('Cart validation completed', {
      totalItems: items.length,
      validItems: validItems.length,
      invalidItems: invalidItems.length,
      itemsToRemove: invalidItems.filter(item => item.shouldRemove).length,
      itemsToUpdate: invalidItems.filter(item => item.shouldUpdate).length
    })

    return Response.json({
      success: true,
      data: {
        validationResults,
        summary: {
          totalItems: items.length,
          validItems: validItems.length,
          invalidItems: invalidItems.length,
          needsCleanup: invalidItems.length > 0
        }
      },
      message: 'Cart validation completed'
    })

  } catch (error) {
    logger.error('Failed to validate cart items', {}, error instanceof Error ? error : new Error(String(error)))
    return createServerErrorResponse('Failed to validate cart items')
  }
}

// DELETE - Cart operations not needed (client-side managed)
export async function DELETE(request: NextRequest) {
  return Response.json({
    success: true,
    message: 'Cart is managed client-side. No server-side deletion needed.'
  })
}