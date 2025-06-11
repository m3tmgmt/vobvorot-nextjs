import { NextRequest, NextResponse } from 'next/server'
import { westernbid } from '@/lib/westernbid'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    const orderId = searchParams.get('orderId')
    const sessionId = searchParams.get('sessionId')

    if (!paymentId || !orderId || !sessionId) {
      logger.error('Missing required parameters for WesternBid redirect', {
        paymentId,
        orderId,
        sessionId
      })
      return NextResponse.redirect(
        new URL('/checkout?error=invalid_payment_parameters', request.url)
      )
    }

    // Get order details from database
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderId },
      include: {
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
      logger.error('Order not found for WesternBid payment', { orderId })
      return NextResponse.redirect(
        new URL('/checkout?error=order_not_found', request.url)
      )
    }

    // Prepare payment request data
    const paymentRequest = {
      orderId: order.orderNumber,
      amount: Number(order.total),
      currency: 'USD', // WesternBid supports USD primarily
      description: `Order ${order.orderNumber} - VobVorot Store`,
      customerEmail: order.shippingEmail,
      customerName: order.shippingName,
      customerPhone: order.shippingPhone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?orderId=${orderId}&paymentId=${paymentId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel?orderId=${orderId}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        sessionId,
        orderItems: order.items.length,
        shippingMethod: 'standard'
      }
    }

    // Generate WesternBid form data
    const formData = westernbid.generatePaymentFormData(paymentRequest, paymentId)

    // Create HTML form that auto-submits to WesternBid
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirecting to Payment...</title>
        <meta charset="utf-8">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
                color: #e0e0e0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
            }
            .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            .logo {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 1rem;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top: 3px solid #4ecdc4;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 1rem auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .message {
                margin-top: 1rem;
                color: #b0b0b0;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">VobVorot</div>
            <div class="spinner"></div>
            <p>Redirecting to secure payment...</p>
            <p class="message">You will be redirected to WesternBid payment gateway</p>
            
            <form id="westernbid-form" action="https://shop.westernbid.info" method="post" style="display: none;">
                ${Object.entries(formData)
                  .map(([key, value]) => `<input type="hidden" name="${key}" value="${value.replace(/"/g, '&quot;')}" />`)
                  .join('\n                ')}
            </form>
        </div>

        <script>
            // Auto-submit form after 2 seconds
            setTimeout(function() {
                document.getElementById('westernbid-form').submit();
            }, 2000);
        </script>
    </body>
    </html>
    `

    // Log payment initiation
    logger.info('WesternBid payment initiated', {
      paymentId,
      orderId: order.orderNumber,
      amount: order.total,
      customerEmail: order.shippingEmail
    })

    // Update order status to processing
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        paymentMethod: 'westernbid',
        paymentStatus: 'PENDING',
        updatedAt: new Date()
      }
    })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    logger.error('WesternBid redirect failed', {}, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.redirect(
      new URL('/checkout?error=payment_initialization_failed', request.url)
    )
  }
}