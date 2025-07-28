'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode } from 'react'

interface ProductErrorBoundaryProps {
  children: ReactNode
}

/**
 * Specialized error boundary for product-related components
 * Provides user-friendly fallback UI for product display errors
 */
export function ProductErrorBoundary({ children }: ProductErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="product-error-fallback" style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          margin: '0.5rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🛍️
          </div>
          <h3 style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '0.5rem',
            fontSize: '1.1rem'
          }}>
            Product Unavailable
          </h3>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}>
            We're having trouble loading this product. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--pink-neon)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Refresh
          </button>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log product-specific errors
        console.error('Product error:', {
          error: error.message,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error boundary specifically for product images
 */
export function ProductImageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{
          width: '100%',
          height: '280px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            📷
          </div>
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.9rem'
          }}>
            Image unavailable
          </span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}