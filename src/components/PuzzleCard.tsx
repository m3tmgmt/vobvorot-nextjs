'use client'

import { useState } from 'react'
import { useInView } from '@/hooks/useInView'

interface PuzzlePiece {
  id: string
  name: string
  description: string
  hint: string
  location: string
  category: string
  found: boolean
  foundAt?: Date
}

interface PuzzleCardProps {
  piece: PuzzlePiece
  onHintToggle?: (pieceId: string) => void
  showHint?: boolean
}

export function PuzzleCard({ piece, onHintToggle, showHint = false }: PuzzleCardProps) {
  const { ref, isInView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true
  })

  // Скелетон для карточки
  if (!isInView) {
    return (
      <div 
        ref={ref}
        className="product-card content-card"
        style={{
          borderColor: 'rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)',
          minHeight: '200px',
          animation: 'pulse 1.5s ease-in-out infinite alternate'
        }}
      >
        <div style={{ 
          width: '70%', 
          height: '20px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }} />
        <div style={{ 
          width: '100%', 
          height: '60px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }} />
        <div style={{ 
          width: '50%', 
          height: '16px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '4px'
        }} />
      </div>
    )
  }

  const borderColor = piece.category === 'easter-egg' ? 'var(--yellow-neon)' : 
                     piece.category === 'sequence' ? 'var(--purple-accent)' :
                     piece.category === 'interactive' ? 'var(--cyan-accent)' : 'var(--pink-main)'

  return (
    <div 
      ref={ref}
      className="product-card content-card"
      style={{
        borderColor,
        opacity: 0,
        animation: 'fadeIn 0.5s ease-out forwards',
        animationDelay: '0.1s'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ color: 'var(--white)' }}>{piece.name}</h3>
        <span style={{
          background: borderColor,
          color: 'var(--black)',
          padding: '0.25rem 0.5rem',
          borderRadius: '5px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          {piece.category}
        </span>
      </div>
      
      <p style={{ 
        color: 'rgba(255,255,255,0.8)', 
        marginBottom: '1rem',
        fontSize: '0.9rem'
      }}>
        {piece.description}
      </p>
      
      <p style={{ 
        color: 'var(--cyan-accent)', 
        marginBottom: '1rem',
        fontSize: '0.8rem'
      }}>
        📍 Location: {piece.location}
      </p>
      
      <button
        onClick={() => onHintToggle?.(piece.id)}
        className="filter-btn"
        style={{ 
          width: '100%',
          background: showHint ? 'var(--yellow-neon)' : 'transparent',
          color: showHint ? 'var(--black)' : 'var(--yellow-neon)'
        }}
      >
        {showHint ? 'Hide Hint' : 'Show Hint'} 💡
      </button>
      
      {showHint && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(255, 255, 0, 0.1)',
          borderRadius: '10px',
          border: '1px solid var(--yellow-neon)',
          opacity: 0,
          animation: 'fadeIn 0.3s ease-out forwards'
        }}>
          <p style={{ 
            color: 'var(--yellow-neon)', 
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}>
            💡 {piece.hint}
          </p>
        </div>
      )}
    </div>
  )
}