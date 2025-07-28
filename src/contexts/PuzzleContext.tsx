'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useClientOnly } from '@/hooks/useClientOnly'

interface PuzzlePiece {
  id: string
  name: string
  description: string
  location: string
  found: boolean
  foundAt?: Date
  hint: string
  category: 'hidden' | 'interactive' | 'sequence' | 'easter-egg'
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  requirement: string
  color: string
}

interface PuzzleState {
  pieces: PuzzlePiece[]
  achievements: Achievement[]
  totalScore: number
  secretsFound: number
  konami: boolean
  rainbowMode: boolean
  matrixMode: boolean
  isLoading: boolean
}

type PuzzleAction =
  | { type: 'FIND_PIECE'; payload: string }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'TOGGLE_KONAMI' }
  | { type: 'TOGGLE_RAINBOW' }
  | { type: 'TOGGLE_MATRIX' }
  | { type: 'LOAD_STATE'; payload: PuzzleState }
  | { type: 'RESET_PROGRESS' }
  | { type: 'SET_LOADING'; payload: boolean }

const initialPieces: PuzzlePiece[] = [
  {
    id: 'nav-secret',
    name: 'Navigation Secret',
    description: 'Found the hidden element in navigation',
    location: 'Navigation menu',
    found: false,
    hint: 'Look for something that glitches...',
    category: 'hidden'
  },
  {
    id: 'hero-click',
    name: 'Hero Interaction',
    description: 'Clicked the hidden area in hero section',
    location: 'Hero section',
    found: false,
    hint: 'The title holds secrets...',
    category: 'interactive'
  },
  {
    id: 'product-sequence',
    name: 'Product Sequence',
    description: 'Found the correct product viewing order',
    location: 'Product pages',
    found: false,
    hint: 'The order matters... 1, 3, 5, 2, 4',
    category: 'sequence'
  },
  {
    id: 'footer-code',
    name: 'Footer Mystery',
    description: 'Decoded the footer message',
    location: 'Footer area',
    found: false,
    hint: 'Numbers spell words...',
    category: 'hidden'
  },
  {
    id: 'training-easter',
    name: 'Training Easter Egg',
    description: 'Found the Konami code in training',
    location: 'Training page',
    found: false,
    hint: 'Try the classic cheat code...',
    category: 'easter-egg'
  },
  {
    id: 'community-member',
    name: 'Ghost Member',
    description: 'Became a ghost member of the community',
    location: 'Community page',
    found: false,
    hint: 'Someone is hiding in plain sight...',
    category: 'hidden'
  },
  {
    id: 'about-y2k',
    name: 'Y2K Timeline',
    description: 'Discovered the Y2K timeline secret',
    location: 'About page',
    found: false,
    hint: 'The cassette tape holds memories...',
    category: 'interactive'
  },
  {
    id: 'about-secret',
    name: 'Secret Clicker',
    description: 'Found the hidden word secret',
    location: 'About page',
    found: false,
    hint: 'Click the same word multiple times...',
    category: 'sequence'
  },
  {
    id: 'training-click',
    name: 'Secret Training',
    description: 'Found the secret training button',
    location: 'Training page',
    found: false,
    hint: 'Not all training is visible...',
    category: 'easter-egg'
  },
  {
    id: 'double-click-logo',
    name: 'Logo Secret',
    description: 'Double-clicked the vobvorot logo',
    location: 'Multiple pages',
    found: false,
    hint: 'Sometimes clicking once is not enough...',
    category: 'interactive'
  },
  {
    id: 'konami-code',
    name: 'The Classic',
    description: 'Entered the legendary Konami Code',
    location: 'Any page',
    found: false,
    hint: '↑↑↓↓←→←→BA',
    category: 'easter-egg'
  },
  {
    id: 'music-lover',
    name: 'Music Enthusiast',
    description: 'Started playing YE VOBVOROT tracks',
    location: 'Music Player',
    found: false,
    hint: 'Turn up the volume and feel the Y2K vibes...',
    category: 'interactive'
  }
]

const initialAchievements: Achievement[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Found your first puzzle piece',
    icon: '🔍',
    unlocked: false,
    requirement: 'Find 1 puzzle piece',
    color: 'var(--cyan-accent)'
  },
  {
    id: 'detective',
    name: 'Detective',
    description: 'Found 3 puzzle pieces',
    icon: '🕵️',
    unlocked: false,
    requirement: 'Find 3 puzzle pieces',
    color: 'var(--purple-accent)'
  },
  {
    id: 'puzzle-master',
    name: 'Puzzle Master',
    description: 'Found all puzzle pieces',
    icon: '🧩',
    unlocked: false,
    requirement: 'Find all 12 puzzle pieces',
    color: 'var(--pink-main)'
  },
  {
    id: 'secret-keeper',
    name: 'Secret Keeper',
    description: 'Unlocked special modes',
    icon: '🌈',
    unlocked: false,
    requirement: 'Activate rainbow or matrix mode',
    color: 'var(--yellow-neon)'
  },
  {
    id: 'time-traveler',
    name: 'Time Traveler',
    description: 'Wrote a letter to the future',
    icon: '⏰',
    unlocked: false,
    requirement: 'Send a letter to future',
    color: 'var(--green-neon)'
  },
  {
    id: 'code-breaker',
    name: 'Code Breaker',
    description: 'Unlocked the legendary Konami code',
    icon: '🎮',
    unlocked: false,
    requirement: 'Enter the famous ↑↑↓↓←→←→BA sequence',
    color: '#00FF41'
  }
]

const PuzzleContext = createContext<{
  state: PuzzleState
  dispatch: React.Dispatch<PuzzleAction>
  findPiece: (pieceId: string) => void
  showNotification: (message: string, type?: 'success' | 'achievement') => void
} | null>(null)

function puzzleReducer(state: PuzzleState, action: PuzzleAction): PuzzleState {
  switch (action.type) {
    case 'FIND_PIECE': {
      const pieceIndex = state.pieces.findIndex(p => p.id === action.payload)
      if (pieceIndex === -1 || state.pieces[pieceIndex].found) return state

      const newPieces = [...state.pieces]
      newPieces[pieceIndex] = {
        ...newPieces[pieceIndex],
        found: true,
        foundAt: new Date()
      }

      const newSecretsFound = state.secretsFound + 1
      const newScore = state.totalScore + 100

      // Check for achievements
      const newAchievements = [...state.achievements]
      
      if (newSecretsFound === 1 && !state.achievements.find(a => a.id === 'first-steps')?.unlocked) {
        const achievementIndex = newAchievements.findIndex(a => a.id === 'first-steps')
        newAchievements[achievementIndex] = { ...newAchievements[achievementIndex], unlocked: true, unlockedAt: new Date() }
      }
      
      if (newSecretsFound === 3 && !state.achievements.find(a => a.id === 'detective')?.unlocked) {
        const achievementIndex = newAchievements.findIndex(a => a.id === 'detective')
        newAchievements[achievementIndex] = { ...newAchievements[achievementIndex], unlocked: true, unlockedAt: new Date() }
      }
      
      if (newSecretsFound === 12 && !state.achievements.find(a => a.id === 'puzzle-master')?.unlocked) {
        const achievementIndex = newAchievements.findIndex(a => a.id === 'puzzle-master')
        newAchievements[achievementIndex] = { ...newAchievements[achievementIndex], unlocked: true, unlockedAt: new Date() }
      }

      return {
        ...state,
        pieces: newPieces,
        achievements: newAchievements,
        secretsFound: newSecretsFound,
        totalScore: newScore
      }
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const achievementIndex = state.achievements.findIndex(a => a.id === action.payload)
      if (achievementIndex === -1 || state.achievements[achievementIndex].unlocked) return state

      const newAchievements = [...state.achievements]
      newAchievements[achievementIndex] = {
        ...newAchievements[achievementIndex],
        unlocked: true,
        unlockedAt: new Date()
      }

      return {
        ...state,
        achievements: newAchievements,
        totalScore: state.totalScore + 50
      }
    }

    case 'TOGGLE_KONAMI':
      return { ...state, konami: !state.konami }

    case 'TOGGLE_RAINBOW':
      return { ...state, rainbowMode: !state.rainbowMode }

    case 'TOGGLE_MATRIX':
      return { ...state, matrixMode: !state.matrixMode }


    case 'LOAD_STATE':
      return action.payload

    case 'RESET_PROGRESS':
      return {
        pieces: initialPieces,
        achievements: initialAchievements,
        totalScore: 0,
        secretsFound: 0,
        konami: false,
        rainbowMode: false,
        matrixMode: false,
        isLoading: false
      }

    default:
      return state
  }
}

export function PuzzleProvider({ children }: { children: React.ReactNode }) {
  const isClient = useClientOnly()
  const [state, dispatch] = useReducer(puzzleReducer, {
    pieces: initialPieces,
    achievements: initialAchievements,
    totalScore: 0,
    secretsFound: 0,
    konami: false,
    rainbowMode: false,
    matrixMode: false,
    isLoading: false
  })

  useEffect(() => {
    if (!isClient) return
    
    const savedState = localStorage.getItem('vobvorot-puzzle-progress')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        dispatch({ type: 'LOAD_STATE', payload: parsedState })
      } catch (error) {
        console.error('Failed to load puzzle progress:', error)
      }
    }
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    localStorage.setItem('vobvorot-puzzle-progress', JSON.stringify(state))
  }, [state, isClient])

  const findPiece = (pieceId: string) => {
    dispatch({ type: 'FIND_PIECE', payload: pieceId })
    showNotification(`🧩 Found: ${state.pieces.find(p => p.id === pieceId)?.name}!`, 'success')
  }

  const showNotification = (message: string, type: 'success' | 'achievement' = 'success') => {
    if (!isClient) return
    
    // Create notification element
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'achievement' ? 'linear-gradient(45deg, var(--yellow-neon), var(--pink-main))' : 'linear-gradient(45deg, var(--green-neon), var(--cyan-accent))'};
      color: var(--black);
      padding: 1rem 1.5rem;
      border-radius: 10px;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 0 20px rgba(255,255,255,0.3);
    `
    notification.textContent = message

    // Add animation styles
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(notification)

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }, 3000)
  }

  return (
    <PuzzleContext.Provider value={{ state, dispatch, findPiece, showNotification }}>
      {children}
    </PuzzleContext.Provider>
  )
}

export function usePuzzle() {
  const context = useContext(PuzzleContext)
  if (!context) {
    throw new Error('usePuzzle must be used within a PuzzleProvider')
  }
  return context
}