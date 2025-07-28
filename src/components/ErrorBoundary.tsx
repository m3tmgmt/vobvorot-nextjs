'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app.
 * 
 * @param children - Child components to wrap with error boundary
 * @param fallback - Custom fallback UI to display when error occurs
 * @param onError - Optional callback to handle errors (for logging, analytics, etc.)
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service (Sentry, LogRocket, etc.)
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="error-boundary" style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#ff4444', marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: 'var(--pink-neon)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              color: 'var(--pink-neon)',
              border: '1px solid var(--pink-neon)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#ff4444' }}>
                Error Details (Development)
              </summary>
              <pre style={{
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.8rem',
                color: '#fff'
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component that wraps a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Simplified error boundary for basic use cases
 */
export function SimpleErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          <p>Unable to load this section. Please try refreshing the page.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}