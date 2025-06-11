'use client'

import { useState, useEffect } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { Footer } from '@/components/Footer'
import { PuzzleCard } from '@/components/PuzzleCard'
import { AchievementCard } from '@/components/AchievementCard'

export default function PuzzlePage() {
  const { state, findPiece, dispatch, showNotification } = usePuzzle()
  const [selectedHint, setSelectedHint] = useState<string | null>(null)
  const [secretCode, setSecretCode] = useState('')
  
  const secretCodes = {
    'Y2K': 'footer-code',
    'MATRIX': 'training-easter',
    'GHOST': 'community-member'
  }

  const handleSecretCode = () => {
    const pieceId = secretCodes[secretCode.toUpperCase() as keyof typeof secretCodes]
    if (pieceId) {
      findPiece(pieceId)
      setSecretCode('')
      showNotification(`🔓 Secret code "${secretCode}" accepted!`, 'success')
    } else {
      showNotification('❌ Invalid code', 'success')
    }
  }

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all puzzle progress?')) {
      dispatch({ type: 'RESET_PROGRESS' })
      showNotification('🔄 Progress reset!', 'success')
    }
  }

  const progressPercentage = (state.secretsFound / state.pieces.length) * 100
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length
  
  const handleHintToggle = (pieceId: string) => {
    setSelectedHint(selectedHint === pieceId ? null : pieceId)
  }

  return (
    <div className="puzzle-hub" style={{ willChange: 'auto', transform: 'translateZ(0)' }}>
      <div className="hero-section hero-compact" style={{ willChange: 'auto' }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title glitch">Puzzle Hub</h1>
          <p className="hero-subtitle">uncover the secrets of vobvorot 🔍</p>
          
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            justifyContent: 'center', 
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: 'var(--pink-main)', fontWeight: 'bold' }}>
                {state.secretsFound}/{state.pieces.length}
              </div>
              <div style={{ color: 'var(--cyan-accent)' }}>Secrets Found</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: 'var(--yellow-neon)', fontWeight: 'bold' }}>
                {state.totalScore}
              </div>
              <div style={{ color: 'var(--purple-accent)' }}>Total Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: 'var(--green-neon)', fontWeight: 'bold' }}>
                {unlockedAchievements}/{state.achievements.length}
              </div>
              <div style={{ color: 'var(--pink-main)' }}>Achievements</div>
            </div>
          </div>
        </div>
      </div>

      <section className="products-section section-spacing-medium">
        <div className="container">
          
          {/* Progress Overview */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '3rem',
            border: '2px solid var(--pink-main)'
          }}>
            <h2 className="section-title">Overall Progress</h2>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              height: '20px',
              marginBottom: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--pink-main), var(--cyan-accent))',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
              {progressPercentage.toFixed(1)}% Complete
            </p>
          </div>

          {/* Secret Code Input */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '3rem',
            border: '2px solid var(--cyan-accent)',
            maxWidth: '500px',
            margin: '0 auto 3rem'
          }}>
            <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem', textAlign: 'center' }}>
              Secret Code Entry
            </h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="Enter secret code..."
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '2px solid var(--cyan-accent)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  color: 'var(--white)',
                  fontSize: '1rem',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              />
              <button 
                onClick={handleSecretCode}
                className="add-to-cart-btn"
                style={{ width: 'auto' }}
              >
                Submit
              </button>
            </div>
          </div>

          {/* Active Puzzles */}
          <h2 className="section-title">Active Puzzles</h2>
          <div className="cards-grid" style={{ willChange: 'auto', transform: 'translateZ(0)' }}>
            {state.pieces.filter(piece => !piece.found).map((piece) => (
              <PuzzleCard 
                key={piece.id}
                piece={piece}
                onHintToggle={handleHintToggle}
                showHint={selectedHint === piece.id}
              />
            ))}
          </div>

          {/* Completed Puzzles */}
          {state.pieces.some(piece => piece.found) && (
            <>
              <h2 className="section-title">Completed Puzzles</h2>
              <div className="cards-grid">
                {state.pieces.filter(piece => piece.found).map((piece) => (
                  <div 
                    key={piece.id}
                    className="product-card content-card"
                    style={{
                      borderColor: 'var(--green-neon)',
                      background: 'linear-gradient(45deg, rgba(57, 255, 20, 0.1), rgba(0, 245, 255, 0.1))',
                      opacity: 0.8
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{ color: 'var(--green-neon)' }}>{piece.name}</h3>
                      <span style={{ fontSize: '1.5rem' }}>✅</span>
                    </div>
                    
                    <p style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      {piece.description}
                    </p>
                    
                    {piece.foundAt && (
                      <p style={{ 
                        color: 'var(--purple-accent)', 
                        fontSize: '0.7rem'
                      }}>
                        Completed: {piece.foundAt.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Achievements Display */}
          <h2 className="section-title" style={{ marginTop: 'var(--space-20)' }}>Achievements</h2>
          <div className="cards-grid">
            {state.achievements.map((achievement) => (
              <AchievementCard 
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="product-card" style={{
            marginTop: 'var(--space-20)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            border: '2px solid var(--purple-accent)',
            maxWidth: '600px',
            margin: 'var(--space-20) auto 0'
          }}>
            <h3 style={{ color: 'var(--purple-accent)', marginBottom: '1rem' }}>
              Puzzle Controls
            </h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={resetProgress}
                className="filter-btn"
                style={{ borderColor: 'var(--pink-main)', color: 'var(--pink-main)' }}
              >
                Reset Progress
              </button>
              <button 
                onClick={() => showNotification('💡 Tip: Try the Konami Code anywhere on the site!', 'success')}
                className="filter-btn"
                style={{ borderColor: 'var(--yellow-neon)', color: 'var(--yellow-neon)' }}
              >
                Get Tip
              </button>
            </div>
            
            <div style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.7)' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                🎯 Find hidden elements across the site to unlock puzzles
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                🔍 Look for glitchy text, clickable areas, and secret codes
              </p>
              <p>
                ⌨️ Try keyboard combinations and mouse interactions
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}