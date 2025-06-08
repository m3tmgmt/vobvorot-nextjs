'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/Footer'

function MockPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentId, setPaymentId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const paymentIdParam = searchParams.get('paymentId')
    const orderIdParam = searchParams.get('orderId')
    
    if (paymentIdParam && orderIdParam) {
      setPaymentId(paymentIdParam)
      setOrderId(orderIdParam)
    } else {
      router.push('/products')
    }
  }, [searchParams, router])

  const handlePaymentSuccess = () => {
    setProcessing(true)
    
    // Simulate payment processing delay
    setTimeout(() => {
      router.push(`/payment/success?paymentId=${paymentId}&orderId=${orderId}`)
    }, 2000)
  }

  const handlePaymentCancel = () => {
    router.push('/payment/cancel')
  }

  if (processing) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(0,245,255,0.1)',
            border: '2px solid var(--cyan-accent)',
            borderRadius: '16px',
            padding: '3rem',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem',
              animation: 'pulse 2s infinite'
            }}>
              💳
            </div>
            <h1 style={{
              color: 'var(--cyan-accent)',
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              Processing Payment
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.1rem'
            }}>
              Please wait while we process your payment...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* WesternBid Mock Payment Interface */}
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          border: '2px solid var(--pink-main)',
          borderRadius: '16px',
          padding: '2rem',
          backdropFilter: 'blur(20px)',
          marginBottom: '2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              color: 'var(--pink-main)',
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '0.5rem'
            }}>
              WesternBid Payment Gateway
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.9rem'
            }}>
              Secure Payment Processing (Demo Mode)
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--cyan-accent)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              color: 'var(--cyan-accent)',
              marginBottom: '1rem'
            }}>
              Payment Details
            </h3>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <span>Payment ID:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{paymentId}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <span>Order ID:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{orderId}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <span>Status:</span>
              <span style={{ color: 'var(--yellow-neon)' }}>Awaiting Payment</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--purple-accent)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              color: 'var(--purple-accent)',
              marginBottom: '1rem'
            }}>
              Choose Payment Method
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                background: 'rgba(0,123,255,0.1)',
                border: '1px solid #007bff',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#007bff',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  color: 'white',
                  fontWeight: '700'
                }}>
                  PP
                </div>
                <div>
                  <div style={{ color: 'var(--white)', fontWeight: '600' }}>
                    PayPal
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    Pay securely with your PayPal account
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid #6366f1',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.8rem'
                }}>
                  ST
                </div>
                <div>
                  <div style={{ color: 'var(--white)', fontWeight: '600' }}>
                    Stripe
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    Pay with credit or debit card via Stripe
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={handlePaymentCancel}
              style={{
                padding: '1rem 2rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--pink-neon)',
                borderRadius: '8px',
                color: 'var(--pink-neon)',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,107,157,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
            >
              Cancel Payment
            </button>
            <button
              onClick={handlePaymentSuccess}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(45deg, var(--green-neon), #32cd32)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 0 20px var(--green-neon)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Complete Payment
            </button>
          </div>
        </div>

        {/* Demo Notice */}
        <div style={{
          background: 'rgba(255,193,7,0.1)',
          border: '1px solid var(--yellow-neon)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{
            color: 'var(--yellow-neon)',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            ⚠️ Demo Mode
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.8rem'
          }}>
            This is a demonstration of the WesternBid payment gateway integration.
            No real payment will be processed.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: 'var(--pink-main)', fontSize: '1.2rem' }}>
          Loading payment gateway...
        </div>
      </div>
    }>
      <MockPaymentContent />
    </Suspense>
  )
}