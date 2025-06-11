'use client'

import { ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'

interface LazySectionProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  threshold?: number
  rootMargin?: string
  minHeight?: string
}

export function LazySection({ 
  children, 
  className = '', 
  style,
  threshold = 0.1,
  rootMargin = '100px',
  minHeight = '200px'
}: LazySectionProps) {
  const { ref, isInView } = useInView({ 
    threshold, 
    rootMargin, 
    triggerOnce: true 
  })

  return (
    <section 
      ref={ref} 
      className={className}
      style={{
        minHeight: isInView ? 'auto' : minHeight,
        ...style
      }}
    >
      {isInView ? children : (
        <div style={{
          height: minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '10px'
        }}>
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.9rem',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            Loading...
          </div>
        </div>
      )}
    </section>
  )
}