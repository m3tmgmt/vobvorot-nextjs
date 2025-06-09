'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Footer } from '@/components/Footer'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Password reset instructions have been sent to your email.')
        setEmail('')
      } else {
        setError(data.error || 'Failed to send password reset email')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container">
        <div style={{
          maxWidth: '500px',
          margin: '2rem auto',
          background: 'rgba(0,0,0,0.6)',
          border: '2px solid var(--pink-main)',
          borderRadius: '16px',
          padding: '3rem',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              color: 'var(--pink-main)',
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              textShadow: '0 0 20px var(--pink-main)'
            }}>
              Forgot Password
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div style={{
              background: 'rgba(0,245,255,0.1)',
              border: '1px solid var(--cyan-accent)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: 'var(--cyan-accent)',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255,107,157,0.1)',
              border: '1px solid var(--pink-neon)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: 'var(--pink-neon)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: 'var(--white)',
                marginBottom: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid var(--cyan-accent)',
                  borderRadius: '12px',
                  color: 'var(--white)',
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--pink-main)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255,107,157,0.3)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--cyan-accent)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              style={{
                width: '100%',
                padding: '1rem',
                background: isLoading || !email 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                border: 'none',
                borderRadius: '12px',
                color: isLoading || !email ? 'rgba(255,255,255,0.5)' : 'var(--white)',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: isLoading || !email ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '2rem'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && email) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,107,157,0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          {/* Back to Login */}
          <div style={{
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '1.5rem'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
              Remember your password?
            </p>
            <Link
              href="/auth/signin"
              style={{
                color: 'var(--cyan-accent)',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--pink-main)'
                e.currentTarget.style.textShadow = '0 0 10px var(--pink-main)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--cyan-accent)'
                e.currentTarget.style.textShadow = 'none'
              }}
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}