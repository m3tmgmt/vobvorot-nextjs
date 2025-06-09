import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { westernbid, type WebhookData } from '@/lib/westernbid'
import { emailService, type OrderEmailData } from '@/lib/email'
import { sendTelegramNotification } from '@/lib/telegram-notifications'
import { logWebhook, logSecurityEvent } from '@/lib/payment-logger'
import { performSecurityCheck, getClientIP, verifyWebhookSignature } from '@/lib/payment-security'
import { isSecurityEnabled, getPaymentConfig } from '@/lib/payment-config'

// Webhook handler for WesternBid payment notifications
export async function POST(request: NextRequest) {
  let webhookData: WebhookData | null = null
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  
  try {
    // Get the raw payload
    const payload = await request.text()
    
    if (!payload) {
      logSecurityEvent({
        event: 'INVALID_WEBHOOK',
        message: 'Empty webhook payload received',
        ipAddress: clientIP,
        userAgent,
        metadata: { reason: 'empty_payload' }
      })
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    // Perform security checks
    const securityCheck = performSecurityCheck(request, '/api/webhooks/westernbid', payload)
    if (!securityCheck.allowed) {
      return NextResponse.json(
        { error: securityCheck.reason },
        { 
          status: securityCheck.statusCode || 403,
          headers: securityCheck.headers || {}
        }
      )
    }

    // Get signature from headers
    const headersList = await headers()
    const signature = headersList.get('X-Webhook-Signature') || 
                     headersList.get('x-webhook-signature') ||
                     headersList.get('X-Signature') ||
                     headersList.get('x-signature') || ''

    console.log('[WesternBid Webhook] Received webhook:', {
      payloadLength: payload.length,
      hasSignature: !!signature,
      signaturePreview: signature ? signature.substring(0, 10) + '...' : 'none',
      clientIP,
      userAgent: userAgent.substring(0, 50) + '...'
    })

    // Verify webhook signature
    const config = getPaymentConfig()
    const requireSignatureVerification = isSecurityEnabled('enableSignatureVerification') && 
                                        config.security.webhookSecretRequired

    if (requireSignatureVerification) {
      const webhookSecret = process.env.WESTERNBID_WEBHOOK_SECRET
      
      if (!webhookSecret) {
        logSecurityEvent({
          event: 'SIGNATURE_VERIFICATION_FAILED',
          message: 'Webhook secret not configured but signature verification is required',
          ipAddress: clientIP,
          userAgent,
          metadata: { reason: 'missing_webhook_secret' }
        })
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      const isValid = verifyWebhookSignature(payload, signature, webhookSecret)
      
      if (!isValid) {
        logSecurityEvent({
          event: 'SIGNATURE_VERIFICATION_FAILED',
          message: 'Invalid webhook signature',
          ipAddress: clientIP,
          userAgent,
          metadata: {
            signatureProvided: !!signature,
            signaturePreview: signature ? signature.substring(0, 10) + '...' : 'none',
            payloadLength: payload.length
          }
        })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse webhook data
    webhookData = westernbid.parseWebhookData(payload)
    
    if (!webhookData) {
      console.error('[WesternBid Webhook] Failed to parse webhook data')
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Log webhook event
    logWebhook({
      event: webhookData.event,
      orderId: webhookData.orderId,
      paymentId: webhookData.paymentId,
      status: webhookData.status,
      gateway: 'WESTERNBID',
      payload: webhookData,
      signature,
      verified: requireSignatureVerification ? true : false,
      ipAddress: clientIP,
      userAgent,
      metadata: {
        amount: webhookData.amount,
        currency: webhookData.currency,
        transactionId: webhookData.transactionId
      }
    })

    console.log('[WesternBid Webhook] Parsed webhook data:', {
      event: webhookData.event,
      paymentId: webhookData.paymentId,
      orderId: webhookData.orderId,
      status: webhookData.status
    })

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: webhookData.orderId
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
      console.error('[WesternBid Webhook] Order not found:', webhookData.orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Process webhook based on event type
    let updatedOrder
    
    switch (webhookData.event) {
      case 'payment.completed':
        updatedOrder = await handlePaymentCompleted(order, webhookData)
        break
        
      case 'payment.failed':
        updatedOrder = await handlePaymentFailed(order, webhookData)
        break
        
      case 'payment.cancelled':
        updatedOrder = await handlePaymentCancelled(order, webhookData)
        break
        
      case 'refund.completed':
        updatedOrder = await handleRefundCompleted(order, webhookData)
        break
        
      case 'refund.failed':
        updatedOrder = await handleRefundFailed(order, webhookData)
        break
        
      default:
        console.warn('[WesternBid Webhook] Unknown event type:', webhookData.event)
        return NextResponse.json({ message: 'Unknown event type' }, { status: 200 })
    }

    // Send notifications
    try {
      await sendNotifications(updatedOrder, webhookData)
    } catch (notificationError) {
      console.error('[WesternBid Webhook] Failed to send notifications:', notificationError)
      // Don't fail the webhook for notification errors
    }

    console.log('[WesternBid Webhook] Successfully processed webhook:', {
      event: webhookData.event,
      orderId: webhookData.orderId,
      newStatus: updatedOrder.status,
      newPaymentStatus: updatedOrder.paymentStatus
    })

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      orderId: webhookData.orderId,
      event: webhookData.event
    })

  } catch (error) {
    console.error('[WesternBid Webhook] Error processing webhook:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      webhookEvent: webhookData?.event,
      orderId: webhookData?.orderId
    })

    // Return 500 to trigger webhook retry
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle successful payment
async function handlePaymentCompleted(order: any, webhookData: WebhookData) {
  console.log('[WesternBid Webhook] Processing payment completed for order:', order.orderNumber)
  
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      paymentId: webhookData.paymentId,
      transactionId: webhookData.transactionId,
      paidAt: new Date()
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

  // Update inventory if needed
  for (const item of order.items) {
    await prisma.productSku.update({
      where: { id: item.skuId },
      data: {
        stock: {
          decrement: item.quantity
        }
      }
    })
  }

  return updatedOrder
}

// Handle failed payment
async function handlePaymentFailed(order: any, webhookData: WebhookData) {
  console.log('[WesternBid Webhook] Processing payment failed for order:', order.orderNumber)
  
  return await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'FAILED',
      paymentId: webhookData.paymentId,
      failureReason: webhookData.metadata?.failure_reason || 'Payment failed'
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
}

// Handle cancelled payment
async function handlePaymentCancelled(order: any, webhookData: WebhookData) {
  console.log('[WesternBid Webhook] Processing payment cancelled for order:', order.orderNumber)
  
  return await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'CANCELLED',
      paymentId: webhookData.paymentId
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
}

// Handle successful refund
async function handleRefundCompleted(order: any, webhookData: WebhookData) {
  console.log('[WesternBid Webhook] Processing refund completed for order:', order.orderNumber)
  
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'REFUNDED',
      paymentStatus: 'REFUNDED',
      refundedAt: new Date(),
      refundAmount: webhookData.amount,
      refundReason: webhookData.metadata?.refund_reason
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

  // Restore inventory
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

  return updatedOrder
}

// Handle failed refund
async function handleRefundFailed(order: any, webhookData: WebhookData) {
  console.log('[WesternBid Webhook] Processing refund failed for order:', order.orderNumber)
  
  return await prisma.order.update({
    where: { id: order.id },
    data: {
      refundStatus: 'FAILED',
      failureReason: webhookData.metadata?.failure_reason || 'Refund failed'
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
}

// Send notifications for order updates
async function sendNotifications(order: any, webhookData: WebhookData) {
  try {
    // Send email notification for payment completion
    if (webhookData.event === 'payment.completed') {
      const emailData: OrderEmailData = {
        orderNumber: order.orderNumber,
        customerName: order.shippingName,
        customerEmail: order.shippingEmail,
        items: order.items.map((item: any) => ({
          name: item.sku.product.name,
          quantity: item.quantity,
          price: item.price,
          size: item.sku.size || undefined,
          color: item.sku.color || undefined,
          imageUrl: item.sku.product.images[0]?.url
        })),
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        shippingAddress: {
          name: order.shippingName,
          address: order.shippingAddress,
          city: order.shippingCity,
          country: order.shippingCountry,
          zip: order.shippingZip
        }
      }

      await emailService.sendOrderConfirmation(emailData)
    }

    // Send Telegram notification
    const statusMessage = getStatusMessage(webhookData.event, order)
    await sendTelegramNotification(statusMessage)

  } catch (error) {
    console.error('[WesternBid Webhook] Failed to send notifications:', error)
    throw error
  }
}

// Get status message for Telegram
function getStatusMessage(event: string, order: any): string {
  const baseInfo = `
🛒 Order: ${order.orderNumber}
💰 Amount: $${order.total}
👤 Customer: ${order.shippingName}
📧 Email: ${order.shippingEmail}
  `.trim()

  switch (event) {
    case 'payment.completed':
      return `✅ Payment Completed\n${baseInfo}\n\n🎉 Order confirmed and ready for processing!`
    
    case 'payment.failed':
      return `❌ Payment Failed\n${baseInfo}\n\n⚠️ Payment could not be processed.`
    
    case 'payment.cancelled':
      return `🚫 Payment Cancelled\n${baseInfo}\n\n❌ Customer cancelled the payment.`
    
    case 'refund.completed':
      return `💸 Refund Completed\n${baseInfo}\n\n✅ Refund processed successfully.`
    
    case 'refund.failed':
      return `⚠️ Refund Failed\n${baseInfo}\n\n❌ Refund could not be processed.`
    
    default:
      return `📄 Payment Update\n${baseInfo}\n\nEvent: ${event}`
  }
}

// GET method for webhook verification (optional)
export async function GET() {
  return NextResponse.json({
    message: 'WesternBid webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.WESTERNBID_ENVIRONMENT || 'sandbox'
  })
}