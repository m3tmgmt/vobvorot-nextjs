'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Footer } from '@/components/Footer'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Invalid or missing reset token')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password has been reset successfully! Redirecting to sign in...')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthColor = passwordStrength <= 2 ? 'var(--pink-neon)' : passwordStrength === 3 ? 'var(--yellow-neon)' : 'var(--green-neon)'
  const strengthText = passwordStrength <= 2 ? 'Weak' : passwordStrength === 3 ? 'Medium' : 'Strong'

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
              Reset Password
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              Enter your new password below.
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

          {token && !message && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter new password"
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
                {password && (
                  <div style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '4px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        height: '100%',
                        background: strengthColor,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                    <span style={{ color: strengthColor }}>
                      {strengthText}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: `2px solid ${confirmPassword && password !== confirmPassword ? 'var(--pink-neon)' : 'var(--cyan-accent)'}`,
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
                    const borderColor = confirmPassword && password !== confirmPassword ? 'var(--pink-neon)' : 'var(--cyan-accent)'
                    e.currentTarget.style.borderColor = borderColor
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {confirmPassword && password !== confirmPassword && (
                  <div style={{
                    marginTop: '0.5rem',
                    color: 'var(--pink-neon)',
                    fontSize: '0.9rem'
                  }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(0,245,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                <h4 style={{ color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>
                  Password Requirements:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                  <li>At least 8 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: isLoading || !password || !confirmPassword || password !== confirmPassword
                    ? 'rgba(255,255,255,0.1)' 
                    : 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                  border: 'none',
                  borderRadius: '12px',
                  color: isLoading || !password || !confirmPassword || password !== confirmPassword 
                    ? 'rgba(255,255,255,0.5)' : 'var(--white)',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: isLoading || !password || !confirmPassword || password !== confirmPassword 
                    ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  marginBottom: '2rem'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && password && confirmPassword && password === confirmPassword) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,107,157,0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div style={{
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '1.5rem'
          }}>
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

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  )
}