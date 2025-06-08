import { NextRequest, NextResponse } from 'next/server'

// Mock data для товаров
const mockProducts = [
  {
    id: 'prod-001',
    name: 'Vintage Canon AE-1 Camera',
    description: 'Classic 35mm film camera from the 1980s. Fully functional with original leather case.',
    brand: 'Canon',
    categoryId: 'cat-cameras',
    category: { name: 'Vintage Cameras', slug: 'cameras' },
    price: 89.99,
    stock: 3,
    sizes: [],
    colors: [],
    images: [
      { url: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800', alt: 'Canon AE-1', isPrimary: true }
    ],
    status: 'active',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-08T15:30:00Z'
  },
  {
    id: 'prod-002',
    name: 'Custom Adidas Superstar',
    description: 'Hand-painted custom Adidas Superstar sneakers with unique Y2K design elements.',
    brand: 'Adidas Custom',
    categoryId: 'cat-shoes',
    category: { name: 'Custom Shoes', slug: 'shoes' },
    price: 125.50,
    stock: 5,
    sizes: ['US 7', 'US 8', 'US 9', 'US 10'],
    colors: ['White/Pink', 'Black/Cyan'],
    images: [
      { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', alt: 'Custom Adidas', isPrimary: true }
    ],
    status: 'active',
    createdAt: '2024-12-02T11:00:00Z',
    updatedAt: '2024-12-08T16:00:00Z'
  },
  {
    id: 'prod-003',
    name: 'Vintage Fur Hat',
    description: 'Authentic vintage fur hat from the 1970s. Perfect for cold weather and retro fashion.',
    brand: 'Vintage Collection',
    categoryId: 'cat-accessories',
    category: { name: 'Accessories', slug: 'accessories' },
    price: 67.99,
    stock: 2,
    sizes: ['S', 'M', 'L'],
    colors: ['Brown', 'Black'],
    images: [
      { url: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800', alt: 'Vintage Hat', isPrimary: true }
    ],
    status: 'active',
    createdAt: '2024-12-03T09:30:00Z',
    updatedAt: '2024-12-08T14:20:00Z'
  }
]

const mockCategories = [
  { id: 'cat-cameras', name: 'Vintage Cameras', slug: 'cameras' },
  { id: 'cat-shoes', name: 'Custom Shoes', slug: 'shoes' },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories' },
  { id: 'cat-fashion', name: 'Vintage Fashion', slug: 'fashion' },
  { id: 'cat-bags', name: 'Designer Bags', slug: 'bags' }
]

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

    let filteredProducts = [...mockProducts]

    // Фильтр по статусу
    if (status !== 'all') {
      filteredProducts = filteredProducts.filter(product => product.status === status)
    }

    // Фильтр по категории
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(product => product.categoryId === category)
    }

    // Поиск по названию, бренду, описанию
    if (search) {
      const searchLower = search.toLowerCase()
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      )
    }

    // Фильтр товаров с низким остатком
    if (lowStock === 'true') {
      filteredProducts = filteredProducts.filter(product => product.stock <= 5)
    }

    // Сортировка
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    filteredProducts.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'stock':
          aValue = a.stock
          bValue = b.stock
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })

    // Пагинация
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    // Статистика
    const stats = {
      total: mockProducts.length,
      active: mockProducts.filter(p => p.status === 'active').length,
      inactive: mockProducts.filter(p => p.status === 'inactive').length,
      lowStock: mockProducts.filter(p => p.stock <= 5).length,
      outOfStock: mockProducts.filter(p => p.stock === 0).length
    }

    return NextResponse.json({
      products: paginatedProducts,
      categories: mockCategories,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
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
    const { name, description, brand, categoryId, price, stock, sizes, colors } = body

    // Валидация обязательных полей
    if (!name || !description || !categoryId || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, description, categoryId, price' 
      }, { status: 400 })
    }

    // Найти категорию
    const category = mockCategories.find(cat => cat.id === categoryId)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }

    // Создать новый товар
    const newProduct = {
      id: `prod-${String(mockProducts.length + 1).padStart(3, '0')}`,
      name,
      description,
      brand: brand || 'EXVICPMOUR',
      categoryId,
      category,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      sizes: sizes || [],
      colors: colors || [],
      images: [], // Фото будут добавлены отдельно
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockProducts.push(newProduct)

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

    // Найти товар
    const productIndex = mockProducts.findIndex(product => product.id === productId)
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Обновить товар
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      product: mockProducts[productIndex],
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

    // Найти товар
    const productIndex = mockProducts.findIndex(product => product.id === productId)
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Удалить товар (или пометить как неактивный)
    const deletedProduct = mockProducts.splice(productIndex, 1)[0]

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