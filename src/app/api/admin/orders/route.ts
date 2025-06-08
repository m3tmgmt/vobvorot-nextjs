import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Mock data - в реальном проекте здесь будет подключение к базе данных
const mockOrders = [
  {
    id: 'ORD-001',
    status: 'pending',
    total: 89.99,
    customerName: 'Anna Kowalski',
    customerEmail: 'anna@example.com',
    items: [
      { name: 'Vintage Camera Canon AE-1', quantity: 1, price: 89.99 }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Warsaw',
      country: 'Poland',
      postalCode: '00-001'
    },
    createdAt: '2024-12-08T10:30:00Z',
    paymentStatus: 'paid',
    trackingNumber: null
  },
  {
    id: 'ORD-002', 
    status: 'processing',
    total: 125.50,
    customerName: 'Marco Silva',
    customerEmail: 'marco@example.com',
    items: [
      { name: 'Custom Adidas Sneakers', quantity: 1, price: 125.50 }
    ],
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Lisbon',
      country: 'Portugal',
      postalCode: '1000-001'
    },
    createdAt: '2024-12-07T14:20:00Z',
    paymentStatus: 'paid',
    trackingNumber: 'TRK123456789'
  },
  {
    id: 'ORD-003',
    status: 'shipped',
    total: 67.99,
    customerName: 'Emma Thompson',
    customerEmail: 'emma@example.com',
    items: [
      { name: 'Vintage Fur Hat', quantity: 1, price: 67.99 }
    ],
    shippingAddress: {
      street: '789 Pine St',
      city: 'London',
      country: 'UK',
      postalCode: 'SW1A 1AA'
    },
    createdAt: '2024-12-06T09:15:00Z',
    paymentStatus: 'paid',
    trackingNumber: 'TRK987654321'
  }
]

// GET - получить заказы с фильтрацией
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации админа
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

    let filteredOrders = [...mockOrders]

    // Фильтр по статусу
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status)
    }

    // Поиск по номеру заказа или email
    if (search) {
      filteredOrders = filteredOrders.filter(order => 
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Пагинация
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

    // Статистика по статусам
    const statusCounts = {
      total: mockOrders.length,
      pending: mockOrders.filter(o => o.status === 'pending').length,
      processing: mockOrders.filter(o => o.status === 'processing').length,
      shipped: mockOrders.filter(o => o.status === 'shipped').length,
      completed: mockOrders.filter(o => o.status === 'completed').length,
      cancelled: mockOrders.filter(o => o.status === 'cancelled').length
    }

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      },
      statusCounts
    })

  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - обновить статус заказа
export async function PUT(request: NextRequest) {
  try {
    // Проверка авторизации админа
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, status, trackingNumber, notes } = body

    // Валидация
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Найти заказ
    const orderIndex = mockOrders.findIndex(order => order.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Обновить заказ
    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(notes && { notes }),
      updatedAt: new Date().toISOString()
    }

    // В реальном проекте здесь будет:
    // 1. Обновление в базе данных
    // 2. Отправка email уведомления клиенту
    // 3. Логирование изменения статуса

    return NextResponse.json({
      success: true,
      order: mockOrders[orderIndex],
      message: `Order ${orderId} status updated to ${status}`
    })

  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - создать новый заказ (для тестирования)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newOrder = {
      id: `ORD-${String(mockOrders.length + 1).padStart(3, '0')}`,
      status: 'pending',
      ...body,
      createdAt: new Date().toISOString(),
      paymentStatus: 'paid'
    }

    mockOrders.push(newOrder)

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}