'use client'

import { useEffect, useRef, memo } from 'react'
import { useClientOnly } from '@/hooks/useClientOnly'

// Throttle function for better performance
function throttle(func: Function, limit: number) {
  let inThrottle: boolean
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

function CustomCursorComponent() {
  const isClient = useClientOnly()
  const cursorRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (!isClient) return

    const cursor = cursorRef.current
    if (!cursor) return

    // Show regular cursor temporarily
    document.body.classList.add('show-cursor')

    // Create trail elements
    const trailCount = 6
    trailRefs.current = []
    
    for (let i = 0; i < trailCount; i++) {
      const trail = document.createElement('div')
      trail.className = 'cursor-trail'
      trail.style.position = 'fixed'
      trail.style.width = '6px'
      trail.style.height = '6px'
      trail.style.background = 'var(--pink-neon)'
      trail.style.borderRadius = '50%'
      trail.style.pointerEvents = 'none'
      trail.style.zIndex = '9998'
      trail.style.opacity = '0'
      trail.style.transition = 'opacity 0.1s ease'
      document.body.appendChild(trail)
      trailRefs.current.push(trail)
    }

    const mousePositions: { x: number; y: number }[] = []

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      
      // Optimized cursor position update
      cursor.style.transform = `translate3d(${clientX - 10}px, ${clientY - 10}px, 0)`
      cursor.style.opacity = '1'

      // Store mouse position for trail
      mousePositions.unshift({ x: clientX, y: clientY })
      if (mousePositions.length > trailCount) {
        mousePositions.length = trailCount
      }

      // Immediate trail updates without setTimeout for better performance
      trailRefs.current.forEach((trail, index) => {
        const pos = mousePositions[index + 1]
        if (pos) {
          trail.style.transform = `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)`
          trail.style.opacity = `${(trailCount - index) / trailCount * 0.6}`
        }
      })
    }

    const handleMouseEnter = () => {
      cursor.style.opacity = '1'
    }

    const handleMouseLeave = () => {
      cursor.style.opacity = '0'
      trailRefs.current.forEach(trail => {
        trail.style.opacity = '0'
      })
    }

    // Add throttled event listeners for better performance
    const throttledMouseMove = throttle(handleMouseMove, 16) // ~60fps
    document.addEventListener('mousemove', throttledMouseMove, { passive: true })
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Optimized cursor initialization
    cursor.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      background: linear-gradient(45deg, var(--pink-main), var(--cyan-accent));
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      opacity: 1;
      mix-blend-mode: difference;
      will-change: transform;
      transform: translate3d(0, 0, 0);
    `

    return () => {
      document.removeEventListener('mousemove', throttledMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
      
      // Restore cursor: none
      document.body.classList.remove('show-cursor')
      
      // Cleanup trail elements
      trailRefs.current.forEach(trail => {
        if (trail.parentNode) {
          trail.parentNode.removeChild(trail)
        }
      })
      trailRefs.current = []
    }
  }, [isClient])

  if (!isClient) return null

  return <div ref={cursorRef} className="cursor" />
}

export const CustomCursor = memo(CustomCursorComponent)