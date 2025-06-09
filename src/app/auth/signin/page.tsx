'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Refresh session and redirect
        await getSession()
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/' })
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'rgba(0,0,0,0.8)',
        border: '2px solid var(--pink-main)',
        borderRadius: '12px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <h1 style={{
          color: 'var(--pink-main)',
          fontSize: '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '2rem',
          textShadow: '0 0 10px var(--pink-main)'
        }}>
          Sign In
        </h1>

        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--white)',
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '6px',
                color: 'var(--white)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--white)',
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '6px',
                color: 'var(--white)',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{
              color: 'var(--pink-neon)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? 'rgba(255,107,157,0.5)' : 'var(--pink-main)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--white)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--pink-neon)'
                e.currentTarget.style.boxShadow = '0 0 20px var(--pink-main)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--pink-main)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '1.5rem'
        }}>
          <Link 
            href="/auth/forgot-password"
            style={{
              color: 'var(--cyan-accent)',
              textDecoration: 'none',
              fontSize: '0.9rem',
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
            Forgot your password?
          </Link>
        </div>

        {/* Only show OAuth options if providers are configured */}
        {(process.env.NEXT_PUBLIC_GOOGLE_OAUTH === 'true' || process.env.NEXT_PUBLIC_GITHUB_OAUTH === 'true') && (
          <>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '1.5rem',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem'
            }}>
              or continue with
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              {process.env.NEXT_PUBLIC_GOOGLE_OAUTH === 'true' && (
                <button
                  onClick={() => handleSocialSignIn('google')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '6px',
                    color: 'var(--white)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,245,255,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }}
                >
                  Google
                </button>
              )}
              
              {process.env.NEXT_PUBLIC_GITHUB_OAUTH === 'true' && (
                <button
                  onClick={() => handleSocialSignIn('github')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '6px',
                    color: 'var(--white)',
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
                  GitHub
                </button>
              )}
            </div>
          </>
        )}

        <div style={{ 
          textAlign: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.9rem'
        }}>
          Don't have an account?{' '}
          <Link 
            href="/auth/signup"
            style={{
              color: 'var(--cyan-accent)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}