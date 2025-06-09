import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { westernbid, type RefundRequest } from '@/lib/westernbid'
import { logRefund } from '@/lib/payment-logger'
import { sendTelegramNotification } from '@/lib/telegram-notifications'

// Create a refund
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { orderId, amount, reason, metadata } = await request.json()
    
    if (!orderId || !reason) {
      return NextResponse.json(
        { error: 'Order ID and reason are required' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderId
      },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (!order.paymentId) {
      return NextResponse.json(
        { error: 'No payment ID found for this order' },
        { status: 400 }
      )
    }

    if (order.paymentStatus !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only refund completed payments' },
        { status: 400 }
      )
    }

    if (order.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Order already refunded' },
        { status: 400 }
      )
    }

    // Validate refund amount
    const refundAmount = amount || order.total
    if (refundAmount > order.total) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed order total' },
        { status: 400 }
      )
    }

    // Log refund initiation
    logRefund({
      type: 'REFUND_INITIATED',
      orderId: order.orderNumber,
      paymentId: order.paymentId,
      amount: refundAmount,
      currency: order.currency || 'USD',
      reason,
      gateway: 'WESTERNBID',
      userId: session.user.id,
      metadata
    })

    // Process refund with WesternBid
    const refundRequest: RefundRequest = {
      paymentId: order.paymentId,
      amount: refundAmount < order.total ? refundAmount : undefined, // Partial or full refund
      reason,
      metadata: {
        ...metadata,
        orderId: order.orderNumber,
        adminUserId: session.user.id,
        adminUserEmail: session.user.email
      }
    }

    const refundResult = await westernbid.refundPayment(refundRequest)

    if (refundResult.success && refundResult.refundId) {
      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: refundAmount >= order.total ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          paymentStatus: refundAmount >= order.total ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAt: new Date(),
          refundAmount: refundAmount,
          refundReason: reason,
          refundId: refundResult.refundId,
          refundStatus: refundResult.status || 'PENDING'
        }
      })

      // Restore inventory for full refunds
      if (refundAmount >= order.total) {
        for (const item of order.items) {
          await prisma.productSku.update({
            where: { id: item.skuId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })
        }
      }

      // Log successful refund
      logRefund({
        type: 'REFUND_COMPLETED',
        orderId: order.orderNumber,
        paymentId: order.paymentId,
        refundId: refundResult.refundId,
        amount: refundAmount,
        currency: order.currency || 'USD',
        reason,
        gateway: 'WESTERNBID',
        userId: session.user.id,
        metadata: {
          ...metadata,
          refundStatus: refundResult.status
        }
      })

      // Send notifications
      try {
        const notificationMessage = `
💸 Refund Processed

🛒 Order: ${order.orderNumber}
💰 Refund Amount: $${refundAmount}
💵 Original Amount: $${order.total}
📝 Reason: ${reason}
👤 Customer: ${order.shippingName}
📧 Email: ${order.shippingEmail}
🔄 Refund ID: ${refundResult.refundId}
📊 Status: ${refundResult.status}
        `.trim()

        await sendTelegramNotification(notificationMessage)
      } catch (notificationError) {
        console.error('Failed to send refund notification:', notificationError)
      }

      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          refundId: refundResult.refundId,
          amount: refundAmount,
          status: refundResult.status,
          orderId: order.orderNumber,
          processedAt: new Date().toISOString()
        },
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          paymentStatus: updatedOrder.paymentStatus,
          refundAmount: updatedOrder.refundAmount
        }
      })
    } else {
      // Log failed refund
      logRefund({
        type: 'REFUND_FAILED',
        orderId: order.orderNumber,
        paymentId: order.paymentId,
        amount: refundAmount,
        currency: order.currency || 'USD',
        reason,
        gateway: 'WESTERNBID',
        userId: session.user.id,
        metadata,
        error: new Error(refundResult.error || 'Refund processing failed')
      })

      return NextResponse.json(
        { 
          error: 'Refund processing failed',
          details: refundResult.error,
          errorCode: refundResult.errorCode
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Refund processing error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get refund status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const refundId = searchParams.get('refundId')

    if (!orderId && !refundId) {
      return NextResponse.json(
        { error: 'Order ID or Refund ID is required' },
        { status: 400 }
      )
    }

    let whereClause: any = {}
    
    if (orderId) {
      whereClause.orderNumber = orderId
    }
    
    if (refundId) {
      whereClause.refundId = refundId
    }

    // Find orders with refunds
    const orders = await prisma.order.findMany({
      where: {
        ...whereClause,
        refundId: {
          not: null
        }
      },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: {
        refundedAt: 'desc'
      }
    })

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No refunds found' },
        { status: 404 }
      )
    }

    const refunds = orders.map(order => ({
      refundId: order.refundId,
      orderId: order.orderNumber,
      amount: order.refundAmount,
      originalAmount: order.total,
      currency: order.currency || 'USD',
      reason: order.refundReason,
      status: order.refundStatus || 'UNKNOWN',
      processedAt: order.refundedAt,
      customer: {
        name: order.shippingName,
        email: order.shippingEmail
      },
      items: order.items.map(item => ({
        name: item.sku.product.name,
        quantity: item.quantity,
        price: item.price
      }))
    }))

    return NextResponse.json({
      success: true,
      refunds: orderId || refundId ? refunds : refunds.slice(0, 50) // Limit results
    })

  } catch (error) {
    console.error('Get refunds error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}