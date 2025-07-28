import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { westernbid } from '@/lib/westernbid'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Validation schema for refund requests
const refundSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  reason: z.string().min(1, 'Refund reason is required'),
  amount: z.number().positive().optional(), // Optional for partial refunds
  adminId: z.string().min(1, 'Admin ID is required')
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const validation = refundSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { orderId, reason, amount, adminId } = validation.data

    // Find the order in database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order has a payment record
    if (!order.payment || !order.payment.paymentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No payment record found for this order' 
        },
        { status: 400 }
      )
    }

    // Check if order is already refunded
    if (order.status === 'REFUNDED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Order is already refunded' 
        },
        { status: 400 }
      )
    }

    // Check if order status allows refunding
    if (!['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Order status does not allow refunding' 
        },
        { status: 400 }
      )
    }

    // Process refund through WesternBid
    const refundAmount = amount || Number(order.total)
    const refundResult = await westernbid.refundPayment({
      paymentId: order.payment.paymentId,
      amount: refundAmount,
      reason: reason,
      metadata: {
        orderId: orderId,
        adminId: adminId,
        originalAmount: order.total,
        refundDate: new Date().toISOString(),
        customerEmail: order.user?.email || order.shippingEmail
      }
    })

    if (!refundResult.success) {
      logger.error('WesternBid refund failed', {
        orderId,
        paymentId: order.payment.paymentId,
        error: refundResult.error
      })

      return NextResponse.json(
        { 
          success: false, 
          error: refundResult.error || 'Refund processing failed',
          errorCode: refundResult.errorCode
        },
        { status: 400 }
      )
    }

    // Update order status and payment record in database
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REFUNDED',
          refundAmount: refundAmount,
          refundReason: reason,
          refundedAt: new Date(),
          refundedBy: adminId
        }
      })

      // Update payment record
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: {
          status: 'REFUNDED',
          refundId: refundResult.refundId,
          refundAmount: refundAmount,
          refundReason: reason,
          refundedAt: new Date()
        }
      })

      // Create refund log entry
      await tx.orderLog.create({
        data: {
          orderId: orderId,
          action: 'REFUND_PROCESSED',
          details: {
            refundId: refundResult.refundId,
            refundAmount: refundAmount,
            reason: reason,
            adminId: adminId,
            westernbidResponse: JSON.parse(JSON.stringify(refundResult))
          },
          userId: adminId
        }
      })
    })

    logger.info('Refund processed successfully', {
      orderId,
      refundId: refundResult.refundId,
      refundAmount,
      reason,
      adminId
    })

    return NextResponse.json({
      success: true,
      data: {
        refundId: refundResult.refundId,
        refundAmount: refundAmount,
        status: refundResult.status,
        orderId: orderId,
        message: 'Refund processed successfully'
      }
    })

  } catch (error) {
    logger.error('Refund API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during refund processing' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check refund status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const refundId = url.searchParams.get('refundId')
    const orderId = url.searchParams.get('orderId')

    if (!refundId && !orderId) {
      return NextResponse.json(
        { success: false, error: 'Either refundId or orderId is required' },
        { status: 400 }
      )
    }

    let order
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payment: true,
          orderLogs: {
            where: { action: 'REFUND_PROCESSED' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
    } else if (refundId) {
      order = await prisma.order.findFirst({
        where: {
          payment: {
            refundId: refundId
          }
        },
        include: {
          payment: true,
          orderLogs: {
            where: { action: 'REFUND_PROCESSED' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order or refund not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderStatus: order.status,
        refundId: order.payment?.refundId,
        refundAmount: order.refundAmount,
        refundReason: order.refundReason,
        refundedAt: order.refundedAt,
        refundedBy: order.refundedBy,
        paymentStatus: order.payment?.status,
        refundLogs: order.orderLogs.map(log => ({
          id: log.id,
          action: log.action,
          details: log.details,
          createdAt: log.createdAt,
          userId: log.userId
        }))
      }
    })

  } catch (error) {
    logger.error('Refund status check error', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      { success: false, error: 'Failed to check refund status' },
      { status: 500 }
    )
  }
}