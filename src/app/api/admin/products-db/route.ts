import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Проверка админской авторизации
function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const adminApiKey = process.env.ADMIN_API_KEY || 'admin_secret_key_2024'
  
  return authHeader === `Bearer ${adminApiKey}`
}

// GET - получить товары из базы данных
export async function GET(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        skus: true,
        images: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    })
  } catch (error: any) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - создать новый товар в базе данных
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, brand, categoryId, price, stock, weight, sizes, colors } = body

    // Валидация обязательных полей
    if (!name || !price || !categoryId) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, price, categoryId' 
      }, { status: 400 })
    }

    // Создаем slug из названия
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Проверяем что slug уникальный
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })

    if (existingProduct) {
      return NextResponse.json({
        error: 'Product with this name already exists'
      }, { status: 400 })
    }

    // Создаем товар
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        brand: brand || null,
        categoryId,
        isActive: true,
        skus: {
          create: {
            sku: `${slug}-default`,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            weight: weight ? parseFloat(weight) : null,
            size: sizes && sizes.length > 0 ? sizes[0] : null,
            color: colors && colors.length > 0 ? colors[0] : null,
            isActive: true
          }
        }
      },
      include: {
        category: true,
        skus: true,
        images: true
      }
    })

    return NextResponse.json({
      success: true,
      product,
      message: 'Product created successfully'
    })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create product',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - обновить товар
export async function PUT(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, brand, price, stock, weight } = body

    if (!id) {
      return NextResponse.json({ 
        error: 'Product ID is required' 
      }, { status: 400 })
    }

    const updateData: any = {}
    
    if (name) {
      updateData.name = name
      updateData.slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }
    if (description !== undefined) updateData.description = description
    if (brand !== undefined) updateData.brand = brand

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        skus: true,
        images: true
      }
    })

    // Обновляем SKU если нужно
    if (price !== undefined || stock !== undefined || weight !== undefined) {
      const skuUpdateData: any = {}
      if (price !== undefined) skuUpdateData.price = parseFloat(price)
      if (stock !== undefined) skuUpdateData.stock = parseInt(stock)
      if (weight !== undefined) skuUpdateData.weight = parseFloat(weight)

      await prisma.productSku.updateMany({
        where: { productId: id },
        data: skuUpdateData
      })
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update product',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - удалить товар
export async function DELETE(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = new URL(request.url).searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: 'Product ID is required' 
      }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete product',
      details: error.message
    }, { status: 500 })
  }
}