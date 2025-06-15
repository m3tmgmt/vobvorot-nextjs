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
    
    const { signName, email, phone, extraNotes, paymentMethod = 'westernbid_stripe' } = data
    const amount = 50 // Fixed price for sign photos
    const currency = 'USD'
    
    // Validate required fields
    if (!signName || !email || !phone) {
      return NextResponse.json(
        { error: 'Sign name, email, and phone number are required' },
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
      customerPhone: phone,
      paymentMethod: paymentMethod, // Include payment method
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?type=sign&orderId=${orderId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel?type=sign&orderId=${orderId}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        orderType: 'sign_photo',
        orderId: orderId,
        signName: signName,
        extraNotes: extraNotes || '',
        customerEmail: email,
        customerPhone: phone,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        // Digital product configuration
        isDigitalProduct: true,
        productType: 'digital',
        deliveryMethod: 'email',
        noShipping: true,
        // Digital delivery placeholders (already configured in database)
        shippingAddress: 'Digital Delivery',
        shippingCity: 'Email',
        shippingCountry: 'Digital',
        shippingZip: '00000'
      }
    }

    // Create payment with WesternBid
    const paymentResult = await westernbid.createPayment(paymentRequest)
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      // Generate WesternBid form data for direct client submission (like checkout API)
      const preferredGate = paymentMethod === 'westernbid_stripe' ? 'stripe' : 'paypal'
      const formData = westernbid.generatePaymentFormData(paymentRequest, paymentResult.paymentId || `wb_${Date.now()}_${orderId}`, preferredGate)
      
      // Save order to database
      const order = await prisma.order.create({
        data: {
          orderNumber: orderId,
          orderType: 'SIGN_PHOTO',
          status: 'PENDING',
          shippingName: signName,
          shippingEmail: email,
          shippingPhone: phone,
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
      
      // Note: Customer confirmation email will be sent via webhook after successful payment
      
      // Note: CRM notifications for sign orders will be sent via webhook after successful payment
      
      // Return the same format as checkout API for direct payment gateway submission
      const response: any = {
        success: true,
        orderId: orderId,
        paymentId: paymentResult.paymentId,
        sessionId: paymentResult.sessionId,
        message: 'Sign order created successfully',
        estimatedDelivery: '2-7 days'
      }

      // Add direct form submission data (always available now)
      response.formData = formData
      response.targetUrl = 'https://shop.westernbid.info'
      response.paymentGateway = 'westernbid'
      
      // DO NOT include paymentUrl to force direct form submission (avoids redirect page)

      return NextResponse.json(response)
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