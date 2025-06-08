'use client'

import { useEffect, useRef } from 'react'
import { useClientOnly } from '@/hooks/useClientOnly'

export function CustomCursor() {
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
      
      // Update cursor position
      cursor.style.left = `${clientX - 10}px`
      cursor.style.top = `${clientY - 10}px`
      cursor.style.opacity = '1'

      // Store mouse position for trail
      mousePositions.unshift({ x: clientX, y: clientY })
      if (mousePositions.length > trailCount) {
        mousePositions.splice(trailCount)
      }

      // Update trail positions with delay
      trailRefs.current.forEach((trail, index) => {
        setTimeout(() => {
          const pos = mousePositions[index]
          if (pos) {
            trail.style.left = `${pos.x - 3}px`
            trail.style.top = `${pos.y - 3}px`
            trail.style.opacity = `${(trailCount - index) / trailCount * 0.7}`
          }
        }, index * 20)
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

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Show cursor initially
    cursor.style.opacity = '1'
    cursor.style.position = 'fixed'
    cursor.style.width = '20px'
    cursor.style.height = '20px'
    cursor.style.background = 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))'
    cursor.style.borderRadius = '50%'
    cursor.style.pointerEvents = 'none'
    cursor.style.zIndex = '9999'
    cursor.style.transition = 'transform 0.1s ease'
    cursor.style.mixBlendMode = 'difference'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
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