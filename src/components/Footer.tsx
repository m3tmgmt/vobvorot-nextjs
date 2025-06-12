'use client'

import { memo } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { useMatrix } from '@/contexts/MatrixContext'
import { useClientOnly } from '@/hooks/useClientOnly'

function FooterComponent() {
  const isClient = useClientOnly()
  const { findPiece } = usePuzzle()
  const { activateMatrix } = useMatrix()

  const handleNumberClick = () => {
    if (isClient) {
      findPiece('footer-mystery')
    }
  }

  if (!isClient) return null

  return (
    <footer style={{
      background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(255,107,157,0.1) 50%, rgba(0,0,0,0.95) 100%)',
      borderTop: '2px solid var(--pink-main)',
      padding: '2rem 1rem',
      marginTop: '4rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glitch overlay */}
      {/* Animated scan lines */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,107,157,0.03) 2px, rgba(255,107,157,0.03) 4px)',
        pointerEvents: 'none'
      }} />
      
      {/* Moving gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.1), transparent)',
        animation: 'slideRight 8s infinite linear',
        pointerEvents: 'none'
      }} />

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Brand Section */}
          <div>
            <h3 style={{
              color: 'var(--pink-main)',
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              textShadow: '0 0 10px var(--pink-main)'
            }}>
              vobvorot
            </h3>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.6',
              fontSize: '0.9rem'
            }}>
              All rights reserved to the fantasy
            </p>
          </div>

          {/* Links Section */}
          <div>
            <h4 style={{
              color: 'var(--cyan-accent)',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Explore
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {[
                { name: 'Products', href: '/products' },
                { name: 'EXVICPMOUR', href: '/exvicpmour' },
                { name: 'Training', href: '/training' },
                { name: 'Community', href: '/community' },
                { name: 'About', href: '/about' }
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--pink-main)'
                    e.currentTarget.style.textShadow = '0 0 5px var(--pink-main)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                    e.currentTarget.style.textShadow = 'none'
                  }}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Mystery Numbers Section */}
          <div>
            <h4 style={{
              color: 'var(--yellow-neon)',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              System Status
            </h4>
            <div style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.8rem',
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: '1.4'
            }}>
              <div>Connection: SECURE</div>
              <div>Status: ONLINE</div>
              <div>Protocol: Y2K.v3</div>
              <div style={{ marginTop: '0.5rem' }}>
                System Code: 
                <span 
                  onClick={handleNumberClick}
                  style={{
                    color: 'var(--green-neon)',
                    cursor: 'pointer',
                    marginLeft: '0.5rem',
                    padding: '2px 4px',
                    background: 'rgba(57,255,20,0.1)',
                    borderRadius: '3px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(57,255,20,0.2)'
                    e.currentTarget.style.textShadow = '0 0 8px var(--green-neon)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(57,255,20,0.1)'
                    e.currentTarget.style.textShadow = 'none'
                  }}
                >
                  7355608
                </span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={() => activateMatrix(10000)}
                  className="matrix-mode-btn"
                  style={{
                    background: 'rgba(57,255,20,0.1)',
                    border: '1px solid var(--green-neon)',
                    color: 'var(--green-neon)',
                    padding: '6px 12px',
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.3s ease',
                    minHeight: '32px',
                    touchAction: 'manipulation'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(57,255,20,0.2)'
                    e.currentTarget.style.textShadow = '0 0 8px var(--green-neon)'
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(57,255,20,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(57,255,20,0.1)'
                    e.currentTarget.style.textShadow = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.background = 'rgba(57,255,20,0.2)'
                    e.currentTarget.style.textShadow = '0 0 8px var(--green-neon)'
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(57,255,20,0.3)'
                  }}
                  onTouchEnd={(e) => {
                    setTimeout(() => {
                      e.currentTarget.style.background = 'rgba(57,255,20,0.1)'
                      e.currentTarget.style.textShadow = 'none'
                      e.currentTarget.style.boxShadow = 'none'
                    }, 150)
                  }}
                >
                  Matrix Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,107,157,0.3)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem'
          }}>
            © 2024 vobvorot • Made with ✨ for puzzle hunters
          </div>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <a 
                href="/legal/privacy"
                style={{ 
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                Privacy
              </a>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <a 
                href="/legal/terms"
                style={{ 
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                Terms
              </a>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <a 
                href="/legal/shipping"
                style={{ 
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                Shipping
              </a>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <a 
                href="/legal/returns"
                style={{ 
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                Returns
              </a>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <span style={{ 
                color: 'var(--cyan-accent)'
              }}>
                Find all 11 pieces
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export const Footer = memo(FooterComponent)