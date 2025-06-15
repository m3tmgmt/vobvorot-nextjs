import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendTelegramNotification } from '@/lib/telegram-notifications'

// POST /api/orders/[id]/message - Send message to customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params
    const body = await request.json()
    
    const { message, adminId = 'telegram_admin' } = body

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 })
    }

    // Get order with customer information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    })

    if (!order) {
      return NextResponse.json({
        error: 'Order not found'
      }, { status: 404 })
    }

    // Prepare email content
    const subject = `Message regarding your order ${order.orderNumber || orderId}`
    const emailHtml = `
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
          .message-box {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid #1a1a1a;
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
            <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">Order Message</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1a1a1a;">Message regarding order #${order.orderNumber || orderId}</h2>
            
            <p>Hello ${order.shippingName},</p>
            
            <p>We have an important message regarding your order:</p>
            
            <div class="message-box">
              <p style="margin: 0; font-size: 16px;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact our customer service team.</p>
            
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

    const emailText = `
Message regarding order #${order.orderNumber || orderId}

Hello ${order.shippingName},

We have an important message regarding your order:

${message}

If you have any questions, please contact us at noreply@vobvorot.com

Best regards,
EXVICPMOUR Customer Service
    `

    // Send email to customer
    try {
      await sendEmail({
        to: order.shippingEmail,
        subject: subject,
        html: emailHtml,
        text: emailText
      })
    } catch (emailError) {
      console.error('Failed to send email to customer:', emailError)
      return NextResponse.json({
        error: 'Failed to send email to customer'
      }, { status: 500 })
    }

    // Create order log entry
    await prisma.orderLog.create({
      data: {
        orderId: orderId,
        action: 'MESSAGE_SENT',
        details: {
          message: message,
          sentTo: order.shippingEmail,
          sentAt: new Date().toISOString(),
          source: 'telegram_bot'
        },
        userId: adminId
      }
    })

    // Send Telegram notification to admin
    try {
      const notificationMessage = `💬 Сообщение отправлено клиенту\n\n` +
        `🆔 Заказ: #${order.orderNumber || orderId}\n` +
        `👤 Клиент: ${order.shippingName}\n` +
        `📧 Email: ${order.shippingEmail}\n` +
        `📝 Сообщение: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
      
      await sendTelegramNotification(notificationMessage)
    } catch (notificationError) {
      console.warn('Failed to send Telegram notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent to customer successfully',
      sentTo: order.shippingEmail,
      sentAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}