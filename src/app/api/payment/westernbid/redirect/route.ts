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
            console.log('Payment redirect page loaded');
            
            // Wait for DOM to be ready
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.getElementById('westernbid-form');
                
                if (form) {
                    console.log('Form found:', form);
                    console.log('Form action:', form.action);
                    console.log('Form method:', form.method);
                    console.log('Form target:', form.target);
                    console.log('Form innerHTML:', form.innerHTML);
                    
                    // Log all form fields
                    const formData = new FormData(form);
                    console.log('Form fields count:', formData.entries().length);
                    console.log('Form fields:');
                    for (let [key, value] of formData.entries()) {
                        console.log(key + ':', value);
                    }
                    
                    // Check if form is properly attached to DOM
                    console.log('Form parent:', form.parentElement);
                    console.log('Form in document:', document.contains(form));
                    
                    // Add manual submit button for testing
                    const submitButton = document.createElement('button');
                    submitButton.textContent = 'Manual Submit to WesternBid';
                    submitButton.style.cssText = 'padding: 10px 20px; margin: 10px; background: #4ecdc4; color: white; border: none; border-radius: 5px; cursor: pointer;';
                    submitButton.onclick = function() {
                        console.log('Manual form submission triggered');
                        console.log('Form action before submit:', form.action);
                        console.log('Form target before submit:', form.target);
                        
                        // Try different approaches
                        try {
                            console.log('Attempting form.submit()...');
                            
                            // Method 1: Direct form submission
                            form.submit();
                            console.log('form.submit() completed - page should redirect now');
                            
                        } catch (error) {
                            console.error('form.submit() failed:', error);
                            
                            // Method 2: Create and submit a clone
                            try {
                                console.log('Trying method 2: form clone submission');
                                const clonedForm = form.cloneNode(true);
                                document.body.appendChild(clonedForm);
                                clonedForm.submit();
                                console.log('Cloned form submitted');
                            } catch (cloneError) {
                                console.error('Clone method failed:', cloneError);
                                
                                // Method 3: Manual POST request
                                try {
                                    console.log('Trying method 3: manual POST');
                                    const formData = new FormData(form);
                                    fetch(form.action, {
                                        method: 'POST',
                                        body: formData,
                                        mode: 'no-cors'
                                    }).then(() => {
                                        console.log('Manual POST completed');
                                        window.location.href = form.action;
                                    }).catch(fetchError => {
                                        console.error('Manual POST failed:', fetchError);
                                        alert('All submission methods failed. Check console for details.');
                                    });
                                } catch (manualError) {
                                    console.error('Manual POST setup failed:', manualError);
                                    alert('All submission methods failed. WesternBid may be blocking requests.');
                                }
                            }
                        }
                    };
                    document.querySelector('.container').appendChild(submitButton);
                    
                    // Add button to show/hide actual form for debugging
                    const showFormButton = document.createElement('button');
                    showFormButton.textContent = 'Show/Hide Form for Manual Submit';
                    showFormButton.style.cssText = 'padding: 10px 20px; margin: 10px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;';
                    showFormButton.onclick = function() {
                        if (form.style.display === 'none') {
                            form.style.display = 'block';
                            form.style.padding = '20px';
                            form.style.background = 'rgba(255,255,255,0.1)';
                            form.style.borderRadius = '10px';
                            form.style.marginTop = '20px';
                            
                            // Add visible submit button to the form
                            const visibleSubmit = document.createElement('input');
                            visibleSubmit.type = 'submit';
                            visibleSubmit.value = 'SUBMIT TO WESTERNBID';
                            visibleSubmit.style.cssText = 'padding: 15px 30px; background: #4ecdc4; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 10px;';
                            form.appendChild(visibleSubmit);
                        } else {
                            form.style.display = 'none';
                        }
                    };
                    document.querySelector('.container').appendChild(showFormButton);
                    
                    // Also try automatic submission
                    setTimeout(function() {
                        console.log('Automatic form submission in 3 seconds...');
                        try {
                            form.submit();
                            console.log('Automatic form submitted');
                        } catch (error) {
                            console.error('Automatic form submission failed:', error);
                            document.querySelector('.container').innerHTML += 
                                '<p style="color: #ff6b6b; margin-top: 1rem;">Automatic submission failed: ' + error.message + '</p>' +
                                '<p style="color: #fff;">Try the manual submit button above or <a href="/checkout" style="color: #4ecdc4;">go back to checkout</a></p>';
                        }
                    }, 3000);
                    
                } else {
                    console.error('Form not found!');
                    document.querySelector('.container').innerHTML = 
                        '<div class="logo">VobVorot</div>' +
                        '<p style="color: #ff6b6b;">Payment form not found. Please try again.</p>' +
                        '<a href="/checkout" style="color: #4ecdc4; text-decoration: none;">← Back to Checkout</a>';
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