'use client'

import { useEffect } from 'react'
import { useKonami } from '@/contexts/KonamiContext'
import { useMatrix } from '@/contexts/MatrixContext'
import { usePuzzle } from '@/contexts/PuzzleContext'

export default function KonamiActivator() {
  const { state, dispatch, playSound } = useKonami()
  const { activateMatrix } = useMatrix()
  const { dispatch: puzzleDispatch } = usePuzzle()

  // Handle Konami activation effects
  useEffect(() => {
    if (state.isActivated) {
      playSound('success')
      
      // Screen shake effect
      document.body.style.animation = 'konamiShake 0.5s ease-in-out'
      
      // Activate Matrix effect for 10 seconds
      activateMatrix(10000)
      
      // Unlock achievement
      puzzleDispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'code-breaker' })
      
      // Show activation message
      showActivationMessage()
      
      // Auto-open secret menu after 2 seconds
      setTimeout(() => {
        dispatch({ type: 'TOGGLE_SECRET_MENU' })
      }, 2000)
      
      // Reset body animation
      setTimeout(() => {
        document.body.style.animation = ''
      }, 500)
    }
  }, [state.isActivated])

  // Handle color theme changes
  useEffect(() => {
    const root = document.documentElement
    
    switch (state.colorTheme) {
      case 'matrix':
        root.style.setProperty('--pink-main', '#00FF41')
        root.style.setProperty('--purple-accent', '#008F11')
        root.style.setProperty('--cyan-accent', '#00FF41')
        root.style.setProperty('--yellow-neon', '#00FF41')
        document.body.classList.add('theme-matrix')
        document.body.classList.remove('theme-cyber', 'theme-neon')
        break
      case 'cyber':
        root.style.setProperty('--pink-main', '#FF00FF')
        root.style.setProperty('--purple-accent', '#8000FF')
        root.style.setProperty('--cyan-accent', '#00FFFF')
        root.style.setProperty('--yellow-neon', '#FF00FF')
        document.body.classList.add('theme-cyber')
        document.body.classList.remove('theme-matrix', 'theme-neon')
        break
      case 'neon':
        root.style.setProperty('--pink-main', '#FFFF00')
        root.style.setProperty('--purple-accent', '#FF8000')
        root.style.setProperty('--cyan-accent', '#FF0080')
        root.style.setProperty('--yellow-neon', '#FFFF00')
        document.body.classList.add('theme-neon')
        document.body.classList.remove('theme-matrix', 'theme-cyber')
        break
      default:
        root.style.setProperty('--pink-main', '#FF6B9D')
        root.style.setProperty('--purple-accent', '#9D4EDD')
        root.style.setProperty('--cyan-accent', '#00F5FF')
        root.style.setProperty('--yellow-neon', '#FFFF00')
        document.body.classList.remove('theme-matrix', 'theme-cyber', 'theme-neon')
    }
  }, [state.colorTheme])


  const showActivationMessage = () => {
    const message = document.createElement('div')
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #000000, #001100);
        border: 2px solid #00FF41;
        color: #00FF41;
        padding: 2rem;
        border-radius: 10px;
        z-index: 9999;
        font-family: 'JetBrains Mono', monospace;
        text-align: center;
        box-shadow: 0 0 30px rgba(0, 255, 65, 0.5);
        animation: konamiGlow 2s ease-in-out;
      ">
        <div style="font-size: 2rem; margin-bottom: 1rem;">🎮</div>
        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
          KONAMI CODE ACTIVATED!
        </div>
        <div style="font-size: 0.9rem; opacity: 0.8;">
          Secret features unlocked...
        </div>
        <div style="font-size: 0.7rem; margin-top: 1rem; opacity: 0.6;">
          Activation #${state.activationCount}
        </div>
      </div>
    `
    
    document.body.appendChild(message)
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message)
      }
    }, 3000)
  }

  // Show current sequence progress (for debugging/feedback)
  useEffect(() => {
    if (state.currentSequence.length > 0) {
      console.log(`🎮 Konami progress: ${state.currentSequence.length}/10`)
    }
  }, [state.currentSequence])

  // Visual effects for different activation counts
  useEffect(() => {
    if (state.activationCount >= 3) {
      // Developer mode - add special class
      document.body.classList.add('developer-mode')
      
      // Add hidden console messages
      console.log(`
        ╔══════════════════════════════════════╗
        ║        DEVELOPER MODE ACTIVE         ║
        ║                                      ║
        ║  🎮 Triple Konami Achievement!       ║
        ║  🔓 All secrets unlocked             ║
        ║  🚀 Enhanced performance mode        ║
        ║                                      ║
        ║  Made with 💖 by Claude & VobVorot   ║
        ╚══════════════════════════════════════╝
      `)
    }
  }, [state.activationCount])

  return null // This component only handles effects, no UI
}