import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      categorySlug,
      price,
      stock,
      imageUrl,
      brand,
      videoUrl,
      size
    } = body

    // Валидация обязательных полей
    if (!name || !description || !categorySlug || !price || !stock) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'description', 'categorySlug', 'price', 'stock']
      }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Найти или создать категорию
      let category = await tx.category.findUnique({
        where: { slug: categorySlug }
      })

      if (!category) {
        // Создать новую категорию
        category = await tx.category.create({
          data: {
            name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
            slug: categorySlug,
            description: `${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)} category`,
            isActive: true,
            sortOrder: 0
          }
        })
      }

      // Создать продукт
      const product = await tx.product.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now()}`,
          description,
          brand,
          categoryId: category.id,
          videoUrl,
          isActive: true
        }
      })

      // Создать SKU для продукта
      const sku = await tx.productSku.create({
        data: {
          sku: `SKU-${product.id.slice(-8).toUpperCase()}`,
          size: size || 'Standard', // Добавляем размер
          price: price.toString(),
          stock: parseInt(stock),
          reservedStock: 0,
          lowStockThreshold: 5,
          productId: product.id,
          isActive: true
        }
      })

      // Создать изображение если указан URL
      let image = null
      if (imageUrl) {
        image = await tx.productImage.create({
          data: {
            url: imageUrl,
            alt: name,
            isPrimary: true,
            productId: product.id
          }
        })
      }

      return {
        product,
        sku,
        category,
        image
      }
    })

    return NextResponse.json({
      success: true,
      message: `Продукт "${name}" успешно создан`,
      data: {
        productId: result.product.id,
        productName: result.product.name,
        sku: result.sku.sku,
        size: result.sku.size,
        price: result.sku.price,
        stock: result.sku.stock,
        category: result.category.name,
        imageCreated: !!result.image
      }
    })

  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create product',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}