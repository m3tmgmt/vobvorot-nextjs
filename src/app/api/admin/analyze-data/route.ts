import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Получить статистику всех данных в базе
    const [
      productsCount,
      skusCount,
      ordersCount,
      orderItemsCount,
      usersCount,
      reservationsCount,
      settingsCount,
      categoriesCount,
      imagesCount
    ] = await Promise.all([
      prisma.product.count(),
      prisma.productSku.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.user.count(),
      prisma.stockReservation.count(),
      prisma.setting.count(),
      prisma.category.count(),
      prisma.productImage.count()
    ])

    // Получить примеры данных для анализа
    const [
      sampleProducts,
      sampleOrders,
      sampleUsers,
      sampleReservations
    ] = await Promise.all([
      prisma.product.findMany({
        take: 5,
        include: {
          skus: true,
          images: true,
          category: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        take: 5,
        include: {
          items: true,
          user: { select: { id: true, email: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: { select: { orders: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockReservation.findMany({
        take: 5,
        include: {
          sku: { include: { product: { select: { name: true } } } },
          order: { select: { orderNumber: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Статистика по статусам заказов
    const orderStatuses = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    // Статистика по SKU (цены находятся в ProductSku)
    const skuStats = await prisma.productSku.aggregate({
      _sum: { price: true, stock: true, reservedStock: true },
      _avg: { price: true, stock: true },
      _max: { price: true, stock: true },
      _min: { price: true, stock: true },
      _count: { id: true }
    })

    return NextResponse.json({
      success: true,
      summary: {
        products: productsCount,
        skus: skusCount,
        orders: ordersCount,
        orderItems: orderItemsCount,
        users: usersCount,
        reservations: reservationsCount,
        settings: settingsCount,
        categories: categoriesCount,
        images: imagesCount
      },
      statistics: {
        orderStatuses,
        skuStats
      },
      samples: {
        products: sampleProducts,
        orders: sampleOrders,
        users: sampleUsers,
        reservations: sampleReservations
      },
      analysis: {
        hasTestData: productsCount > 0 || ordersCount > 0,
        isCleanDatabase: productsCount === 0 && ordersCount === 0 && usersCount === 0,
        recommendCleanup: productsCount > 0 || ordersCount > 0
      }
    })

  } catch (error) {
    console.error('Data analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze data',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}