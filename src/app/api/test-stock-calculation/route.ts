import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        slug: 'rare-heels-1750108796809',
        isActive: true 
      },
      include: {
        skus: {
          where: { isActive: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Test the stock calculation logic
    const enhancedSkus = product.skus.map(sku => {
      const availableStock = Math.max(0, sku.stock - (sku.reservedStock || 0))
      
      console.log('🧪 Test stock calculation:', {
        skuId: sku.id,
        size: sku.size,
        stock: sku.stock,
        reservedStock: sku.reservedStock,
        calculatedAvailable: availableStock,
        timestamp: new Date().toISOString()
      })
      
      return {
        id: sku.id,
        size: sku.size,
        stock: sku.stock,
        reservedStock: sku.reservedStock || 0,
        availableStock: availableStock,
        totalStock: sku.stock
      }
    })

    return NextResponse.json({
      productName: product.name,
      slug: product.slug,
      skus: enhancedSkus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}