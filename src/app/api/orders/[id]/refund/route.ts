import { NextRequest, NextResponse } from 'next/server'
import { refundOrder, RefundOrderRequest } from '@/lib/order-refund'
import { sendTelegramNotification } from '@/lib/telegram-notifications'

// POST /api/orders/[id]/refund - Process refund for an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params
    const body = await request.json()
    
    const { 
      reason, 
      amount, 
      adminId, 
      notifyCustomer = true 
    } = body

    // Validate required fields
    if (!reason || !adminId) {
      return NextResponse.json({
        error: 'Missing required fields: reason, adminId'
      }, { status: 400 })
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json({
        error: 'Amount must be a positive number'
      }, { status: 400 })
    }

    // Process the refund
    const refundRequest: RefundOrderRequest = {
      orderId,
      adminId,
      reason,
      amount,
      notifyCustomer
    }

    const result = await refundOrder(refundRequest)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to process refund'
      }, { status: 400 })
    }

    // Send Telegram notification to admin
    try {
      const notificationMessage = `💸 Возврат средств обработан\n\n` +
        `🆔 Заказ: #${orderId}\n` +
        `💰 Сумма: $${result.refundAmount}\n` +
        `📋 Причина: ${reason}\n` +
        `👤 Администратор: ${adminId}`
      
      await sendTelegramNotification(notificationMessage)
    } catch (notificationError) {
      console.warn('Failed to send Telegram notification:', notificationError)
      // Don't fail the refund if notification fails
    }

    return NextResponse.json({
      success: true,
      refundId: result.refundId,
      refundAmount: result.refundAmount,
      message: result.message
    })

  } catch (error) {
    console.error('Order refund API error:', error)
    return NextResponse.json({
      error: 'Internal server error during refund processing'
    }, { status: 500 })
  }
}

// GET /api/orders/[id]/refund - Get refund information for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params

    // Import prisma here to avoid edge runtime issues
    const { prisma } = await import('@/lib/prisma')

    // Get order with refund information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true
      }
    })

    if (!order) {
      return NextResponse.json({
        error: 'Order not found'
      }, { status: 404 })
    }

    // Determine refund eligibility
    const canRefund = order.status !== 'REFUNDED' && 
                     order.status !== 'CANCELLED' &&
                     order.paymentStatus === 'COMPLETED'

    const hasPartialRefund = order.status === 'PARTIALLY_REFUNDED'
    const maxRefundAmount = parseFloat(order.total.toString()) - (order.refundAmount ? parseFloat(order.refundAmount.toString()) : 0)

    return NextResponse.json({
      orderId,
      canRefund,
      hasPartialRefund,
      currentStatus: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: parseFloat(order.total.toString()),
      refundedAmount: order.refundAmount ? parseFloat(order.refundAmount.toString()) : 0,
      maxRefundAmount,
      refundHistory: [] // TODO: Add refund history from OrderLog table
    })

  } catch (error) {
    console.error('Get refund info API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}