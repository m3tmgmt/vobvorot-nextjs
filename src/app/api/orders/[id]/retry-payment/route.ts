import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { westernbid } from '@/lib/westernbid'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    
    // Find the existing order
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

    // Check if order is eligible for retry
    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      )
    }

    logger.info('Retrying payment for order', {
      orderNumber: order.orderNumber,
      orderId: order.id,
      paymentStatus: order.paymentStatus
    })

    // Recreate payment request from order data
    const paymentRequest = {
      orderId: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency || 'USD',
      description: `Retry Payment - Order ${order.orderNumber} - ${order.items.length} items`,
      customerEmail: order.shippingEmail,
      customerName: order.shippingName,
      customerPhone: order.shippingPhone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        isRetry: true,
        originalPaymentId: order.paymentId,
        itemCount: order.items.length,
        shippingCountry: order.shippingCountry,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: '', // Not stored in current schema
        shippingZip: order.shippingZip
      }
    }

    // Get preferred payment method from request body if provided
    const body = await request.json().catch(() => ({}))
    const preferredMethod = body.paymentMethod || 'stripe'

    // Create new payment session
    const paymentResult = await westernbid.createPayment(paymentRequest)
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      // Generate WesternBid form data
      const formData = westernbid.generatePaymentFormData(
        paymentRequest, 
        paymentResult.paymentId || `wb_retry_${Date.now()}_${order.orderNumber}`,
        preferredMethod
      )

      // Update order with new payment information
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PENDING',
          paymentId: paymentResult.paymentId,
          sessionId: paymentResult.sessionId,
          paymentMethod: preferredMethod
        }
      })

      logger.info('Payment retry session created', {
        orderNumber: order.orderNumber,
        newPaymentId: paymentResult.paymentId,
        paymentMethod: preferredMethod
      })

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentUrl: paymentResult.paymentUrl,
        paymentId: paymentResult.paymentId,
        sessionId: paymentResult.sessionId,
        formData: formData,
        paymentGateway: 'westernbid',
        targetUrl: 'https://shop.westernbid.info',
        message: 'Payment retry session created successfully'
      })
    } else {
      logger.error('Payment retry failed', {
        orderNumber: order.orderNumber,
        error: paymentResult.error
      })

      return NextResponse.json(
        { 
          error: 'Failed to create retry payment session',
          details: paymentResult.error
        },
        { status: 400 }
      )
    }

  } catch (error) {
    logger.error('Order payment retry failed', {
      orderId: params.id
    }, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    )
  }
}