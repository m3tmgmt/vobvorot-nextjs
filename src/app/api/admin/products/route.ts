import { NextRequest, NextResponse } from 'next/server'
import { getProducts, addProduct, updateProduct, deleteProduct, categories, sharedProducts } from '@/lib/shared-data'

// GET - получить товары с фильтрацией
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации админа
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const lowStock = searchParams.get('lowStock') // товары с низким остатком

    const result = getProducts({
      category,
      search,
      status,
      limit,
      offset: (page - 1) * limit
    })

    // Фильтр товаров с низким остатком
    let filteredProducts = result.products
    if (lowStock === 'true') {
      filteredProducts = filteredProducts.filter(product => product.stock <= 5)
    }

    // Статистика
    const stats = {
      total: sharedProducts.length,
      active: sharedProducts.filter(p => p.status === 'active').length,
      inactive: sharedProducts.filter(p => p.status === 'inactive').length,
      lowStock: sharedProducts.filter(p => p.stock <= 5).length,
      outOfStock: sharedProducts.filter(p => p.stock === 0).length
    }

    return NextResponse.json({
      products: filteredProducts,
      categories,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - создать новый товар
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации админа
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, brand, category, price, stock, sizes, colors, images, video } = body

    // Валидация обязательных полей
    if (!name || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, price' 
      }, { status: 400 })
    }

    // Найти или создать категорию
    let categoryData = categories.find(cat => cat.name.toLowerCase() === (category || '').toLowerCase())
    if (!categoryData) {
      const categorySlug = (category || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      categoryData = {
        id: `cat-${categorySlug}`,
        name: category || 'General',
        slug: categorySlug
      }
    }

    // Создать новый товар через общую функцию
    const newProduct = addProduct({
      name,
      description: description || '',
      brand: brand || 'EXVICPMOUR',
      category: categoryData,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      sizes: sizes || [],
      colors: colors || [],
      images: images ? [{ url: images[0] || '/products/placeholder.jpg', alt: name, isPrimary: true }] : [{ url: '/products/placeholder.jpg', alt: name, isPrimary: true }],
      video: video || undefined
    })

    // В реальном проекте здесь будет:
    // 1. Сохранение в базе данных
    // 2. Генерация slug
    // 3. SEO оптимизация
    // 4. Уведомление в админ панель

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Product created successfully'
    })

  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - обновить товар
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, ...updates } = body

    // Обновить товар через общую функцию
    const updatedProduct = updateProduct(productId, updates)
    
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - удалить товар
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Удалить товар через общую функцию
    const deletedProduct = deleteProduct(productId)
    
    if (!deletedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      deletedProduct
    })

  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}