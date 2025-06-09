'use client'

import { memo } from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  message?: string
  overlay?: boolean
}

/**
 * Reusable loading spinner component with different sizes and styles
 * @param size - Size of the spinner (small: 16px, medium: 24px, large: 32px)
 * @param color - Color of the spinner (default: pink neon)
 * @param message - Optional loading message to display
 * @param overlay - Whether to show as full-screen overlay
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'medium',
  color = 'var(--pink-neon)',
  message,
  overlay = false
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  }

  const spinnerSize = sizeMap[size]

  const spinnerStyles = {
    width: spinnerSize,
    height: spinnerSize,
    border: `2px solid rgba(255, 255, 255, 0.1)`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }

  const containerStyles = overlay ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    zIndex: 9998,
    backdropFilter: 'blur(4px)'
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    gap: '0.5rem'
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={containerStyles}>
        <div style={spinnerStyles} />
        {message && (
          <span style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: size === 'small' ? '0.8rem' : '0.9rem',
            marginTop: '0.5rem'
          }}>
            {message}
          </span>
        )}
      </div>
    </>
  )
})

/**
 * Page-level loading component
 */
interface PageLoadingProps {
  message?: string
}

export const PageLoading = memo(function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <LoadingSpinner 
      size="large" 
      message={message} 
      overlay 
    />
  )
})

/**
 * Button loading state component
 */
export const ButtonLoading = memo(function ButtonLoading() {
  return (
    <LoadingSpinner 
      size="small" 
      color="currentColor" 
    />
  )
})

/**
 * Skeleton loader for content placeholders
 */
export const SkeletonLoader = memo(function SkeletonLoader({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className
}: {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}) {
  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      
      <div
        className={className}
        style={{
          width,
          height,
          borderRadius,
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
    </>
  )
})

/**
 * Product card skeleton loader
 */
export const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <div className="product-card" style={{ padding: '1rem' }}>
      <SkeletonLoader height="280px" width="100%" borderRadius="8px" />
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <SkeletonLoader height="1rem" width="60%" />
        <SkeletonLoader height="1.5rem" width="80%" />
        <SkeletonLoader height="1rem" width="40%" />
        <SkeletonLoader height="2.5rem" width="100%" borderRadius="6px" />
      </div>
    </div>
  )
})

/**
 * List skeleton loader
 */
export const ListSkeleton = memo(function ListSkeleton({
  items = 3,
  height = '4rem'
}: {
  items?: number
  height?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonLoader
          key={index}
          height={height}
          width="100%"
          borderRadius="8px"
        />
      ))}
    </div>
  )
})