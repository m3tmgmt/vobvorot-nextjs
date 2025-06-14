'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Footer } from '@/components/Footer'

function PaymentCancelContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Try to get order ID from URL parameters
  const orderId = searchParams.get('orderId') || searchParams.get('orderNumber')

  const handleRetryPayment = async () => {
    console.log('Retry payment button clicked', { orderId })
    
    if (!orderId) {
      console.log('No order ID found, redirecting to checkout')
      // No order ID, redirect to checkout for new order
      router.push('/checkout')
      return
    }

    try {
      console.log('Calling retry payment API for order:', orderId)
      
      // Call the retry payment API endpoint
      const response = await fetch(`/api/orders/${orderId}/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      console.log('Retry payment API response:', { status: response.status, result })

      if (response.ok && result.formData) {
        console.log('Creating payment form for WesternBid submission')
        
        // Create and submit the payment form automatically
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = result.targetUrl || 'https://shop.westernbid.info'
        form.style.display = 'none'

        // Add all form fields
        Object.entries(result.formData).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })

        document.body.appendChild(form)
        console.log('Submitting payment form to:', form.action)
        form.submit()
      } else {
        console.error('Failed to retry payment:', result.error)
        console.log('Redirecting to checkout as fallback')
        // Fallback to checkout
        router.push('/checkout')
      }
    } catch (error) {
      console.error('Error retrying payment:', error)
      console.log('Redirecting to checkout due to error')
      // Fallback to checkout
      router.push('/checkout')
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
          
          {orderId && (
            <div style={{
              background: 'rgba(0,245,255,0.1)',
              border: '1px solid var(--cyan-accent)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '2rem',
              fontSize: '0.9rem'
            }}>
              <strong>Order ID:</strong> {orderId}
            </div>
          )}
          
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
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Try Payment Again
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

export default function PaymentCancel() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <div style={{ marginTop: '10rem' }}>Loading...</div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  )
}