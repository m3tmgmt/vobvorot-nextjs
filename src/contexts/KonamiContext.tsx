'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'

interface KonamiState {
  isActivated: boolean
  secretMenuOpen: boolean
  currentSequence: string[]
  colorTheme: 'default' | 'matrix' | 'cyber' | 'neon'
  soundEnabled: boolean
  activationCount: number
}

type KonamiAction =
  | { type: 'ADD_KEY'; payload: string }
  | { type: 'ACTIVATE_KONAMI' }
  | { type: 'DEACTIVATE_KONAMI' }
  | { type: 'TOGGLE_SECRET_MENU' }
  | { type: 'SET_COLOR_THEME'; payload: KonamiState['colorTheme'] }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'RESET_SEQUENCE' }
  | { type: 'INCREMENT_ACTIVATION' }

const KONAMI_SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
]

const initialState: KonamiState = {
  isActivated: false,
  secretMenuOpen: false,
  currentSequence: [],
  colorTheme: 'default',
  soundEnabled: true,
  activationCount: 0
}

function konamiReducer(state: KonamiState, action: KonamiAction): KonamiState {
  switch (action.type) {
    case 'ADD_KEY':
      const newSequence = [...state.currentSequence, action.payload]
      
      // Check if sequence matches so far
      const isValidSequence = KONAMI_SEQUENCE.slice(0, newSequence.length)
        .every((key, index) => key === newSequence[index])
      
      if (!isValidSequence) {
        return { ...state, currentSequence: [] }
      }
      
      // Check if complete sequence
      if (newSequence.length === KONAMI_SEQUENCE.length) {
        return {
          ...state,
          currentSequence: [],
          isActivated: true,
          activationCount: state.activationCount + 1
        }
      }
      
      return { ...state, currentSequence: newSequence }
      
    case 'ACTIVATE_KONAMI':
      return {
        ...state,
        isActivated: true,
        activationCount: state.activationCount + 1
      }
      
    case 'DEACTIVATE_KONAMI':
      return {
        ...state,
        isActivated: false,
        secretMenuOpen: false
      }
      
    case 'TOGGLE_SECRET_MENU':
      return {
        ...state,
        secretMenuOpen: !state.secretMenuOpen
      }
      
    case 'SET_COLOR_THEME':
      return {
        ...state,
        colorTheme: action.payload
      }
      
    case 'TOGGLE_SOUND':
      return {
        ...state,
        soundEnabled: !state.soundEnabled
      }
      
    case 'RESET_SEQUENCE':
      return {
        ...state,
        currentSequence: []
      }
      
    case 'INCREMENT_ACTIVATION':
      return {
        ...state,
        activationCount: state.activationCount + 1
      }
      
    default:
      return state
  }
}

interface KonamiContextType {
  state: KonamiState
  dispatch: React.Dispatch<KonamiAction>
  playSound: (soundType: 'keypress' | 'success' | 'error') => void
}

const KonamiContext = createContext<KonamiContextType | undefined>(undefined)

export function KonamiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(konamiReducer, initialState)

  // Sound effects
  const playSound = (soundType: 'keypress' | 'success' | 'error') => {
    if (!state.soundEnabled) return

    // Create audio context for 8-bit sounds
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Different frequencies for different sounds
      switch (soundType) {
        case 'keypress':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          break
        case 'success':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          break
        case 'error':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          break
      }

      oscillator.type = 'square' // 8-bit style
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + (soundType === 'success' ? 0.5 : 0.1))
    } catch (error) {
      // Fallback for browsers without audio context
      console.log(`🔊 ${soundType} sound would play here`)
    }
  }

  // Global keyboard listener
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Clear timeout on new keypress
      clearTimeout(timeoutId)
      
      // Add key to sequence
      dispatch({ type: 'ADD_KEY', payload: event.code })
      playSound('keypress')

      // Reset sequence after 3 seconds of inactivity
      timeoutId = setTimeout(() => {
        dispatch({ type: 'RESET_SEQUENCE' })
      }, 3000)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeoutId)
    }
  }, [state.soundEnabled])

  // Save state to localStorage
  useEffect(() => {
    const savedState = {
      colorTheme: state.colorTheme,
      soundEnabled: state.soundEnabled,
      activationCount: state.activationCount
    }
    localStorage.setItem('konami-state', JSON.stringify(savedState))
  }, [state.colorTheme, state.soundEnabled, state.activationCount])

  // Load state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('konami-state')
      if (saved) {
        const { colorTheme, soundEnabled } = JSON.parse(saved)
        if (colorTheme) dispatch({ type: 'SET_COLOR_THEME', payload: colorTheme })
        if (typeof soundEnabled === 'boolean') {
          if (!soundEnabled) dispatch({ type: 'TOGGLE_SOUND' })
        }
      }
    } catch (error) {
      console.log('Could not load konami state from localStorage')
    }
  }, [])

  return (
    <KonamiContext.Provider value={{ state, dispatch, playSound }}>
      {children}
    </KonamiContext.Provider>
  )
}

export function useKonami() {
  const context = useContext(KonamiContext)
  if (context === undefined) {
    throw new Error('useKonami must be used within a KonamiProvider')
  }
  return context
}