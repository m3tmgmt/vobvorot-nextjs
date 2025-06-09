import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Product Not Found | VobVorot Store',
  description: 'The requested product could not be found. Browse our collection of Y2K fashion and retro style clothing.',
  robots: { index: false, follow: true }
}

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '700',
          color: 'var(--pink-main)',
          marginBottom: '1rem',
          textShadow: '0 0 20px var(--pink-main)'
        }}>
          404
        </h1>
        
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: 'var(--cyan-accent)',
          marginBottom: '1rem',
          textShadow: '0 0 10px var(--cyan-accent)'
        }}>
          Product Not Found
        </h2>
        
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          Sorry, we couldn't find the product you're looking for. It might have been removed, renamed, or is temporarily unavailable.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            href="/products"
            className="hero-button"
            style={{
              textDecoration: 'none',
              padding: '1rem 2rem',
              fontSize: '1rem'
            }}
          >
            Browse All Products
          </Link>
          
          <Link 
            href="/"
            className="filter-btn"
            style={{
              textDecoration: 'none',
              padding: '1rem 2rem',
              fontSize: '1rem',
              background: 'transparent',
              border: '2px solid var(--cyan-accent)',
              color: 'var(--cyan-accent)',
              borderRadius: '30px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--cyan-accent)'
              e.currentTarget.style.color = 'var(--black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--cyan-accent)'
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}