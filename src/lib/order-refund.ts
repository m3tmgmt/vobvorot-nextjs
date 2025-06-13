import { prisma } from '@/lib/prisma'
import { westernbid } from '@/lib/westernbid'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export interface RefundOrderRequest {
  orderId: string
  adminId: string
  reason: string
  amount?: number // Optional for partial refunds
  notifyCustomer?: boolean
}

export interface RefundOrderResult {
  success: boolean
  refundId?: string
  refundAmount?: number
  message?: string
  error?: string
}

/**
 * Process order refund with automatic customer notification
 */
export async function refundOrder(request: RefundOrderRequest): Promise<RefundOrderResult> {
  try {
    logger.info('Processing order refund', {
      orderId: request.orderId,
      adminId: request.adminId,
      reason: request.reason,
      amount: request.amount
    })

    // Find the order with payment information
    const order = await prisma.order.findUnique({
      where: { id: request.orderId },
      include: {
        payment: true,
        user: true,
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
      return {
        success: false,
        error: 'Order not found'
      }
    }

    // Validate order can be refunded
    const validation = validateOrderForRefund(order)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason
      }
    }

    // Calculate refund amount
    const refundAmount = request.amount || parseFloat(order.total.toString())

    // Create or update payment record if it doesn't exist
    let payment = order.payment
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          status: 'COMPLETED',
          paymentId: order.paymentId || `legacy_${order.id}`,
          method: order.paymentMethod || 'unknown'
        }
      })
    }

    // Process refund through WesternBid if we have a valid payment ID
    let refundResult = null
    if (payment.paymentId && !payment.paymentId.startsWith('legacy_')) {
      try {
        refundResult = await westernbid.refundPayment({
          paymentId: payment.paymentId,
          amount: refundAmount,
          reason: request.reason,
          metadata: {
            orderId: request.orderId,
            adminId: request.adminId,
            customerEmail: order.shippingEmail
          }
        })

        if (!refundResult.success) {
          logger.warn('WesternBid refund failed, proceeding with manual refund', {
            orderId: request.orderId,
            error: refundResult.error
          })
        }
      } catch (error) {
        logger.warn('WesternBid API error during refund, proceeding with manual refund', {
          orderId: request.orderId,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Update database regardless of WesternBid API result
    const refundId = refundResult?.refundId || `manual_${Date.now()}_${order.id}`
    
    await prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: request.orderId },
        data: {
          status: refundAmount >= parseFloat(order.total.toString()) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundAmount: refundAmount,
          refundReason: request.reason,
          refundedAt: new Date(),
          refundedBy: request.adminId,
          refundId: refundId
        }
      })

      // Update payment record
      await tx.payment.update({
        where: { id: payment!.id },
        data: {
          status: refundAmount >= parseFloat(payment!.amount.toString()) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundId: refundId,
          refundAmount: refundAmount,
          refundReason: request.reason,
          refundedAt: new Date()
        }
      })

      // Create refund log
      await tx.orderLog.create({
        data: {
          orderId: request.orderId,
          action: 'REFUND_PROCESSED',
          details: {
            refundId: refundId,
            refundAmount: refundAmount,
            reason: request.reason,
            adminId: request.adminId,
            westernbidResult: refundResult ? JSON.parse(JSON.stringify(refundResult)) : null,
            isManualRefund: !refundResult?.success,
            processedAt: new Date().toISOString()
          },
          userId: request.adminId
        }
      })

      // Restore inventory for refunded items
      for (const item of order.items) {
        await tx.productSku.update({
          where: { id: item.skuId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })

        // Log inventory restoration
        await tx.orderLog.create({
          data: {
            orderId: request.orderId,
            action: 'INVENTORY_RESTORED',
            details: {
              skuId: item.skuId,
              productName: item.productName,
              quantity: item.quantity,
              restoredBy: request.adminId
            },
            userId: request.adminId
          }
        })
      }
    })

    // Send customer notification email if requested
    if (request.notifyCustomer !== false) {
      try {
        await sendRefundNotificationEmail({
          customerEmail: order.shippingEmail,
          customerName: order.shippingName,
          orderNumber: order.orderNumber,
          refundAmount: refundAmount,
          refundReason: request.reason,
          isPartialRefund: refundAmount < parseFloat(order.total.toString())
        })
      } catch (emailError) {
        logger.warn('Failed to send refund notification email', {
          orderId: request.orderId,
          customerEmail: order.shippingEmail,
          error: emailError instanceof Error ? emailError.message : String(emailError)
        })
      }
    }

    logger.info('Order refund processed successfully', {
      orderId: request.orderId,
      refundId: refundId,
      refundAmount: refundAmount,
      westernbidSuccess: refundResult?.success || false
    })

    return {
      success: true,
      refundId: refundId,
      refundAmount: refundAmount,
      message: refundResult?.success 
        ? 'Refund processed successfully through WesternBid'
        : 'Refund recorded in system (manual processing required for payment gateway)'
    }

  } catch (error) {
    logger.error('Order refund processing failed', {
      orderId: request.orderId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return {
      success: false,
      error: 'Failed to process refund: ' + (error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * Validate if order can be refunded
 */
function validateOrderForRefund(order: any): { valid: boolean; reason?: string } {
  if (order.status === 'REFUNDED') {
    return { valid: false, reason: 'Order is already fully refunded' }
  }

  if (order.status === 'CANCELLED') {
    return { valid: false, reason: 'Cannot refund a cancelled order' }
  }

  if (!['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'PARTIALLY_REFUNDED'].includes(order.status)) {
    return { valid: false, reason: 'Order status does not allow refunding' }
  }

  if (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') {
    return { valid: false, reason: 'Cannot refund unpaid order' }
  }

  return { valid: true }
}

/**
 * Send refund notification email to customer
 */
async function sendRefundNotificationEmail(data: {
  customerEmail: string
  customerName: string
  orderNumber: string
  refundAmount: number
  refundReason: string
  isPartialRefund: boolean
}): Promise<void> {
  const subject = data.isPartialRefund 
    ? `Partial refund processed for order ${data.orderNumber}`
    : `Refund processed for order ${data.orderNumber}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        .email-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 30px 40px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .content {
          padding: 40px;
          background: #ffffff;
        }
        .card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
          border-left: 4px solid #dc2626;
        }
        .refund-amount {
          font-size: 24px;
          font-weight: bold;
          color: #dc2626;
          text-align: center;
          margin: 16px 0;
        }
        .footer {
          background: #f8f9fa;
          padding: 30px 40px;
          text-align: center;
          border-radius: 0 0 12px 12px;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">Refund Notification</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1a1a1a; text-align: center;">
            ${data.isPartialRefund ? 'Partial Refund' : 'Refund'} Processed
          </h2>
          
          <p>Hello ${data.customerName},</p>
          
          <p>Your ${data.isPartialRefund ? 'partial ' : ''}refund has been processed for order <strong>${data.orderNumber}</strong>.</p>
          
          <div class="card">
            <h3 style="margin: 0 0 16px 0;">Refund Details</h3>
            <div class="refund-amount">$${data.refundAmount.toFixed(2)}</div>
            <p><strong>Reason:</strong> ${data.refundReason}</p>
            <p><strong>Processing Time:</strong> 3-5 business days</p>
          </div>
          
          <p>The refunded amount will appear on your original payment method within 3-5 business days. If you have any questions about this refund, please contact our customer service team.</p>
          
          <p>Thank you for your understanding.</p>
          
          <p style="margin-top: 32px;">
            Best regards,<br>
            <strong>EXVICPMOUR Customer Service</strong>
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Questions? Contact us at <a href="mailto:noreply@vobvorot.com" style="color: #1a1a1a;">noreply@vobvorot.com</a></p>
          <p style="margin: 8px 0 0 0;">© 2024 EXVICPMOUR. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${data.isPartialRefund ? 'Partial Refund' : 'Refund'} Processed - Order ${data.orderNumber}

Hello ${data.customerName},

Your ${data.isPartialRefund ? 'partial ' : ''}refund has been processed for order ${data.orderNumber}.

Refund Details:
- Amount: $${data.refundAmount.toFixed(2)}
- Reason: ${data.refundReason}
- Processing Time: 3-5 business days

The refunded amount will appear on your original payment method within 3-5 business days.

Questions? Contact us at noreply@vobvorot.com

Best regards,
EXVICPMOUR Customer Service
  `

  await sendEmail({
    to: data.customerEmail,
    subject: subject,
    html: html,
    text: text
  })
}