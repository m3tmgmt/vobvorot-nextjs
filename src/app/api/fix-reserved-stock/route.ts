import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXING RESERVED STOCK SYNC ===')
    
    // Get all SKUs with their current active reservations
    const skus = await prisma.productSku.findMany({
      include: {
        reservations: {
          where: {
            expiresAt: {
              gt: new Date() // Only active (non-expired) reservations
            }
          }
        }
      }
    })

    let fixedCount = 0

    for (const sku of skus) {
      // Calculate actual reserved stock from active reservations
      const actualReserved = sku.reservations.reduce((sum, reservation) => sum + reservation.quantity, 0)
      
      // Update reservedStock to match reality
      if (sku.reservedStock !== actualReserved) {
        await prisma.productSku.update({
          where: { id: sku.id },
          data: { reservedStock: actualReserved }
        })
        
        console.log(`Fixed SKU ${sku.id}: ${sku.reservedStock} -> ${actualReserved}`)
        fixedCount++
      }
    }

    console.log(`Fixed ${fixedCount} SKUs with incorrect reservedStock`)
    console.log('=== RESERVED STOCK FIX COMPLETED ===')
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} SKUs with incorrect reservedStock`,
      fixedCount
    })
    
  } catch (error) {
    console.error('Reserved stock fix failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}