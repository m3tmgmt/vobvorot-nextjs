'use client'

import { useState, useEffect } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { useClientOnly } from '@/hooks/useClientOnly'

export default function AboutPage() {
  const [matrixText, setMatrixText] = useState('')
  const [showSecret, setShowSecret] = useState(false)
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
          <h1 className="hero-title glitch">About vobvorot</h1>
          <p className="hero-subtitle">
            digital revolution from Ukraine 🇺🇦 • Y2K aesthetic • future nostalgia
          </p>
          
          <div className="section-intro-card">
            <p className="section-intro-text">
              Born from Ukraine's creative spirit, we curate extraordinary vintage and custom pieces that tell stories. From rare cameras to handcrafted accessories, each item embodies authentic artistry and timeless style.
              <br />
              Every piece in our collection?
              <br />
              It's chosen to make you feel extraordinary — because you are.
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
                🌐 Digital Playground
              </h3>
              <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                VobVorot is a digital marketplace celebrating Ukrainian creativity and global vintage culture. We connect authentic artisans with collectors worldwide, bringing you unique pieces that blend heritage craftsmanship with contemporary style.
              </p>
            </div>

            <div className="product-card content-card">
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                ✨ Curated Experience
              </h3>
              <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                From vintage cameras with decades of history to custom Adidas sneakers crafted with love, we source items that capture authentic moments and emotions. Our collection spans handmade accessories, exclusive fashion, and collectible treasures from Ukraine and beyond.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-grid" style={{ margin: '4rem 0' }}>
            <div className="product-card stats-card">
              <h3 className="stats-number">500+</h3>
              <p style={{ color: 'var(--cyan-accent)' }}>Unique Items Curated</p>
            </div>
            <div className="product-card stats-card purple">
              <h3 className="stats-number purple">2020</h3>
              <p style={{ color: 'var(--yellow-neon)' }}>Founded in Kyiv</p>
            </div>
            <div className="product-card stats-card green">
              <h3 className="stats-number green">24/7</h3>
              <p style={{ color: 'var(--pink-main)' }}>Digital Experience</p>
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
              Timeline of Digital Culture
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
                  📼
                </div>
                <h4 style={{ color: 'var(--yellow-neon)', marginBottom: '0.5rem' }}>
                  Y2K Era
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  When the future was chrome and dreams were digital
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎮</div>
                <h4 style={{ color: 'var(--green-neon)', marginBottom: '0.5rem' }}>
                  Gaming Culture
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  Pixel art meets high fashion
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌈</div>
                <h4 style={{ color: 'var(--pink-main)', marginBottom: '0.5rem' }}>
                  Now & Future
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  Blending nostalgia with innovation
                </p>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="mission-section">
            <h3 className="mission-title">
              Our Mission
            </h3>
            <p className="mission-text">
              To showcase the finest Ukrainian artistry and global vintage culture through our digital platform. We champion authentic creators, sustainable fashion, and meaningful connections between collectors and the extraordinary pieces that define their personal style.
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
                👾
              </div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
                Digital Curators
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                Based in Ukraine with a global perspective, our curatorial team discovers extraordinary vintage pieces and supports emerging artisans. We're passionate about authentic craftsmanship and the stories behind every item.
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
                🎨
              </div>
              <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>
                Creative Minds
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                Our network of Ukrainian artists and international creators brings you custom designs, restored vintage treasures, and limited-edition pieces. Each item reflects hours of skilled work and creative vision.
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