import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order')
    const amount = searchParams.get('amount')

    if (!orderNumber || !amount) {
      return NextResponse.json(
        { error: 'Missing order or amount parameter' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
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

    logger.info('Creating Stripe checkout session', {
      orderNumber,
      amount: Number(amount),
      customerEmail: order.shippingEmail,
      itemCount: order.items.length
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: order.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.sku.product.name,
            description: item.sku.sku,
            images: item.sku.product.images[0] ? [item.sku.product.images[0].url] : []
          },
          unit_amount: Math.round(Number(item.price) * 100) // Convert to cents
        },
        quantity: item.quantity
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel?order=${orderNumber}`,
      customer_email: order.shippingEmail,
      metadata: {
        orderNumber: order.orderNumber,
        orderId: order.id
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'UA']
      }
    })

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        sessionId: session.id,
        paymentStatus: 'PENDING'
      }
    })

    logger.info('Stripe checkout session created successfully', {
      orderNumber,
      sessionId: session.id,
      checkoutUrl: session.url
    })

    // Redirect to Stripe checkout
    if (session.url) {
      return NextResponse.redirect(session.url)
    } else {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Stripe checkout session creation failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}