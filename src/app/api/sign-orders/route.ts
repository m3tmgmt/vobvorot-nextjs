import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { globalCRM } from '@/lib/crm-integration'
import { analytics } from '@/components/analytics/GoogleAnalytics'
import { westernbid } from '@/lib/westernbid'
import { emailService } from '@/lib/email'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { signName, email, extraNotes } = data
    const amount = 50 // Fixed price for sign photos
    const currency = 'USD'
    
    // Validate required fields
    if (!signName || !email) {
      return NextResponse.json(
        { error: 'Sign name and email are required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }
    
    // Generate order ID
    const orderId = `SIGN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    logger.info('Creating sign photo order', {
      orderId,
      signName,
      customerEmail: email,
      amount
    })
    
    // Create payment request for WesternBid
    const paymentRequest = {
      orderId: orderId,
      amount: amount,
      currency: currency,
      description: `Custom Sign Photo: "${signName}"`,
      customerEmail: email,
      customerName: signName,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?type=sign&orderId=${orderId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel?type=sign&orderId=${orderId}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        orderType: 'sign_photo',
        orderId: orderId,
        signName: signName,
        extraNotes: extraNotes || '',
        customerEmail: email,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }

    // Create payment with WesternBid
    const paymentResult = await westernbid.createPayment(paymentRequest)
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      // Save order to database
      const order = await prisma.order.create({
        data: {
          orderNumber: orderId,
          orderType: 'SIGN_PHOTO',
          status: 'PENDING',
          shippingName: signName,
          shippingEmail: email,
          shippingPhone: '',
          shippingAddress: 'Digital Delivery',
          shippingCity: 'Email',
          shippingCountry: 'Digital',
          shippingZip: '00000',
          subtotal: amount,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: amount,
          currency: currency,
          paymentMethod: 'westernbid',
          paymentStatus: 'PENDING',
          paymentId: paymentResult.paymentId,
          sessionId: paymentResult.sessionId,
          notes: extraNotes,
          signOrder: {
            create: {
              signName: signName,
              extraNotes: extraNotes || ''
            }
          }
        },
        include: {
          signOrder: true
        }
      })
      
      // Send confirmation email
      try {
        await emailService.sendSignOrderConfirmation({
          orderNumber: orderId,
          customerName: signName,
          customerEmail: email,
          signName: signName,
          extraNotes: extraNotes || '',
          amount: amount,
          estimatedDelivery: '2-7 days'
        })
        
        logger.info('Sign order confirmation email sent', {
          orderId,
          customerEmail: email
        })
      } catch (emailError) {
        logger.error('Failed to send sign order confirmation email', {
          orderId,
          customerEmail: email
        }, emailError instanceof Error ? emailError : new Error(String(emailError)))
        // Don't fail the order if email fails
      }
      
      // Notify CRM about new sign order
      if (globalCRM) {
        try {
          await globalCRM.notifyNewOrder({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderType: 'SIGN_PHOTO',
            customerEmail: order.shippingEmail,
            customerName: order.shippingName,
            items: [{
              name: `Custom Sign Photo: "${order.signOrder?.signName}"`,
              price: parseFloat(order.total.toString()),
              quantity: 1,
              sku: 'SIGN-PHOTO-001'
            }],
            total: parseFloat(order.total.toString()),
            paymentMethod: 'westernbid',
            shippingAddress: {
              name: order.shippingName,
              address1: order.shippingAddress,
              city: order.shippingCity,
              country: order.shippingCountry,
              postalCode: order.shippingZip
            },
            notes: order.notes || undefined
          })
          
          logger.info('CRM notification sent for sign order', { orderId })
        } catch (crmError) {
          logger.error('CRM notification failed for sign order', { orderId }, crmError instanceof Error ? crmError : new Error(String(crmError)))
        }
      }
      
      return NextResponse.json({
        success: true,
        orderId: orderId,
        paymentUrl: paymentResult.paymentUrl,
        paymentId: paymentResult.paymentId,
        sessionId: paymentResult.sessionId,
        message: 'Sign order created successfully',
        estimatedDelivery: '2-7 days'
      })
    } else {
      // Payment creation failed
      logger.error('WesternBid payment creation failed for sign order', {
        orderId,
        error: paymentResult.error,
        errorCode: paymentResult.errorCode
      })
      
      return NextResponse.json(
        { 
          error: 'Payment processing failed',
          details: paymentResult.error,
          errorCode: paymentResult.errorCode
        },
        { status: 400 }
      )
    }
    
  } catch (error) {
    logger.error('Sign order processing error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve order status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const orderNumber = searchParams.get('orderNumber')
    
    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'Order ID or Order Number required' },
        { status: 400 }
      )
    }
    
    // Fetch from database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          orderId ? { id: orderId } : {},
          orderNumber ? { orderNumber: orderNumber } : {}
        ],
        orderType: 'SIGN_PHOTO'
      },
      include: {
        signOrder: true,
        payment: true
      }
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Sign order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      signName: order.signOrder?.signName,
      extraNotes: order.signOrder?.extraNotes,
      photoUrl: order.signOrder?.photoUrl,
      deliveredAt: order.signOrder?.deliveredAt,
      estimatedDelivery: '2-7 days',
      message: order.signOrder?.photoUrl 
        ? 'Your sign photo is ready!' 
        : 'Your sign photo is being prepared'
    })
  } catch (error) {
    logger.error('Failed to fetch sign order', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to fetch order status' },
      { status: 500 }
    )
  }
}