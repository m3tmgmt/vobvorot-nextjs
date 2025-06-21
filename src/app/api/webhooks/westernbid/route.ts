import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { westernbid, type WebhookData } from '@/lib/westernbid'
import { emailService, type OrderEmailData } from '@/lib/email'
import { sendTelegramNotification } from '@/lib/telegram-notifications'
import { logWebhook, logSecurityEvent } from '@/lib/payment-logger'
import { performSecurityCheck, getClientIP, verifyWebhookSignature } from '@/lib/payment-security'
import { isSecurityEnabled, getPaymentConfig } from '@/lib/payment-config'
import { globalCRM } from '@/lib/crm-integration'
import { logger } from '@/lib/logger'

// Helper function to convert unknown error to Error
function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
import { 
  convertReservationToSale, 
  releaseOrderReservations 
} from '@/lib/inventory-management'

// Webhook handler for WesternBid payment notifications
export async function POST(request: NextRequest) {
  let webhookData: WebhookData | null = null
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  
  try {
    // Try to parse form data first (WesternBid sends form-encoded data)
    const formData = await request.formData()
    let payload: string
    
    if (formData && formData.keys().next().value) {
      // Convert form data to JSON for processing
      const formObject: Record<string, any> = {}
      for (const [key, value] of formData.entries()) {
        formObject[key] = value.toString()
      }
      payload = JSON.stringify(formObject)
      
      logger.info('WesternBid form data received', {
        formKeys: Array.from(formData.keys()),
        paymentStatus: formObject.payment_status,
        orderId: formObject.custom || formObject.invoice || formObject.item_number
      })
    } else {
      // Fallback to text payload
      payload = await request.text()
    }
    
    if (!payload || payload === '{}') {
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

    logger.info('WesternBid webhook received', {
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
      logger.error('Failed to parse WesternBid webhook data', {
        payloadLength: payload.length,
        clientIP,
        userAgent
      })
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

    logger.info('WesternBid webhook data parsed', {
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
        },
        signOrder: true // Include sign order data for sign photo orders
      }
    })

    if (!order) {
      logger.error('Order not found for WesternBid webhook', {
        orderId: webhookData.orderId,
        event: webhookData.event,
        paymentId: webhookData.paymentId
      })
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
        logger.warn('Unknown WesternBid webhook event type', {
          event: webhookData.event,
          orderId: webhookData.orderId,
          paymentId: webhookData.paymentId
        })
        return NextResponse.json({ message: 'Unknown event type' }, { status: 200 })
    }

    // Send notifications
    try {
      await sendNotifications(updatedOrder, webhookData)
    } catch (notificationError) {
      logger.error('Failed to send WesternBid webhook notifications', {
        event: webhookData.event,
        orderId: webhookData.orderId,
        orderNumber: updatedOrder?.orderNumber
      }, notificationError instanceof Error ? notificationError : new Error(String(notificationError)))
      // Don't fail the webhook for notification errors
    }

    logger.info('WesternBid webhook processed successfully', {
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
    logger.error('Failed to process WesternBid webhook', {
      webhookEvent: webhookData?.event,
      orderId: webhookData?.orderId,
      clientIP,
      userAgent
    }, error instanceof Error ? error : new Error(String(error)))

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
  logger.info('Processing WesternBid payment completed', {
    orderNumber: order.orderNumber,
    orderId: order.id,
    paymentId: webhookData.paymentId
  })
  
  // Extract customer data from webhook metadata (hybrid approach)
  const payerData = extractCustomerDataFromWebhook(webhookData)
  
  // Prepare update data with payment info
  const updateData: any = {
    status: 'CONFIRMED',
    paymentStatus: 'COMPLETED',
    paymentId: webhookData.paymentId,
    transactionId: webhookData.transactionId,
    paidAt: new Date()
  }
  
  // Update customer information if available from webhook (enhanced for minimal checkout)
  if (payerData.email || payerData.name || payerData.phone || payerData.address) {
    logger.info('Updating customer data from webhook', {
      orderNumber: order.orderNumber,
      webhookEmail: payerData.email,
      webhookName: payerData.name,
      webhookPhone: payerData.phone,
      webhookAddress: payerData.address,
      webhookCity: payerData.city,
      webhookState: payerData.state,
      webhookZip: payerData.zip,
      hasCompleteAddress: !!(payerData.address && payerData.city && payerData.zip)
    })
    
    // For minimal checkout orders, update all shipping information
    const isMinimalOrder = order.shippingEmail?.includes('customer@example.com') || 
                          order.shippingName?.includes('to be updated')
    
    if (isMinimalOrder) {
      logger.info('Updating minimal checkout order with complete customer data', {
        orderNumber: order.orderNumber,
        originalEmail: order.shippingEmail,
        newEmail: payerData.email
      })
      
      // Update all shipping fields with actual customer data
      if (payerData.email) updateData.shippingEmail = payerData.email
      if (payerData.name) updateData.shippingName = payerData.name
      if (payerData.phone) updateData.shippingPhone = payerData.phone
      if (payerData.address) updateData.shippingAddress = payerData.address
      if (payerData.city) updateData.shippingCity = payerData.city
      if (payerData.state) updateData.shippingState = payerData.state
      if (payerData.zip) updateData.shippingZip = payerData.zip
      if (payerData.country) updateData.shippingCountry = payerData.country
    } else {
      // For full checkout orders, store as additional payer info
      if (payerData.email && payerData.email !== order.shippingEmail) {
        updateData.actualPayerEmail = payerData.email
      }
      
      if (payerData.name && payerData.name !== order.shippingName) {
        updateData.actualPayerName = payerData.name
      }
    }
    
    // Store complete payer information in metadata
    updateData.payerMetadata = JSON.stringify({
      payerEmail: payerData.email,
      payerName: payerData.name,
      payerFirstName: payerData.firstName,
      payerLastName: payerData.lastName,
      payerPhone: payerData.phone,
      payerAddress: payerData.address,
      payerCity: payerData.city,
      payerState: payerData.state,
      payerZip: payerData.zip,
      payerCountry: payerData.country,
      originalEmail: order.shippingEmail,
      originalName: order.shippingName,
      isMinimalOrder,
      dataSource: 'westernbid_webhook',
      extractedAt: new Date().toISOString()
    })
  }
  
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData,
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

  // Note: Inventory will be updated by convertReservationToSale function
  // We don't update it here to avoid double decrementing

  // Sync inventory changes with shared-data for CRM/Bot consistency
  try {
    const { updateProduct, sharedProducts } = await import('@/lib/shared-data')
    for (const item of order.items) {
      // Find corresponding product in shared-data
      const sharedProduct = sharedProducts.find(p => p.name === item.sku.product.name)
      if (sharedProduct) {
        updateProduct(sharedProduct.id, {
          stock: Math.max(0, (sharedProduct.stock || 0) - item.quantity)
        })
        logger.info('Synced inventory to shared-data', {
          productId: sharedProduct.id,
          productName: sharedProduct.name,
          newStock: Math.max(0, (sharedProduct.stock || 0) - item.quantity),
          decrementedBy: item.quantity
        })
      }
    }
  } catch (syncError) {
    logger.error('Failed to sync inventory with shared-data', {
      orderNumber: order.orderNumber
    }, syncError instanceof Error ? syncError : new Error(String(syncError)))
  }

  // Send CRM notifications after successful payment (for all order types)
  if (globalCRM) {
    try {
      // Check if this is a sign order
      if (updatedOrder.orderType === 'SIGN_PHOTO' && (updatedOrder as any).signOrder) {
        // Sign order CRM notification
        await globalCRM.notifyNewOrder({
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          orderType: 'SIGN_PHOTO',
          customerEmail: updatedOrder.shippingEmail,
          customerName: updatedOrder.shippingName,
          items: [{
            name: `Custom Sign Photo: "${(updatedOrder as any).signOrder.signName}"`,
            price: parseFloat(updatedOrder.total.toString()),
            quantity: 1,
            sku: 'SIGN-PHOTO-001'
          }],
          total: parseFloat(updatedOrder.total.toString()),
          paymentMethod: 'westernbid',
          shippingAddress: {
            name: updatedOrder.shippingName,
            address1: updatedOrder.shippingAddress,
            city: updatedOrder.shippingCity,
            country: updatedOrder.shippingCountry,
            postalCode: updatedOrder.shippingZip
          },
          notes: updatedOrder.notes || undefined
        })
        
        logger.info('CRM notification sent for sign order after payment', { 
          orderNumber: updatedOrder.orderNumber,
          signName: (updatedOrder as any).signOrder.signName
        })
      } else {
        // Regular order CRM notification
        await globalCRM.notifyNewOrder({
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          orderType: 'PRODUCT',
          customerEmail: updatedOrder.shippingEmail,
          customerName: updatedOrder.shippingName,
          items: updatedOrder.items.map(item => ({
            name: item.sku.product.name,
            price: parseFloat(item.price.toString()),
            quantity: item.quantity,
            sku: item.sku.sku
          })),
          total: parseFloat(updatedOrder.total.toString()),
          paymentMethod: 'westernbid',
          shippingAddress: {
            name: updatedOrder.shippingName,
            address1: updatedOrder.shippingAddress,
            city: updatedOrder.shippingCity,
            country: updatedOrder.shippingCountry,
            postalCode: updatedOrder.shippingZip
          },
          notes: updatedOrder.notes || undefined
        })
        
        logger.info('CRM notification sent for regular order after payment', { 
          orderNumber: updatedOrder.orderNumber,
          itemCount: updatedOrder.items.length
        })
      }
    } catch (crmError) {
      logger.error('CRM notification failed after payment', { 
        orderNumber: updatedOrder.orderNumber,
        orderType: updatedOrder.orderType
      }, crmError instanceof Error ? crmError : new Error(String(crmError)))
    }
  }

  // Convert reservation to sale after successful payment
  try {
    await convertReservationToSale(updatedOrder.orderNumber)
    logger.info('Reservation converted to sale', {
      orderNumber: updatedOrder.orderNumber
    })
  } catch (conversionError) {
    logger.error('Failed to convert reservation to sale', {
      orderNumber: updatedOrder.orderNumber
    }, conversionError instanceof Error ? conversionError : new Error(String(conversionError)))
    // Don't fail the webhook for conversion errors
  }

  return updatedOrder
}

// Handle failed payment
async function handlePaymentFailed(order: any, webhookData: WebhookData) {
  logger.info('Processing WesternBid payment failed', {
    orderNumber: order.orderNumber,
    orderId: order.id,
    paymentId: webhookData.paymentId,
    failureReason: webhookData.metadata?.failure_reason
  })
  
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

  // Release reservations for failed payment
  try {
    await releaseOrderReservations(order.orderNumber)
    logger.info('Order reservations released for failed payment', {
      orderNumber: order.orderNumber
    })
  } catch (releaseError: unknown) {
    logger.error('Failed to release order reservations for failed payment', {
      orderNumber: order.orderNumber
    }, toError(releaseError))
  }
}

// Handle cancelled payment
async function handlePaymentCancelled(order: any, webhookData: WebhookData) {
  logger.info('Processing WesternBid payment cancelled', {
    orderNumber: order.orderNumber,
    orderId: order.id,
    paymentId: webhookData.paymentId
  })
  
  const updatedOrder = await prisma.order.update({
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

  // Release reservations for cancelled payment
  try {
    await releaseOrderReservations(order.orderNumber)
    logger.info('Order reservations released for cancelled payment', {
      orderNumber: order.orderNumber
    })
  } catch (releaseError: unknown) {
    logger.error('Failed to release order reservations for cancelled payment', {
      orderNumber: order.orderNumber
    }, toError(releaseError))
  }

  return updatedOrder
}

// Handle successful refund
async function handleRefundCompleted(order: any, webhookData: WebhookData) {
  logger.info('Processing WesternBid refund completed', {
    orderNumber: order.orderNumber,
    orderId: order.id,
    refundAmount: webhookData.amount,
    refundReason: webhookData.metadata?.refund_reason
  })
  
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

  // Sync inventory restoration with shared-data for CRM/Bot consistency
  try {
    const { updateProduct, sharedProducts } = await import('@/lib/shared-data')
    for (const item of order.items) {
      // Find corresponding product in shared-data
      const sharedProduct = sharedProducts.find(p => p.name === item.sku.product.name)
      if (sharedProduct) {
        updateProduct(sharedProduct.id, {
          stock: (sharedProduct.stock || 0) + item.quantity
        })
        logger.info('Synced inventory restoration to shared-data', {
          productId: sharedProduct.id,
          productName: sharedProduct.name,
          newStock: (sharedProduct.stock || 0) + item.quantity,
          incrementedBy: item.quantity
        })
      }
    }
  } catch (syncError) {
    logger.error('Failed to sync inventory restoration with shared-data', {
      orderNumber: order.orderNumber
    }, syncError instanceof Error ? syncError : new Error(String(syncError)))
  }

  return updatedOrder
}

// Handle failed refund
async function handleRefundFailed(order: any, webhookData: WebhookData) {
  logger.info('Processing WesternBid refund failed', {
    orderNumber: order.orderNumber,
    orderId: order.id,
    failureReason: webhookData.metadata?.failure_reason
  })
  
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
      
      // Send admin notification for all successful payments
      await emailService.sendAdminOrderNotification({
        orderNumber: order.orderNumber,
        customerName: order.shippingName,
        customerEmail: order.shippingEmail,
        total: parseFloat(order.total.toString()),
        itemCount: order.items.length,
        paymentMethod: 'WesternBid',
        shippingAddress: `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingCountry} ${order.shippingZip}`
      })
      
      logger.info('Admin notification sent for WesternBid payment', {
        orderNumber: order.orderNumber,
        paymentMethod: 'WesternBid',
        total: order.total
      })
      
      // Check if this is a sign order
      if (order.orderType === 'SIGN_PHOTO' && (order as any).signOrder) {
        // Sign order confirmation email
        await emailService.sendSignOrderConfirmation({
          orderNumber: order.orderNumber,
          customerName: order.shippingName,
          customerEmail: order.shippingEmail,
          signName: (order as any).signOrder.signName,
          extraNotes: (order as any).signOrder.extraNotes || '',
          amount: parseFloat(order.total.toString()),
          estimatedDelivery: '2-7 days'
        })
        
        logger.info('Sign order confirmation email sent after payment', {
          orderNumber: order.orderNumber,
          customerEmail: order.shippingEmail,
          signName: (order as any).signOrder.signName
        })
      } else {
        // Regular order confirmation email
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
        
        logger.info('Regular order confirmation email sent after payment', {
          orderNumber: order.orderNumber,
          customerEmail: order.shippingEmail,
          itemCount: order.items.length
        })
      }
    }

    // Send Telegram notification
    const statusMessage = getStatusMessage(webhookData.event, order)
    await sendTelegramNotification(statusMessage)

  } catch (error) {
    logger.error('Failed to send WesternBid notifications', {
      orderNumber: order.orderNumber,
      event: webhookData.event
    }, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

// Get status message for Telegram (enhanced for minimal checkout)
function getStatusMessage(event: string, order: any): string {
  // Parse payer metadata if available
  let payerData: any = {}
  if (order.payerMetadata) {
    try {
      payerData = JSON.parse(order.payerMetadata)
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Build customer information
  let customerInfo = `👤 Customer: ${order.shippingName}
📧 Email: ${order.shippingEmail}`

  // Add phone if available
  if (order.shippingPhone) {
    customerInfo += `\n📞 Phone: ${order.shippingPhone}`
  }

  // Add shipping address
  customerInfo += `\n📍 Address: ${order.shippingAddress}`
  customerInfo += `\n🏙️ City: ${order.shippingCity}, ${order.shippingCountry}`
  if (order.shippingState) {
    customerInfo += ` (${order.shippingState})`
  }
  if (order.shippingZip) {
    customerInfo += ` ${order.shippingZip}`
  }

  // Show if this was a minimal checkout order
  const wasMinimalOrder = payerData.isMinimalOrder || false
  if (wasMinimalOrder) {
    customerInfo += `\n🔄 Data collected from payment processor`
  }

  // Show actual payer info if different (for full checkout orders)
  if (order.actualPayerName && order.actualPayerName !== order.shippingName) {
    customerInfo += `\n💳 Actual Payer: ${order.actualPayerName}`
  }
  
  if (order.actualPayerEmail && order.actualPayerEmail !== order.shippingEmail) {
    customerInfo += `\n📧 Payer Email: ${order.actualPayerEmail}`
  }

  const baseInfo = `
🛒 Order: ${order.orderNumber}
💰 Amount: $${order.total}
${customerInfo}
  `.trim()

  switch (event) {
    case 'payment.completed':
      const completionNote = wasMinimalOrder ? 
        '\n✨ Quick checkout completed - all customer data collected!' :
        (order.actualPayerName || order.actualPayerEmail) ? 
          '\n🔄 Customer data verified from payment gateway' : ''
      return `✅ Payment Completed\n${baseInfo}\n\n🎉 Order confirmed and ready for processing!${completionNote}`
    
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

// Extract customer data from webhook metadata (enhanced for minimal checkout)
function extractCustomerDataFromWebhook(webhookData: WebhookData): {
  email?: string
  name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  firstName?: string
  lastName?: string
} {
  const metadata = webhookData.metadata || {}
  const rawFormData = metadata.rawFormData || {}
  
  logger.info('Extracting customer data from webhook', {
    hasMetadata: !!metadata,
    hasRawFormData: !!rawFormData,
    payerEmail: metadata.payerEmail,
    payerName: metadata.payerName,
    availableFields: Object.keys(rawFormData)
  })
  
  // Extract email from multiple possible sources
  const email = metadata.payerEmail || 
                rawFormData.payer_email || 
                rawFormData.email || 
                rawFormData.buyer_email || 
                rawFormData.customer_email ||
                rawFormData.contact_email ||
                rawFormData.billing_email

  // Extract name components
  const firstName = rawFormData.first_name || rawFormData.payer_first_name || ''
  const lastName = rawFormData.last_name || rawFormData.payer_last_name || ''
  const fullName = metadata.payerName || 
                   rawFormData.payer_name || 
                   rawFormData.customer_name || 
                   rawFormData.buyer_name ||
                   rawFormData.full_name ||
                   rawFormData.name ||
                   (firstName && lastName ? `${firstName} ${lastName}`.trim() : '') ||
                   firstName || lastName
  
  // Extract phone from multiple possible sources
  const phone = rawFormData.phone || 
                rawFormData.telephone ||
                rawFormData.contact_phone || 
                rawFormData.payer_phone || 
                rawFormData.customer_phone || 
                rawFormData.buyer_phone ||
                rawFormData.mobile ||
                rawFormData.cell_phone
  
  // Extract address information
  const address = rawFormData.address1 ||
                  rawFormData.address ||
                  rawFormData.street_address ||
                  rawFormData.shipping_address_1 ||
                  rawFormData.billing_address_1 ||
                  rawFormData.payer_address ||
                  rawFormData.customer_address
  
  const city = rawFormData.city ||
               rawFormData.town ||
               rawFormData.locality ||
               rawFormData.shipping_city ||
               rawFormData.billing_city ||
               rawFormData.payer_city ||
               rawFormData.customer_city
  
  const state = rawFormData.state ||
                rawFormData.province ||
                rawFormData.region ||
                rawFormData.shipping_state ||
                rawFormData.billing_state ||
                rawFormData.payer_state ||
                rawFormData.customer_state
  
  const zip = rawFormData.zip ||
              rawFormData.postal_code ||
              rawFormData.postcode ||
              rawFormData.zip_code ||
              rawFormData.shipping_zip ||
              rawFormData.billing_zip ||
              rawFormData.payer_zip ||
              rawFormData.customer_zip
  
  const country = rawFormData.country ||
                  rawFormData.country_code ||
                  rawFormData.shipping_country ||
                  rawFormData.billing_country ||
                  rawFormData.payer_country ||
                  rawFormData.customer_country
  
  const extractedData = {
    email: email || undefined,
    name: fullName || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    phone: phone || undefined,
    address: address || undefined,
    city: city || undefined,
    state: state || undefined,
    zip: zip || undefined,
    country: country || undefined
  }
  
  logger.info('Enhanced customer data extracted', {
    ...extractedData,
    hasAddress: !!address,
    hasCity: !!city,
    hasState: !!state,
    hasZip: !!zip,
    hasCountry: !!country
  })
  
  return extractedData
}

// GET method for webhook verification (optional)
export async function GET() {
  return NextResponse.json({
    message: 'WesternBid webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.WESTERNBID_ENVIRONMENT || 'sandbox'
  })
}