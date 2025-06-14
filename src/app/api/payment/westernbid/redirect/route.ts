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
        shippingMethod: 'standard',
        // Critical: Add all shipping data for auto-fill
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState || '',
        shippingZip: order.shippingZip,
        shippingCountry: order.shippingCountry,
        // Enhanced item details for better payment tracking
        items: order.items.map((item, index) => ({
          [`item_${index + 1}_name`]: item.sku.product.name,
          [`item_${index + 1}_quantity`]: item.quantity,
          [`item_${index + 1}_price`]: Number(item.price),
          [`item_${index + 1}_sku`]: item.sku.sku || 'N/A'
        })).reduce((acc, item) => ({ ...acc, ...item }), {})
      }
    }

    // Generate WesternBid form data with preferred payment method
    const preferredGate = order.paymentMethod || 'paypal' // 'stripe', 'paypal', or 'westernbid'
    const formData = westernbid.generatePaymentFormData(paymentRequest, paymentId, preferredGate)

    // Create HTML form for manual submission to WesternBid (no auto-submit)
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Complete Your Payment</title>
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
                padding: 20px;
            }
            .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 100%;
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
            .order-info {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 1.5rem;
                margin: 1.5rem 0;
                text-align: left;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin: 0.5rem 0;
                padding: 0.3rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .info-row:last-child {
                border-bottom: none;
                font-weight: bold;
                font-size: 1.1rem;
                color: #4ecdc4;
            }
            .payment-button {
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                color: white;
                border: none;
                padding: 18px 40px;
                border-radius: 50px;
                font-size: 1.2rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 1.5rem 0;
                min-width: 280px;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            }
            .payment-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 25px rgba(0, 0, 0, 0.4);
            }
            .payment-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            .security-notice {
                color: #b0b0b0;
                font-size: 0.9rem;
                margin-top: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .debug-panel {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                font-family: monospace;
                font-size: 0.8rem;
                text-align: left;
            }
            .debug-panel summary {
                cursor: pointer;
                padding: 0.5rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            .back-link {
                color: #4ecdc4;
                text-decoration: none;
                margin-top: 1rem;
                display: inline-block;
            }
            .back-link:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">VobVorot</div>
            <h2 style="margin: 1rem 0; color: #fff;">Complete Your Payment</h2>
            
            <div class="order-info">
                <div class="info-row">
                    <span>Order ID:</span>
                    <span><strong>${orderId}</strong></span>
                </div>
                <div class="info-row">
                    <span>Amount:</span>
                    <span><strong>$${Number(order.total).toFixed(2)}</strong></span>
                </div>
                <div class="info-row">
                    <span>Payment Method:</span>
                    <span><strong>WesternBid</strong></span>
                </div>
            </div>
            
            <form id="westernbid-form" action="https://shop.westernbid.info" method="POST">
                ${Object.entries(formData)
                  .map(([key, value]) => `<input type="hidden" name="${key}" value="${value.replace(/"/g, '&quot;')}" />`)
                  .join('\n                ')}
                
                <button type="submit" class="payment-button" id="payment-btn">
                    🔒 Proceed to Secure Payment
                </button>
            </form>
            
            <div class="security-notice">
                🛡️ You will be redirected to WesternBid secure payment gateway
            </div>
            
            <div class="debug-panel">
                <details>
                    <summary>🔧 Technical Details</summary>
                    <pre style="margin: 0.5rem 0; font-size: 0.7rem; overflow-x: auto;">
Payment ID: ${paymentId}
Merchant: ${formData.wb_login}
Hash: ${formData.wb_hash?.substring(0, 8)}...
Target: https://shop.westernbid.info

Form Data:
${Object.entries(formData)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}
                    </pre>
                </details>
            </div>
            
            <a href="/checkout" class="back-link">← Back to Checkout</a>
        </div>

        <script>
            console.log('WesternBid payment page loaded');
            console.log('Order:', '${orderId}');
            console.log('Amount:', '$${Number(order.total).toFixed(2)}');
            console.log('Payment ID:', '${paymentId}');
            
            // Auto-submit form after short delay
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.getElementById('westernbid-form');
                const button = document.getElementById('payment-btn');
                
                if (form && button) {
                    // Show countdown and auto-submit
                    let countdown = 3;
                    const originalText = button.innerHTML;
                    
                    const updateButton = () => {
                        if (countdown > 0) {
                            button.innerHTML = \`⏳ Redirecting in \${countdown} seconds... (Click to proceed now)\`;
                            countdown--;
                            setTimeout(updateButton, 1000);
                        } else {
                            button.innerHTML = '⏳ Redirecting to Payment Gateway...';
                            form.submit();
                        }
                    };
                    
                    updateButton();
                }
            });
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