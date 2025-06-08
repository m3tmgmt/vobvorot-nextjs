'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Registration successful but sign in failed')
      } else {
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
          Sign Up
        </h1>

        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--white)',
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginBottom: '1.5rem',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.9rem'
        }}>
          or continue with
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
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
              transition: 'all 0.3s ease'
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
        </div>

        <div style={{ 
          textAlign: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.9rem'
        }}>
          Already have an account?{' '}
          <Link 
            href="/auth/signin"
            style={{
              color: 'var(--cyan-accent)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}