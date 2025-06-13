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
        customerAddress: {
          address: order.shippingAddress || 'Address not provided',
          city: order.shippingCity || 'City not provided',
          state: order.shippingCountry === 'UA' ? 'Ukraine' : 'State not provided',
          postalCode: order.shippingZip || '00000',
          country: order.shippingCountry || 'UA'
        }
      }
    }

    // Generate WesternBid form data
    const formData = westernbid.generatePaymentFormData(paymentRequest, paymentId)

    // Use HTML form for WesternBid redirect
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
            <div id="debug-info" style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 0.8rem; text-align: left;">
                <strong>Debug Info:</strong><br>
                Payment ID: ${paymentId}<br>
                Order ID: ${orderId}<br>
                Amount: $${Number(order.total).toFixed(2)}<br>
                Target URL: https://shop.westernbid.info<br>
                <details style="margin-top: 0.5rem;">
                    <summary>Form Data</summary>
                    <pre style="font-size: 0.7rem; margin-top: 0.5rem;">${JSON.stringify(formData, null, 2)}</pre>
                </details>
            </div>
            
            <form id="westernbid-form" action="https://shop.westernbid.info" method="post" style="display: none;">
                ${Object.entries(formData)
                  .map(([key, value]) => `<input type="hidden" name="${key}" value="${value.replace(/"/g, '&quot;')}" />`)
                  .join('\n                ')}
            </form>
        </div>

        <script>
            console.log('WesternBid payment redirect');
            
            // Auto-submit form immediately
            function submitPaymentForm() {
                const form = document.getElementById('westernbid-form');
                if (form) {
                    console.log('Submitting form to WesternBid...');
                    setTimeout(() => {
                        form.submit();
                    }, 1000); // Small delay to show loading
                } else {
                    console.error('Form not found');
                    document.querySelector('.container').innerHTML = 
                        '<div class="logo">VobVorot</div>' +
                        '<p style="color: #ff6b6b;">Payment form error. Please try again.</p>' +
                        '<a href="/checkout" style="color: #4ecdc4;">← Back to Checkout</a>';
                }
            }
            
            // Submit on page load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', submitPaymentForm);
            } else {
                submitPaymentForm();
            }
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