import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { emailService, type OrderEmailData, type AdminNotificationData } from '@/lib/email'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', {
        error: err instanceof Error ? err.message : String(err)
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    logger.info('Stripe webhook received', {
      type: event.type,
      id: event.id
    })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        logger.info('Stripe checkout session completed', {
          sessionId: session.id,
          orderNumber: session.metadata?.orderNumber,
          paymentStatus: session.payment_status,
          amount: session.amount_total
        })

        if (session.payment_status === 'paid' && session.metadata?.orderNumber) {
          // Update order status
          const order = await prisma.order.update({
            where: { orderNumber: session.metadata.orderNumber },
            data: {
              paymentStatus: 'COMPLETED',
              status: 'CONFIRMED',
              paymentId: session.payment_intent as string
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

          // Send payment confirmation emails
          try {
            logger.info('Sending payment confirmation emails', {
              orderNumber: order.orderNumber,
              customerEmail: order.shippingEmail
            })

            // Prepare email data
            const emailData: OrderEmailData = {
              orderNumber: order.orderNumber,
              customerName: order.shippingName,
              customerEmail: order.shippingEmail,
              items: order.items.map(item => ({
                name: item.sku.product.name,
                quantity: item.quantity,
                price: Number(item.price),
                size: item.sku.size || undefined,
                color: item.sku.color || undefined,
                imageUrl: item.sku.product.images[0]?.url
              })),
              subtotal: Number(order.subtotal),
              shippingCost: Number(order.shippingCost),
              total: Number(order.total),
              shippingAddress: {
                name: order.shippingName,
                address: order.shippingAddress,
                city: order.shippingCity,
                country: order.shippingCountry,
                zip: order.shippingZip
              }
            }

            // Send payment confirmation email to customer
            await emailService.sendPaymentConfirmation(emailData)

            // Send admin notification
            const adminData: AdminNotificationData = {
              orderNumber: order.orderNumber,
              customerName: order.shippingName,
              customerEmail: order.shippingEmail,
              total: Number(order.total),
              itemCount: order.items.length,
              paymentMethod: 'Stripe',
              shippingAddress: `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingCountry}`
            }

            await emailService.sendAdminPaymentNotification(adminData)

            logger.info('Payment confirmation emails sent successfully', {
              orderNumber: order.orderNumber
            })

          } catch (emailError) {
            logger.error('Failed to send payment confirmation emails', {
              orderNumber: order.orderNumber,
              error: emailError instanceof Error ? emailError.message : String(emailError)
            })
          }

          logger.info('Order payment confirmed successfully', {
            orderNumber: order.orderNumber,
            paymentId: session.payment_intent,
            amount: session.amount_total
          })
        }
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session
        
        if (expiredSession.metadata?.orderNumber) {
          await prisma.order.update({
            where: { orderNumber: expiredSession.metadata.orderNumber },
            data: {
              paymentStatus: 'FAILED',
              failureReason: 'Checkout session expired'
            }
          })

          logger.info('Order marked as failed due to expired session', {
            orderNumber: expiredSession.metadata.orderNumber,
            sessionId: expiredSession.id
          })
        }
        break

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        logger.error('Stripe payment failed', {
          paymentIntentId: paymentIntent.id,
          lastError: paymentIntent.last_payment_error?.message
        })
        break

      default:
        logger.info('Unhandled Stripe webhook event type', {
          type: event.type
        })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logger.error('Stripe webhook processing failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}