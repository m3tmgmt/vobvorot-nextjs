'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { Footer } from '@/components/Footer'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { dispatch } = useCart()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderType, setOrderType] = useState<string | null>(null)

  useEffect(() => {
    const paymentId = searchParams.get('paymentId')
    const orderIdParam = searchParams.get('orderId')
    const type = searchParams.get('type')
    
    if (paymentId && orderIdParam) {
      setOrderId(orderIdParam)
      setOrderType(type)
      verifyPayment(paymentId, orderIdParam, type)
    } else {
      // Redirect if no payment info
      router.push('/products')
    }
  }, [searchParams, router])

  const verifyPayment = async (paymentId: string, orderId: string, orderType: string | null) => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId, orderId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setVerified(true)
          
          // Clear cart only after successful payment verification
          dispatch({ type: 'CLEAR_CART' })
          
          // Auto-redirect based on order type
          setTimeout(() => {
            if (orderType === 'sign') {
              // For sign orders, show success message on same page
              // No redirect needed as we'll show sign-specific success message
            } else {
              router.push(`/checkout/success?orderId=${orderId}`)
            }
          }, 3000)
        } else {
          setVerified(false)
        }
      } else {
        setVerified(false)
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      setVerified(false)
    } finally {
      setVerifying(false)
    }
  }

  if (verifying) {
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
              ⏳
            </div>
            <h1 style={{
              color: 'var(--cyan-accent)',
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              Verifying Payment
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.1rem'
            }}>
              Please wait while we verify your payment with WesternBid...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!verified) {
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
              Payment Verification Failed
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '2rem'
            }}>
              We couldn't verify your payment. Please contact support if you believe this is an error.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => router.push('/products')}
                style={{
                  padding: '1rem 2rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px',
                  color: 'var(--white)',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Continue Shopping
              </button>
              <button
                onClick={() => router.push('/account')}
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
                View Orders
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(57,255,20,0.1)',
          border: '2px solid var(--green-neon)',
          borderRadius: '16px',
          padding: '3rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{
            color: 'var(--green-neon)',
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '0 0 20px var(--green-neon)'
          }}>
            {orderType === 'sign' ? 'Thanks, babe. It\'s cooking.' : 'Payment Successful!'}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.1rem',
            marginBottom: '2rem'
          }}>
            {orderType === 'sign' 
              ? 'Your custom sign photo will drop in your inbox in 2-7 days. Stay golden, stay chill. ✨'
              : 'Your payment has been processed successfully through WesternBid.'}
          </p>
          {orderType !== 'sign' && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <p style={{
                color: 'var(--cyan-accent)',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}>
                Redirecting to order confirmation in 3 seconds...
              </p>
              <button
                onClick={() => router.push(`/checkout/success?orderId=${orderId}`)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--white)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                View Order Details Now
              </button>
            </div>
          )}
          {orderType === 'sign' && (
            <div style={{
              background: 'rgba(255,107,157,0.1)',
              padding: '2rem',
              borderRadius: '12px',
              marginTop: '2rem'
            }}>
              <h3 style={{
                color: 'var(--pink-main)',
                marginBottom: '1rem'
              }}>
                What happens next:
              </h3>
              <ul style={{
                textAlign: 'left',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: '1.8'
              }}>
                <li>✍️ I'll handwrite your sign with love and style</li>
                <li>📸 Take a gorgeous photo just for you</li>
                <li>💌 Send it directly to your email</li>
              </ul>
              <p style={{
                marginTop: '1.5rem',
                color: 'var(--cyan-accent)',
                fontSize: '0.9rem'
              }}>
                Order #{orderId}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function PaymentSuccessPage() {
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
      <PaymentSuccessContent />
    </Suspense>
  )
}