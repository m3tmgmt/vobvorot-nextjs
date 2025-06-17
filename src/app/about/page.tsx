'use client'

import { useState, useEffect } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { useClientOnly } from '@/hooks/useClientOnly'

export default function AboutPage() {
  const [matrixText, setMatrixText] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const { findPiece } = usePuzzle()
  const isClient = useClientOnly()

  useEffect(() => {
    if (!isClient) return
    
    // Generate matrix-like text effect
    const chars = '0123456789ABCDEF♦♠♣♥'
    const generateMatrix = () => {
      return Array.from({length: 100}, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join(' ')
    }
    
    const interval = setInterval(() => {
      setMatrixText(generateMatrix())
    }, 150)
    
    return () => clearInterval(interval)
  }, [isClient])

  const handleY2KClick = () => {
    setShowSecret(true)
    findPiece('about-y2k')
    setTimeout(() => setShowSecret(false), 3000)
  }

  const handleSecretClick = () => {
    setClickCount(prev => prev + 1)
    if (clickCount === 4) {
      findPiece('about-secret')
      setClickCount(0)
    }
  }

  return (
    <div className="about-section">
      <div className="hero-section hero-small">
        <div className="hero-overlay"></div>
        
        {/* Matrix Rain Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          opacity: 0.1,
          fontSize: '12px',
          color: 'var(--green-neon)',
          fontFamily: 'monospace',
          lineHeight: '14px',
          wordSpacing: '5px',
          pointerEvents: 'none'
        }}>
          {matrixText}
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title glitch">Inside</h1>
          <p className="hero-subtitle">
            Personal brand energy.
            Customs, vintage, and exclusives by ☆ vobvorot ☆
          </p>
          
          <div className="section-intro-card">
            <p className="section-intro-text">
              We're all about style, sincerity, and real feelings — living in the now, being present, and showing up fully. We want you to feel that with us, no filters.
              <br />
              And the pieces you find here?
              <br />
              They're meant to be something truly special — just like you.
            </p>
          </div>
        </div>
      </div>

      <section className="products-section section-spacing-medium">
        <div className="container">
          <h2 className="section-title">Our Digital DNA</h2>
          
          <div className="cards-grid">
            <div className="product-card content-card">
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
                🌍 Glamour with a Pulse
              </h3>
              <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                We're into slow glam and meaningful things. The kind of style that says something — and keeps saying it for years.
                <br />We share the mindset, the mood, the magic.
                <br />Your style, your finds, your impact — all of it matters.
                <br />Stay rare, love the planet.
                <br /><br />Around 92 million tons of clothing end up in landfills and the environment every year.
              </p>
            </div>

            <div className="product-card content-card">
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                🕊️ Every piece comes with a story.
              </h3>
              <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                You might find a one-of-a-kind handmade design from my brand, a vintage gem with a past, a custom dream, or something totally unexpected.
                <br />What you choose — that's your story now.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-grid" style={{ margin: '4rem 0' }}>
            <div className="product-card stats-card">
              <h3 className="stats-number calligraphy-font">24/7</h3>
              <p style={{ color: 'var(--cyan-accent)' }}>God Blessed</p>
            </div>
            <div className="product-card stats-card purple">
              <h3 className="stats-number purple calligraphy-font">made with love</h3>
              <p style={{ color: 'var(--yellow-neon)' }}></p>
            </div>
            <div className="product-card stats-card green">
              <h3 className="stats-number green">24/7</h3>
              <p style={{ color: 'var(--pink-main)' }} className="calligraphy-font">Digital Experience</p>
            </div>
          </div>

          {/* Interactive Timeline */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '20px',
            padding: '3rem',
            border: '2px solid var(--purple-accent)',
            marginBottom: '4rem'
          }}>
            <h3 style={{ 
              color: 'var(--purple-accent)', 
              textAlign: 'center',
              marginBottom: '2rem',
              fontSize: '1.5rem'
            }}>
              vobvorot'core
            </h3>
            
            <div className="timeline-grid" style={{ gap: '4rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease'
                }}
                onClick={handleY2KClick}
                onMouseEnter={(e) => (e.target as HTMLElement).style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.transform = 'scale(1)'}
                >
                  🦢
                </div>
                <h4 style={{ color: 'var(--yellow-neon)', marginBottom: '0.5rem' }}>
                  Aesthetic Of Weird
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  Where beauty glitches, seams speak, and nothing's ever accidental
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🐚</div>
                <h4 style={{ color: 'var(--green-neon)', marginBottom: '0.5rem' }}>
                  Purity Of Intent
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  — unseen but felt.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤍</div>
                <h4 style={{ color: 'var(--pink-main)', marginBottom: '0.5rem' }}>
                  Now
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  Not yesterday, not tomorrow
                </p>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="mission-section">
            <h3 className="mission-title">
              our mission
            </h3>
            <p className="mission-text">
              to be present in this world — to do what we can, to grow where we're called, to help where we're needed, and to become better, every step of the way.
            </p>
          </div>

          {/* Team Section */}
          <h2 className="section-title" style={{ marginTop: '6rem' }}>The Collective</h2>
          <div className="team-grid">
            <div className="product-card" style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '1rem',
                background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🫀
              </div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
                The Team
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                sensitive souls, synced in vision. We create, evolve, and stay open — always searching for new ways to grow, express, and make goodness real.
              </p>
            </div>

            <div className="product-card" style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '1rem',
                background: 'linear-gradient(45deg, var(--yellow-neon), var(--purple-accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🐇
              </div>
              <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>
                Uncommon Vision
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                We stay open. we see from every angle. What matters most: freedom, always – for people, for animals, for every living thing. We don't glamorize harm. no fur, no leather. We don't wear lives to feel alive.
                <br />No beauty without respect.
              </p>
            </div>
          </div>

          {/* Connect Section */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '20px',
            padding: '3rem',
            border: '2px solid var(--cyan-accent)',
            textAlign: 'center',
            marginTop: '6rem'
          }}>
            <h2 className="section-title" style={{ marginBottom: '2rem' }}>Connect With Us</h2>
            <div className="flex-center-wrap gap-4">
              <a href="https://instagram.com/vobvorot" target="_blank" rel="noopener noreferrer" 
                className="hero-button" style={{ textDecoration: 'none' }}>
                📷 Instagram
              </a>
              <a href="mailto:hello@vobvorot.com" 
                className="hero-button" style={{ textDecoration: 'none' }}>
                💌 Email Us
              </a>
              <button 
                className="hero-button"
                onClick={() => window.location.href = '/community'}
              >
                🌐 Join Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Secret Reveal */}
      {showSecret && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.9)',
          border: '3px solid var(--yellow-neon)',
          borderRadius: '20px',
          padding: '2rem',
          zIndex: 1000,
          textAlign: 'center',
          animation: 'glow 0.5s ease-in-out infinite alternate'
        }}>
          <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>
            🎉 Y2K Secret Unlocked!
          </h3>
          <p style={{ color: 'var(--white)' }}>
            You found the hidden Y2K timeline easter egg! 
          </p>
        </div>
      )}
    </div>
  )
}