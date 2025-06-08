'use client'

import { useEffect } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'

export function SecretDetector() {
  const { findPiece, dispatch, showNotification } = usePuzzle()

  useEffect(() => {
    // Konami Code detection
    let konamiSequence: string[] = []
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
    
    const handleKeyDown = (e: KeyboardEvent) => {
      konamiSequence.push(e.code)
      
      // Keep only the last 10 keys
      if (konamiSequence.length > 10) {
        konamiSequence = konamiSequence.slice(-10)
      }
      
      // Check if konami code is matched
      if (konamiSequence.length === 10 && 
          konamiSequence.every((key, index) => key === konamiCode[index])) {
        findPiece('konami-code')
        dispatch({ type: 'TOGGLE_RAINBOW' })
        showNotification('🌈 RAINBOW MODE ACTIVATED!', 'achievement')
        
        // Add rainbow effect to body
        document.body.style.background = 'linear-gradient(45deg, #ff6b9d, #c084fc, #00f5ff, #ffff00, #39ff14)'
        document.body.style.backgroundSize = '400% 400%'
        document.body.style.animation = 'rainbow 3s ease infinite'
        
        // Add rainbow animation
        const style = document.createElement('style')
        style.textContent = `
          @keyframes rainbow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `
        document.head.appendChild(style)
        
        konamiSequence = []
      }
    }

    // Double click detection for logo
    let clickCount = 0
    let clickTimer: NodeJS.Timeout

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.textContent?.includes('vobvorot') || target.closest('[data-logo]')) {
        clickCount++
        
        if (clickCount === 1) {
          clickTimer = setTimeout(() => {
            clickCount = 0
          }, 300)
        } else if (clickCount === 2) {
          clearTimeout(clickTimer)
          clickCount = 0
          findPiece('double-click-logo')
          showNotification('🎭 Logo secret unlocked!', 'success')
        }
      }
    }

    // Matrix mode trigger (Ctrl + Shift + M)
    const handleMatrixMode = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyM') {
        dispatch({ type: 'TOGGLE_MATRIX' })
        showNotification('💾 MATRIX MODE ACTIVATED!', 'achievement')
        
        // Add matrix effect
        createMatrixEffect()
      }
    }

    // Sequence tracking for products
    let productSequence: number[] = []
    const correctSequence = [1, 3, 5, 2, 4]
    
    const trackProductVisit = (productId: string) => {
      // Extract number from product ID or URL
      const match = productId.match(/\d+/)
      if (match) {
        const num = parseInt(match[0])
        productSequence.push(num)
        
        if (productSequence.length > 5) {
          productSequence = productSequence.slice(-5)
        }
        
        if (productSequence.length === 5 && 
            productSequence.every((num, index) => num === correctSequence[index])) {
          findPiece('product-sequence')
          showNotification('🔢 Sequence master!', 'success')
          productSequence = []
        }
      }
    }

    // URL change detection for product sequence
    const handleURLChange = () => {
      const path = window.location.pathname
      if (path.includes('/products/')) {
        trackProductVisit(path)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleMatrixMode)
    document.addEventListener('click', handleDoubleClick)
    window.addEventListener('popstate', handleURLChange)

    // Track initial page load
    handleURLChange()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleMatrixMode)
      document.removeEventListener('click', handleDoubleClick)
      window.removeEventListener('popstate', handleURLChange)
    }
  }, [findPiece, dispatch, showNotification])

  return null
}

function createMatrixEffect() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.1;
  `
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}".split("")
  const fontSize = 10
  const columns = canvas.width / fontSize

  const drops: number[] = []
  for (let x = 0; x < columns; x++) {
    drops[x] = 1
  }

  function draw() {
    if (!ctx) return
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.04)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#39ff14"
    ctx.font = fontSize + "px monospace"

    for (let i = 0; i < drops.length; i++) {
      const text = matrix[Math.floor(Math.random() * matrix.length)]
      ctx.fillText(text, i * fontSize, drops[i] * fontSize)

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }
      drops[i]++
    }
  }

  const interval = setInterval(draw, 35)

  // Remove effect after 10 seconds
  setTimeout(() => {
    clearInterval(interval)
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas)
    }
  }, 10000)
}