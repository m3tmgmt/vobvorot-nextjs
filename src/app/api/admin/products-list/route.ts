import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'

    // Получить товары из базы данных
    const products = await prisma.product.findMany({
      where: includeArchived ? {} : { isActive: true },
      include: {
        skus: {
          select: {
            id: true,
            size: true,
            price: true,
            stock: true,
            isActive: true
          }
        },
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: {
            url: true,
            alt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Преобразовать в формат для телеграм бота
    const formattedProducts = products.map(product => {
      const primarySku = product.skus[0] // Берем первый SKU
      const primaryImage = product.images[0]
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        isActive: product.isActive,
        slug: product.slug,
        videoUrl: product.videoUrl,
        category: product.category.name,
        categorySlug: product.category.slug,
        price: primarySku ? parseFloat(primarySku.price) : 0,
        stock: primarySku ? primarySku.stock : 0,
        size: primarySku ? primarySku.size : 'Standard',
        skuId: primarySku ? primarySku.id : null,
        image: primaryImage ? primaryImage.url : null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    })

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      count: formattedProducts.length,
      includeArchived
    })

  } catch (error) {
    console.error('Get products list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get products list',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}