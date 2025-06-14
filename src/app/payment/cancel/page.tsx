'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Footer } from '@/components/Footer'

export default function PaymentCancelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [retrying, setRetrying] = useState(false)
  
  // Try to get order ID from URL parameters
  const orderId = searchParams.get('orderId') || searchParams.get('orderNumber')

  const handleRetryPayment = async () => {
    if (!orderId) {
      // No order ID available, redirect to checkout
      router.push('/checkout')
      return
    }

    setRetrying(true)
    
    try {
      const response = await fetch(`/api/orders/${orderId}/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: 'stripe' // Default to stripe, could be made selectable
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        console.log('Retry payment created:', result)
        
        // Create and submit form directly to WesternBid
        if (result.formData && result.targetUrl) {
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = result.targetUrl
          form.style.display = 'none'
          
          // Add all form fields
          Object.entries(result.formData).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          })
          
          // Add form to page and submit
          document.body.appendChild(form)
          console.log('Submitting retry payment form...')
          form.submit()
          
        } else if (result.paymentUrl) {
          window.location.href = result.paymentUrl
        } else {
          throw new Error('No payment URL provided')
        }
      } else {
        const errorData = await response.json()
        console.error('Retry payment failed:', errorData)
        alert(errorData.error || 'Failed to retry payment')
      }
    } catch (error) {
      console.error('Retry payment error:', error)
      alert('Unable to retry payment. Please try again.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(255,193,7,0.1)',
          border: '2px solid var(--yellow-neon)',
          borderRadius: '16px',
          padding: '3rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{
            color: 'var(--yellow-neon)',
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '0 0 20px var(--yellow-neon)'
          }}>
            Payment Cancelled
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.1rem',
            marginBottom: '2rem'
          }}>
            Your payment was cancelled. You can try again or continue shopping.
          </p>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              color: 'var(--white)',
              marginBottom: '1rem'
            }}>
              What happened?
            </h3>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              Your payment through WesternBid was cancelled. This could be because you:
              <br />• Clicked the back button or closed the payment window
              <br />• Decided not to complete the purchase
              <br />• Encountered an issue during the payment process
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              style={{
                padding: '1rem 2rem',
                background: retrying 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--white)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: retrying ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: retrying ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!retrying) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!retrying) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              {retrying ? 'Retrying Payment...' : 'Try Payment Again'}
            </button>
            <button
              onClick={() => router.push('/products')}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,245,255,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}