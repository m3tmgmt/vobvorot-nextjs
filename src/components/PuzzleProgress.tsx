'use client'

import { useState } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'

export function PuzzleProgress() {
  const { state } = usePuzzle()
  const [isOpen, setIsOpen] = useState(false)

  const progressPercentage = (state.secretsFound / state.pieces.length) * 100

  return (
    <>
      {/* Floating Progress Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: `conic-gradient(var(--pink-main) ${progressPercentage}%, rgba(255,255,255,0.1) ${progressPercentage}%)`,
          border: '3px solid var(--pink-main)',
          color: 'var(--white)',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 20px rgba(255, 107, 157, 0.5)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 107, 157, 0.8)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.5)'
        }}
        title={`Puzzle Progress: ${state.secretsFound}/${state.pieces.length}`}
      >
        🧩
      </button>

      {/* Progress Modal */}
      {isOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.7)',
              zIndex: 1001,
              backdropFilter: 'blur(10px)'
            }}
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="puzzle-progress-modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              background: 'rgba(0, 0, 0, 0.95)',
              border: '2px solid var(--pink-main)',
              borderRadius: '20px',
              padding: '2rem',
              zIndex: 1002,
              overflow: 'auto',
              backdropFilter: 'blur(15px)',
              boxShadow: '0 0 30px rgba(255, 107, 157, 0.3)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--pink-main)', fontSize: '2rem', fontWeight: '700' }}>
                Puzzle Progress
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Score and Progress */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '1rem',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: 'var(--cyan-accent)' }}>Total Score</h3>
                <p style={{ fontSize: '2rem', color: 'var(--yellow-neon)', fontWeight: 'bold' }}>
                  {state.totalScore}
                </p>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '1rem',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: 'var(--purple-accent)' }}>Secrets Found</h3>
                <p style={{ fontSize: '2rem', color: 'var(--pink-main)', fontWeight: 'bold' }}>
                  {state.secretsFound}/{state.pieces.length}
                </p>
              </div>
            </div>

            {/* Puzzle Pieces */}
            <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>Puzzle Pieces</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {state.pieces.map((piece) => (
                <div 
                  key={piece.id}
                  style={{
                    background: piece.found 
                      ? 'linear-gradient(45deg, rgba(57, 255, 20, 0.1), rgba(0, 245, 255, 0.1))'
                      : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${piece.found ? 'var(--green-neon)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '10px',
                    padding: '1rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: piece.found ? 'var(--green-neon)' : 'var(--white)' }}>
                      {piece.name}
                    </h4>
                    <span style={{ fontSize: '1.5rem' }}>
                      {piece.found ? '✅' : '❓'}
                    </span>
                  </div>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>
                    {piece.description}
                  </p>
                  <p style={{ 
                    color: 'var(--cyan-accent)', 
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem'
                  }}>
                    📍 {piece.location}
                  </p>
                  {!piece.found && (
                    <p style={{ 
                      color: 'var(--yellow-neon)', 
                      fontSize: '0.8rem',
                      fontStyle: 'italic'
                    }}>
                      💡 {piece.hint}
                    </p>
                  )}
                  {piece.found && piece.foundAt && (
                    <p style={{ 
                      color: 'var(--purple-accent)', 
                      fontSize: '0.7rem'
                    }}>
                      Found: {piece.foundAt.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Achievements */}
            <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>Achievements</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {state.achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  style={{
                    background: achievement.unlocked 
                      ? `linear-gradient(45deg, ${achievement.color}20, ${achievement.color}10)`
                      : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${achievement.unlocked ? achievement.color : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '10px',
                    padding: '1rem',
                    textAlign: 'center',
                    opacity: achievement.unlocked ? 1 : 0.6
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {achievement.icon}
                  </div>
                  <h4 style={{ color: achievement.unlocked ? achievement.color : 'var(--white)', marginBottom: '0.5rem' }}>
                    {achievement.name}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {achievement.description}
                  </p>
                  <p style={{ color: 'var(--cyan-accent)', fontSize: '0.8rem' }}>
                    {achievement.requirement}
                  </p>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p style={{ 
                      color: 'var(--purple-accent)', 
                      fontSize: '0.7rem',
                      marginTop: '0.5rem'
                    }}>
                      Unlocked: {achievement.unlockedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}