import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET - получить актуальные остатки всех товаров
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        skus: {
          where: { isActive: true },
          select: {
            id: true,
            stock: true,
            reservedStock: true,
            price: true,
            size: true,
            color: true
          }
        }
      }
    })

    // Calculate available stock for each SKU
    const stockData = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      skus: product.skus.map(sku => ({
        id: sku.id,
        stock: sku.stock,
        reservedStock: sku.reservedStock || 0,
        availableStock: Math.max(0, sku.stock - (sku.reservedStock || 0)),
        price: sku.price,
        size: sku.size,
        color: sku.color
      }))
    }))

    logger.info('Stock data fetched', {
      productsCount: stockData.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      products: stockData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to fetch stock data', {}, 
      error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stock data'
    }, { status: 500 })
  }
}