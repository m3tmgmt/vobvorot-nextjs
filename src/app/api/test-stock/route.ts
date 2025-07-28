import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE STOCK TEST ===')
    
    // Test 1: Simple query
    const sku = await prisma.productSku.findFirst({
      where: { isActive: true, stock: { gt: 0 } }
    })
    
    if (!sku) {
      return NextResponse.json({ error: 'No active SKU found' })
    }
    
    console.log('Found SKU:', sku.id, 'stock:', sku.stock)
    
    // Test 2: Find an existing order to use
    const existingOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'No existing order found for testing' })
    }
    
    // Test 2: Try to create a simple reservation
    const reservation = await prisma.stockReservation.create({
      data: {
        skuId: sku.id,
        quantity: 1,
        orderId: existingOrder.id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        status: 'ACTIVE'
      }
    })
    
    console.log('Created reservation:', reservation.id)
    
    // Test 3: Clean up
    await prisma.stockReservation.delete({
      where: { id: reservation.id }
    })
    
    console.log('Cleaned up reservation')
    
    return NextResponse.json({
      success: true,
      message: 'Stock reservation test passed',
      testedSku: sku.id,
      reservationId: reservation.id
    })
    
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}