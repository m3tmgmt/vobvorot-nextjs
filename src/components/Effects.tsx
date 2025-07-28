'use client'

import { useEffect, useState } from 'react'
import { useClientOnly } from '@/hooks/useClientOnly'

export function Effects() {
  const isClient = useClientOnly()

  useEffect(() => {
    if (!isClient) return
    // Custom cursor
    const cursor = document.createElement('div')
    cursor.className = 'cursor'
    document.body.appendChild(cursor)

    const updateCursor = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px'
      cursor.style.top = e.clientY + 'px'
    }

    document.addEventListener('mousemove', updateCursor)

    // Cursor trails
    const trails: HTMLElement[] = []
    const trailCount = 5

    for (let i = 0; i < trailCount; i++) {
      const trail = document.createElement('div')
      trail.className = 'cursor-trail'
      document.body.appendChild(trail)
      trails.push(trail)
    }

    let mouseX = 0
    let mouseY = 0
    const trailPositions = Array(trailCount).fill({ x: 0, y: 0 })

    const updateTrails = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      trailPositions.unshift({ x: mouseX, y: mouseY })
      trailPositions.pop()

      trails.forEach((trail, index) => {
        const position = trailPositions[index]
        if (position) {
          trail.style.left = position.x + 'px'
          trail.style.top = position.y + 'px'
          trail.style.opacity = (1 - index / trailCount * 0.8).toString()
        }
      })
    }

    document.addEventListener('mousemove', updateTrails)

    // Particles
    const createParticle = () => {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = Math.random() * window.innerWidth + 'px'
      particle.style.animationDelay = Math.random() * 6 + 's'
      particle.style.animationDuration = (Math.random() * 3 + 3) + 's'
      
      const colors = ['var(--pink-main)', 'var(--cyan-accent)', 'var(--purple-accent)', 'var(--yellow-neon)']
      particle.style.background = colors[Math.floor(Math.random() * colors.length)]

      const particles = document.querySelector('.particles')
      if (particles) {
        particles.appendChild(particle)

        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle)
          }
        }, 6000)
      }
    }

    // Create particles container
    const particlesContainer = document.createElement('div')
    particlesContainer.className = 'particles'
    document.body.appendChild(particlesContainer)

    // Create particles periodically
    const particleInterval = setInterval(createParticle, 300)

    // Progress bar
    const progressBar = document.createElement('div')
    progressBar.className = 'progress-bar'
    document.body.appendChild(progressBar)

    const updateProgressBar = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      progressBar.style.width = scrollPercent + '%'
    }

    window.addEventListener('scroll', updateProgressBar)

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', updateCursor)
      document.removeEventListener('mousemove', updateTrails)
      window.removeEventListener('scroll', updateProgressBar)
      clearInterval(particleInterval)
      
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor)
      if (particlesContainer.parentNode) particlesContainer.parentNode.removeChild(particlesContainer)
      if (progressBar.parentNode) progressBar.parentNode.removeChild(progressBar)
      trails.forEach(trail => {
        if (trail.parentNode) trail.parentNode.removeChild(trail)
      })
    }
  }, [])

  return null
}