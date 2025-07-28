import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { westernbid } from '@/lib/westernbid'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const orderId = resolvedParams.id
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Find the order in database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
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

    // Check if order is in a retryable state
    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      )
    }

    logger.info('Retrying payment for order', {
      orderId: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total)
    })

    // Reconstruct payment request from order data
    const paymentRequest = {
      orderId: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency || 'USD',
      description: `Retry Payment - Order ${order.orderNumber} - ${order.items.length} items`,
      customerEmail: order.shippingEmail,
      customerName: order.shippingName,
      customerPhone: order.shippingPhone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?orderId=${order.orderNumber}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel?orderId=${order.orderNumber}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        orderNumber: order.orderNumber,
        userId: order.userId || 'guest',
        userEmail: order.shippingEmail,
        itemCount: order.items.length,
        shippingCountry: order.shippingCountry,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState || '',
        shippingZip: order.shippingZip,
        isRetry: true,
        originalOrderId: order.id,
        retryAttempt: Date.now()
      }
    }

    // Create new payment session
    const paymentResult = await westernbid.createPayment(paymentRequest)
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      // Generate form data for direct WesternBid submission
      const preferredGate = order.paymentMethod === 'stripe' ? 'stripe' : 'paypal'
      const formData = westernbid.generatePaymentFormData(
        paymentRequest, 
        paymentResult.paymentId || `retry_${Date.now()}_${order.orderNumber}`,
        preferredGate
      )

      // Update order with new payment information
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PENDING',
          paymentId: paymentResult.paymentId,
          sessionId: paymentResult.sessionId,
          updatedAt: new Date()
        }
      })

      logger.info('Payment retry session created successfully', {
        orderId: order.orderNumber,
        paymentId: paymentResult.paymentId,
        preferredGate
      })

      return NextResponse.json({
        success: true,
        orderId: order.orderNumber,
        paymentId: paymentResult.paymentId,
        sessionId: paymentResult.sessionId,
        formData: formData,
        targetUrl: 'https://shop.westernbid.info',
        message: 'Payment retry session created'
      })
    } else {
      logger.error('Payment retry failed', {
        orderId: order.orderNumber,
        error: paymentResult.error,
        errorCode: paymentResult.errorCode
      })

      return NextResponse.json(
        {
          error: 'Failed to create retry payment session',
          details: paymentResult.error,
          errorCode: paymentResult.errorCode
        },
        { status: 400 }
      )
    }

  } catch (error) {
    logger.error('Retry payment API error', {
      orderId: 'unknown'
    }, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}