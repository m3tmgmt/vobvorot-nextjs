'use client'

import { useKonami } from '@/contexts/KonamiContext'
import { useMatrix } from '@/contexts/MatrixContext'
import { useEffect, useState } from 'react'

export default function SecretMenu() {
  const { state, dispatch, playSound } = useKonami()
  const { activateMatrix, deactivateMatrix } = useMatrix()
  const [terminalText, setTerminalText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  // Terminal typing effect
  useEffect(() => {
    if (state.secretMenuOpen) {
      const text = '> SECRET CONSOLE ACTIVATED...'
      let index = 0
      
      const typeText = () => {
        if (index < text.length) {
          setTerminalText(text.slice(0, index + 1))
          index++
          setTimeout(typeText, 50)
        }
      }
      
      typeText()
    } else {
      setTerminalText('')
    }
  }, [state.secretMenuOpen])

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    
    return () => clearInterval(interval)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.secretMenuOpen) {
        dispatch({ type: 'TOGGLE_SECRET_MENU' })
        playSound('keypress')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [state.secretMenuOpen])

  const handleMenuAction = (action: string) => {
    playSound('keypress')
    
    switch (action) {
      case 'matrix':
        // Always trigger matrix effect when clicked
        activateMatrix(30000) // 30 seconds
        break
        
      case 'theme':
        const themes: Array<typeof state.colorTheme> = ['default', 'matrix', 'cyber', 'neon']
        const currentIndex = themes.indexOf(state.colorTheme)
        const nextTheme = themes[(currentIndex + 1) % themes.length]
        dispatch({ type: 'SET_COLOR_THEME', payload: nextTheme })
        break
        
      case 'particles':
        // Trigger particle density increase
        document.body.classList.toggle('particles-x10')
        break
        
      case 'puzzles':
        dispatch({ type: 'TOGGLE_GOD_MODE' })
        break
        
      case 'sound':
        dispatch({ type: 'TOGGLE_SOUND' })
        break
        
      case 'credits':
        showCredits()
        break
        
      case 'close':
        dispatch({ type: 'TOGGLE_SECRET_MENU' })
        break
    }
  }

  const showCredits = () => {
    const credits = document.createElement('div')
    credits.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        color: #00FF41;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'JetBrains Mono', monospace;
        animation: fadeIn 0.5s ease;
      ">
        <div style="text-align: center; max-width: 600px;">
          <div style="font-size: 3rem; margin-bottom: 2rem;">🚀</div>
          <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #FF6B9D;">VobVorot Store</h1>
          
          <div style="text-align: left; margin: 2rem 0;">
            <div>🎮 Konami Code Integration</div>
            <div>✨ Matrix Effects System</div>
            <div>🌟 Particle Animation Engine</div>
            <div>🎯 Interactive Puzzle System</div>
            <div>💫 Advanced UI Components</div>
            <div>🔮 Secret Feature Framework</div>
          </div>
          
          <div style="margin-top: 3rem; opacity: 0.7;">
            <div>Built with Next.js 15.3.3</div>
            <div>TypeScript & React 19</div>
            <div>Styled with love 💖</div>
          </div>
          
          <div style="margin-top: 2rem; font-size: 0.8rem; opacity: 0.5;">
            Press ESC to close
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(credits)
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(credits)
        document.removeEventListener('keydown', handleEscape)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    // Auto close after 10 seconds
    setTimeout(() => {
      if (credits.parentNode) {
        document.body.removeChild(credits)
        document.removeEventListener('keydown', handleEscape)
      }
    }, 10000)
  }

  if (!state.secretMenuOpen) return null

  return (
    <div 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(0, 17, 0, 0.95))',
        border: '2px solid #00FF41',
        borderRadius: '10px',
        padding: '2rem',
        zIndex: 9998,
        fontFamily: '"JetBrains Mono", monospace',
        color: '#00FF41',
        minWidth: '400px',
        boxShadow: '0 0 30px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1)',
        animation: 'secretMenuSlide 0.3s ease-out'
      }}
    >
      {/* Terminal Header */}
      <div style={{ 
        borderBottom: '1px solid #00FF41', 
        paddingBottom: '1rem', 
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          🕹️ SECRET CONSOLE 🕹️
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
          {terminalText}{showCursor ? '█' : ' '}
        </div>
      </div>

      {/* Menu Options */}
      <div style={{ display: 'grid', gap: '0.8rem' }}>
        <button
          onClick={() => handleMenuAction('matrix')}
          style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00FF41',
            color: '#00FF41',
            padding: '0.8rem',
            borderRadius: '5px',
            fontSize: '0.9rem',
            textAlign: 'left',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.2)'
            e.currentTarget.style.transform = 'translateX(5px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          [1] Activate Matrix Rain (30s)
        </button>

        <button
          onClick={() => handleMenuAction('theme')}
          style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00FF41',
            color: '#00FF41',
            padding: '0.8rem',
            borderRadius: '5px',
            fontSize: '0.9rem',
            textAlign: 'left',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.2)'
            e.currentTarget.style.transform = 'translateX(5px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          [2] Color Theme: {state.colorTheme.toUpperCase()}
        </button>

        <button
          onClick={() => handleMenuAction('particles')}
          style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00FF41',
            color: '#00FF41',
            padding: '0.8rem',
            borderRadius: '5px',
            fontSize: '0.9rem',
            textAlign: 'left',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.2)'
            e.currentTarget.style.transform = 'translateX(5px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          [3] Particle Density x10
        </button>

        <button
          onClick={() => handleMenuAction('puzzles')}
          style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00FF41',
            color: '#00FF41',
            padding: '0.8rem',
            borderRadius: '5px',
            fontSize: '0.9rem',
            textAlign: 'left',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.2)'
            e.currentTarget.style.transform = 'translateX(5px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          [4] God Mode: {state.godModeActive ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={() => handleMenuAction('sound')}
          style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00FF41',
            color: '#00FF41',
            padding: '0.8rem',
            borderRadius: '5px',
            fontSize: '0.9rem',
            textAlign: 'left',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.2)'
            e.currentTarget.style.transform = 'translateX(5px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          [5] Sound Effects: {state.soundEnabled ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={() => handleMenuAction('credits')}
          style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00FF41',
            color: '#00FF41',
            padding: '0.8rem',
            borderRadius: '5px',
            fontSize: '0.9rem',
            textAlign: 'left',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.2)'
            e.currentTarget.style.transform = 'translateX(5px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          [6] Developer Credits
        </button>
      </div>

      {/* Footer */}
      <div style={{ 
        borderTop: '1px solid #00FF41', 
        paddingTop: '1rem', 
        marginTop: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        opacity: 0.7
      }}>
        Press [ESC] to close • Activation #{state.activationCount}
      </div>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: -1
        }}
        onClick={() => dispatch({ type: 'TOGGLE_SECRET_MENU' })}
      />
    </div>
  )
}