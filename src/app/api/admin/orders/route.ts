import { NextRequest, NextResponse } from 'next/server'
import { getOrders, sharedOrders, updateOrder, addOrder } from '@/lib/shared-data'

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

    const result = getOrders({
      status,
      search,
      limit,
      offset: (page - 1) * limit
    })

    // Статистика по статусам
    const statusCounts = {
      total: sharedOrders.length,
      pending: sharedOrders.filter(o => o.status === 'pending').length,
      processing: sharedOrders.filter(o => o.status === 'processing').length,
      shipped: sharedOrders.filter(o => o.status === 'shipped').length,
      completed: sharedOrders.filter(o => o.status === 'completed').length,
      cancelled: sharedOrders.filter(o => o.status === 'cancelled').length
    }

    return NextResponse.json({
      orders: result.orders,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
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

    // Обновить заказ через общую функцию
    const updatedOrder = updateOrder(orderId, {
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(notes && { notes })
    })

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // В реальном проекте здесь будет:
    // 1. Обновление в базе данных
    // 2. Отправка email уведомления клиенту
    // 3. Логирование изменения статуса

    return NextResponse.json({
      success: true,
      order: updatedOrder,
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
    
    const newOrder = addOrder({
      status: 'pending',
      paymentStatus: 'paid',
      ...body
    })

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