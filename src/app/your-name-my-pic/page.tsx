'use client'

import { useState } from 'react'
import { Footer } from '@/components/Footer'

export default function YourNameMyPicPage() {
  const [formData, setFormData] = useState({
    signName: '',
    email: '',
    extraNotes: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Send order data to API
      const response = await fetch('/api/sign-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Redirect to payment page
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl
        } else {
          // Fallback to success page
          setIsSubmitted(true)
        }
      } else {
        alert(result.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Order submission failed:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          flex: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem' 
        }}>
          <div style={{
            textAlign: 'center',
            background: 'rgba(0,0,0,0.8)',
            border: '2px solid var(--pink-main)',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '500px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>✨</div>
            <h2 style={{
              color: 'var(--pink-main)',
              fontSize: '2rem',
              marginBottom: '1.5rem',
              fontWeight: '700'
            }}>
              Thanks, babe. It's cooking.
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.2rem',
              lineHeight: '1.6'
            }}>
              Your sign pic drops in 2–7 days. Stay golden, stay chill.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="hero-section hero-small">
        <div className="hero-overlay" style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.8), rgba(157,78,221,0.6))' }}></div>
        
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <h1 className="hero-title glitch" data-logo style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            Your Name, My Pic
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.3rem', marginBottom: '2rem' }}>
            Custom Sign Photos ✍️
          </p>
          <p style={{ 
            fontSize: '1.1rem', 
            maxWidth: '600px', 
            margin: '0 auto', 
            color: 'rgba(255,255,255,0.9)', 
            lineHeight: '1.6' 
          }}>
            Snag your custom sign pic — your name, handwritten and held by me.<br />
            Unique vibes only. Rare, personal, one-of-a-kind.
          </p>
        </div>
      </section>

      {/* Order Form Section */}
      <section className="products-section section-spacing-medium">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Pricing Info */}
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--cyan-accent)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '3rem',
            textAlign: 'center',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <div style={{ color: 'var(--yellow-neon)', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  💸 $50
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
                  Price
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--green-neon)', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  ⏳ 2–7 days
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
                  Processing time
                </div>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--pink-main)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{
              color: 'var(--pink-main)',
              fontSize: '1.8rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              ✍️ Order Form:
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Name for sign */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  1. Name for the sign
                </label>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem' 
                }}>
                  What should I write?
                </p>
                <input
                  type="text"
                  name="signName"
                  value={formData.signName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter the name for your sign..."
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  2. Your email
                </label>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem' 
                }}>
                  That's where you'll receive the photo.
                </p>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Extra notes */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  3. Extra notes (optional)
                </label>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem' 
                }}>
                  Mood, styling, special requests...
                </p>
                <textarea
                  name="extraNotes"
                  value={formData.extraNotes}
                  onChange={handleInputChange}
                  placeholder="Any special requests or style preferences..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Payment section */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  4. Payment
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !formData.signName || !formData.email}
                style={{
                  width: '100%',
                  background: isLoading 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'linear-gradient(45deg, var(--pink-main), var(--purple-accent))',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  padding: '1.2rem',
                  borderRadius: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isLoading || !formData.signName || !formData.email ? 0.7 : 1
                }}
              >
                {isLoading ? 'Processing...' : 'Pay $50 & Submit'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}