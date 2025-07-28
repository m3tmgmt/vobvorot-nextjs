import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()
    console.log('=== CART DEBUGGING ===')
    console.log('Items received:', JSON.stringify(items, null, 2))

    const debugInfo = {
      timestamp: new Date().toISOString(),
      receivedItems: items,
      skuChecks: [] as any[]
    }

    // Check each SKU in the database
    for (const item of items) {
      console.log(`Checking SKU: ${item.skuId}`)
      
      const sku = await prisma.productSku.findUnique({
        where: { id: item.skuId },
        include: {
          product: {
            select: { name: true, isActive: true }
          },
          reservations: {
            where: {
              expiresAt: { gt: new Date() }
            }
          }
        }
      })

      const skuDebug = {
        skuId: item.skuId,
        requestedQuantity: item.quantity,
        found: !!sku,
        skuData: sku ? {
          id: sku.id,
          stock: sku.stock,
          reservedStock: sku.reservedStock,
          isActive: sku.isActive,
          productName: sku.product?.name,
          productActive: sku.product?.isActive,
          availableStock: sku.stock - sku.reservedStock,
          activeReservations: sku.reservations.length,
          reservationDetails: sku.reservations.map(r => ({
            id: r.id,
            quantity: r.quantity,
            orderId: r.orderId,
            expiresAt: r.expiresAt
          }))
        } : null
      }

      debugInfo.skuChecks.push(skuDebug)
      console.log(`SKU ${item.skuId} debug:`, JSON.stringify(skuDebug, null, 2))
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get overall database state
    const stats = await Promise.all([
      prisma.productSku.count(),
      prisma.productSku.count({ where: { isActive: true } }),
      prisma.productSku.count({ where: { stock: { gt: 0 } } }),
      prisma.stockReservation.count(),
      prisma.stockReservation.count({ where: { expiresAt: { gt: new Date() } } })
    ])

    const recentProducts = await prisma.productSku.findMany({
      take: 5,
      include: {
        product: { select: { name: true, slug: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats: {
        totalSkus: stats[0],
        activeSkus: stats[1],
        skusWithStock: stats[2],
        totalReservations: stats[3],
        activeReservations: stats[4]
      },
      recentProducts: recentProducts.map(sku => ({
        id: sku.id,
        productName: sku.product?.name,
        slug: sku.product?.slug,
        stock: sku.stock,
        reservedStock: sku.reservedStock,
        available: sku.stock - sku.reservedStock,
        isActive: sku.isActive
      }))
    })

  } catch (error) {
    console.error('Debug GET error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}