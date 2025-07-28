import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  reserveStock, 
  checkStockAvailability, 
  type InventoryItem 
} from '@/lib/inventory-management'

export async function POST(request: NextRequest) {
  try {
    const { skuId, quantity = 1 } = await request.json()
    
    console.log('=== STOCK DEBUG START ===')
    console.log('Input:', { skuId, quantity })
    
    // Step 1: Check if SKU exists
    const sku = await prisma.productSku.findUnique({
      where: { id: skuId },
      include: { 
        product: true,
        reservations: true 
      }
    })
    
    console.log('SKU found:', sku ? {
      id: sku.id,
      sku: sku.sku,
      stock: sku.stock,
      reservedStock: sku.reservedStock,
      isActive: sku.isActive,
      productName: sku.product.name,
      reservationsCount: sku.reservations.length
    } : 'NOT FOUND')
    
    if (!sku) {
      return NextResponse.json({
        error: 'SKU not found',
        skuId
      }, { status: 404 })
    }
    
    // Step 2: Check availability manually
    const availableStock = sku.stock - sku.reservedStock
    console.log('Available stock calculation:', {
      total: sku.stock,
      reserved: sku.reservedStock,
      available: availableStock,
      requested: quantity
    })
    
    // Step 3: Test checkStockAvailability function
    const inventoryItems: InventoryItem[] = [{ skuId, quantity }]
    const stockCheck = await checkStockAvailability(inventoryItems)
    console.log('Stock availability check:', stockCheck)
    
    // Step 4: Try to reserve if available
    let reservationResult = null
    if (stockCheck.available) {
      try {
        console.log('Attempting to reserve stock...')
        const reservationResults = await reserveStock(inventoryItems, 'debug-order')
        reservationResult = reservationResults[0]
        console.log('Reservation result:', reservationResult)
        
        // Clean up test reservation
        if (reservationResult.success && reservationResult.reservationId) {
          await prisma.stockReservation.delete({
            where: { id: reservationResult.reservationId }
          })
          
          // Decrement reserved stock
          await prisma.productSku.update({
            where: { id: skuId },
            data: {
              reservedStock: {
                decrement: quantity
              }
            }
          })
          console.log('Test reservation cleaned up')
        }
      } catch (reserveError) {
        console.error('Reservation error:', reserveError)
        reservationResult = {
          success: false,
          error: reserveError instanceof Error ? reserveError.message : String(reserveError)
        }
      }
    }
    
    // Step 5: Check current reservations
    const currentReservations = await prisma.stockReservation.findMany({
      where: { skuId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    console.log('Current reservations:', currentReservations.map(r => ({
      id: r.id,
      quantity: r.quantity,
      orderId: r.orderId,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt
    })))
    
    console.log('=== STOCK DEBUG END ===')
    
    return NextResponse.json({
      debug: 'Stock reservation debug',
      sku: {
        id: sku.id,
        sku: sku.sku,
        stock: sku.stock,
        reservedStock: sku.reservedStock,
        isActive: sku.isActive,
        productName: sku.product.name
      },
      availability: {
        available: availableStock,
        requested: quantity,
        sufficient: availableStock >= quantity
      },
      stockCheck,
      reservationResult,
      currentReservations: currentReservations.map(r => ({
        id: r.id,
        quantity: r.quantity,
        orderId: r.orderId,
        expiresAt: r.expiresAt,
        isExpired: r.expiresAt < new Date(),
        createdAt: r.createdAt
      }))
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get SKU from query params
    const { searchParams } = new URL(request.url)
    const skuId = searchParams.get('skuId')
    
    if (!skuId) {
      return NextResponse.json({ error: 'skuId parameter required' }, { status: 400 })
    }
    
    const sku = await prisma.productSku.findUnique({
      where: { id: skuId },
      include: { 
        product: true,
        reservations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!sku) {
      return NextResponse.json({ error: 'SKU not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      sku: {
        id: sku.id,
        sku: sku.sku,
        stock: sku.stock,
        reservedStock: sku.reservedStock,
        isActive: sku.isActive,
        productName: sku.product.name,
        productId: sku.productId
      },
      reservations: sku.reservations.map(r => ({
        id: r.id,
        quantity: r.quantity,
        orderId: r.orderId,
        expiresAt: r.expiresAt,
        isExpired: r.expiresAt < new Date(),
        createdAt: r.createdAt
      })),
      availability: {
        total: sku.stock,
        reserved: sku.reservedStock,
        available: sku.stock - sku.reservedStock
      }
    })
    
  } catch (error) {
    console.error('Debug GET error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}