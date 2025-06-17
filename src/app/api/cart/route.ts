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

    // Verify SKU exists and is available
    const sku = await prisma.productSku.findUnique({
      where: { id: skuId },
      include: { 
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 }
          }
        }
      }
    })

    if (!sku) {
      return createValidationErrorResponse([{
        field: 'skuId',
        message: 'SKU not found'
      }])
    }

    if (!sku.product.isActive) {
      return createValidationErrorResponse([{
        field: 'productId',
        message: 'Product is not available'
      }])
    }

    // Calculate available stock (total stock minus reserved stock)
    const availableStock = Math.max(0, sku.stock - (sku.reservedStock || 0))
    
    if (availableStock < quantity) {
      return createValidationErrorResponse([{
        field: 'quantity',
        message: `Only ${availableStock} items available in stock`
      }])
    }

    // Return validated product data for client-side cart
    return Response.json({
      success: true,
      data: {
        sku,
        validated: true,
        availableStock: availableStock,
        totalStock: sku.stock,
        reservedStock: sku.reservedStock || 0
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

    // Calculate available stock (total stock minus reserved stock)
    const availableStock = Math.max(0, sku.stock - (sku.reservedStock || 0))
    
    // Check stock availability
    if (quantity > availableStock) {
      return createValidationErrorResponse([{
        field: 'quantity',
        message: `Only ${availableStock} items available in stock`
      }])
    }

    return Response.json({
      success: true,
      data: {
        skuId,
        validatedQuantity: quantity,
        availableStock: availableStock,
        totalStock: sku.stock,
        reservedStock: sku.reservedStock || 0,
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

// DELETE - Cart operations not needed (client-side managed)
export async function DELETE(request: NextRequest) {
  return Response.json({
    success: true,
    message: 'Cart is managed client-side. No server-side deletion needed.'
  })
}