'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/Footer'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  currency: string
  createdAt: string
  shippingFirstName: string
  shippingLastName: string
  shippingEmail: string
  items: {
    id: string
    quantity: number
    price: number
    sku: {
      product: {
        name: string
        images: { url: string; alt?: string }[]
      }
      size?: string
      color?: string
    }
  }[]
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      router.push('/products')
      return
    }

    fetchOrder(orderId)
  }, [searchParams, router])

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else {
        setError('Order not found')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: 'var(--pink-main)', fontSize: '1.2rem' }}>
          Loading order details...
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255,107,157,0.1)',
            border: '2px solid var(--pink-neon)',
            borderRadius: '16px',
            padding: '3rem',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h1 style={{
              color: 'var(--pink-neon)',
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              Order Not Found
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '2rem'
            }}>
              {error || 'We couldn\'t find your order. Please check your email for order confirmation.'}
            </p>
            <button
              onClick={() => router.push('/products')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--white)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Success Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          background: 'rgba(57,255,20,0.1)',
          border: '2px solid var(--green-neon)',
          borderRadius: '16px',
          padding: '3rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{
            color: 'var(--green-neon)',
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '0 0 20px var(--green-neon)'
          }}>
            Order Confirmed!
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.2rem',
            marginBottom: '1rem'
          }}>
            Thank you for your purchase, {order.shippingFirstName}!
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '1rem',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <div style={{
              color: 'var(--cyan-accent)',
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              Order Number:
            </div>
            <div style={{
              color: 'var(--white)',
              fontSize: '1.3rem',
              fontWeight: '700',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              {order.orderNumber}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: '2px solid var(--cyan-accent)',
          borderRadius: '16px',
          padding: '2rem',
          backdropFilter: 'blur(20px)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: 'var(--cyan-accent)',
            fontSize: '1.8rem',
            marginBottom: '2rem'
          }}>
            Order Details
          </h2>

          {/* Order Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--yellow-neon)'
            }}>
              <div style={{
                color: 'var(--yellow-neon)',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}>
                Order Status
              </div>
              <div style={{
                color: 'var(--white)',
                fontWeight: '600'
              }}>
                {order.status}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--purple-accent)'
            }}>
              <div style={{
                color: 'var(--purple-accent)',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}>
                Payment Status
              </div>
              <div style={{
                color: 'var(--white)',
                fontWeight: '600'
              }}>
                {order.paymentStatus}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--pink-main)'
            }}>
              <div style={{
                color: 'var(--pink-main)',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}>
                Total Amount
              </div>
              <div style={{
                color: 'var(--white)',
                fontWeight: '600',
                fontSize: '1.2rem'
              }}>
                ${order.total.toFixed(2)} {order.currency}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 style={{
              color: 'var(--white)',
              fontSize: '1.3rem',
              marginBottom: '1rem'
            }}>
              Items Ordered
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: `url(${item.sku.product.images[0]?.url}) center/cover`,
                    borderRadius: '8px',
                    border: '1px solid var(--cyan-accent)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: 'var(--white)',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {item.sku.product.name}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.9rem'
                    }}>
                      {item.sku.size && `Size: ${item.sku.size}`}
                      {item.sku.size && item.sku.color && ' • '}
                      {item.sku.color && `Color: ${item.sku.color}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: 'var(--white)',
                      fontWeight: '600'
                    }}>
                      Qty: {item.quantity}
                    </div>
                    <div style={{
                      color: 'var(--cyan-accent)',
                      fontSize: '0.9rem'
                    }}>
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div style={{
          background: 'rgba(0,245,255,0.1)',
          border: '2px solid var(--cyan-accent)',
          borderRadius: '16px',
          padding: '2rem',
          backdropFilter: 'blur(20px)',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            color: 'var(--cyan-accent)',
            fontSize: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            What's Next?
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px'
            }}>
              <div style={{
                color: 'var(--green-neon)',
                fontSize: '1.5rem',
                marginBottom: '0.5rem'
              }}>
                📧
              </div>
              <h4 style={{
                color: 'var(--white)',
                marginBottom: '0.5rem'
              }}>
                Confirmation Email
              </h4>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem'
              }}>
                You'll receive an order confirmation email at {order.shippingEmail}
              </p>
            </div>
            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px'
            }}>
              <div style={{
                color: 'var(--yellow-neon)',
                fontSize: '1.5rem',
                marginBottom: '0.5rem'
              }}>
                🔄
              </div>
              <h4 style={{
                color: 'var(--white)',
                marginBottom: '0.5rem'
              }}>
                Processing
              </h4>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem'
              }}>
                We'll process your order within 1-2 business days
              </p>
            </div>
            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px'
            }}>
              <div style={{
                color: 'var(--purple-accent)',
                fontSize: '1.5rem',
                marginBottom: '0.5rem'
              }}>
              🚚
              </div>
              <h4 style={{
                color: 'var(--white)',
                marginBottom: '0.5rem'
              }}>
                Shipping Updates
              </h4>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem'
              }}>
                Track your order in your account dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => router.push('/account')}
            style={{
              padding: '1rem 2rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid var(--cyan-accent)',
              borderRadius: '8px',
              color: 'var(--white)',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            View Account
          </button>
          <button
            onClick={() => router.push('/products')}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--white)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: 'var(--pink-main)', fontSize: '1.2rem' }}>
          Loading...
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}