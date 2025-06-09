'use client'

import { useState, useEffect } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { useClientOnly } from '@/hooks/useClientOnly'

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState('courses')
  const [pixelArt, setPixelArt] = useState('')
  const [konamiProgress, setKonamiProgress] = useState(0)
  const { findPiece, showNotification } = usePuzzle()
  const isClient = useClientOnly()

  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

  useEffect(() => {
    if (!isClient) return
    
    // Generate ASCII pixel art
    const chars = '▓▒░ ██▌▐▀▄'
    const generatePixelArt = () => {
      return Array.from({length: 20}, () => 
        Array.from({length: 30}, () => 
          chars[Math.floor(Math.random() * chars.length)]
        ).join('')
      ).join('\n')
    }
    
    const interval = setInterval(() => {
      setPixelArt(generatePixelArt())
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isClient])

  useEffect(() => {
    let currentSequence: string[] = []
    
    const handleKeyPress = (e: KeyboardEvent) => {
      currentSequence.push(e.code)
      
      if (currentSequence.length > konamiSequence.length) {
        currentSequence = currentSequence.slice(-konamiSequence.length)
      }
      
      const matching = konamiSequence.slice(0, currentSequence.length)
      const isMatching = currentSequence.every((key, index) => key === matching[index])
      
      if (isMatching) {
        setKonamiProgress(currentSequence.length)
        
        if (currentSequence.length === konamiSequence.length) {
          findPiece('training-easter')
          setKonamiProgress(0)
          currentSequence = []
        }
      } else {
        setKonamiProgress(0)
        currentSequence = []
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [findPiece])

  const courses = [
    {
      id: 'digital-art',
      title: 'Digital Art & Y2K Aesthetics',
      level: 'Beginner',
      duration: '6 weeks',
      price: '$299',
      description: 'Master the art of Y2K digital design, from chrome effects to holographic textures',
      modules: ['Y2K Design Principles', 'Chrome & Metal Effects', 'Holographic Textures', 'Glitch Art Techniques'],
      color: 'var(--pink-main)'
    },
    {
      id: 'vintage-curation',
      title: 'Vintage Curation & Authentication',
      level: 'Intermediate',
      duration: '4 weeks',
      price: '$199',
      description: 'Learn to identify, authenticate, and curate vintage pieces like a pro',
      modules: ['Authentication Techniques', 'Market Research', 'Condition Assessment', 'Pricing Strategies'],
      color: 'var(--cyan-accent)'
    },
    {
      id: 'creative-coding',
      title: 'Creative Coding & Interactive Art',
      level: 'Advanced',
      duration: '8 weeks',
      price: '$399',
      description: 'Build interactive digital experiences using modern web technologies',
      modules: ['Web GL Basics', 'Particle Systems', 'Audio Visualization', 'AR/VR Integration'],
      color: 'var(--purple-accent)'
    },
    {
      id: 'photography',
      title: 'Vintage Photography & Film',
      level: 'Beginner',
      duration: '5 weeks',
      price: '$249',
      description: 'Master vintage cameras and film photography techniques',
      modules: ['Camera Mechanics', 'Film Types', 'Darkroom Techniques', 'Digital Restoration'],
      color: 'var(--yellow-neon)'
    }
  ]

  const workshops = [
    {
      title: 'Matrix Rain Effect Workshop',
      date: 'Every Saturday',
      type: 'Live Workshop',
      description: 'Learn to create the iconic falling code effect'
    },
    {
      title: 'Custom Sneaker Design',
      date: 'Monthly',
      type: 'Hands-on',
      description: 'Design and create your own custom Adidas'
    },
    {
      title: 'Glitch Art Masterclass',
      date: 'Bi-weekly',
      type: 'Online',
      description: 'Master the art of digital corruption'
    }
  ]

  const handleEasterEgg = () => {
    findPiece('training-click')
    showNotification('🎮 You found the training easter egg!', 'success')
  }

  return (
    <div className="training-section">
      {/* Hero Section */}
      <div className="hero-section" style={{ minHeight: '70vh', position: 'relative' }}>
        <div className="hero-overlay"></div>
        
        {/* ASCII Art Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          opacity: 0.1,
          fontSize: '8px',
          color: 'var(--green-neon)',
          fontFamily: 'monospace',
          lineHeight: '8px',
          whiteSpace: 'pre',
          pointerEvents: 'none'
        }}>
          {pixelArt}
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title glitch">vobvorot Academy</h1>
          <p className="hero-subtitle">
            level up your digital skills • Y2K aesthetics • creative coding • vintage mastery
          </p>
          
          {/* Konami Progress Indicator - Hidden to prevent accidental display */}
          {false && konamiProgress > 0 && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: 'rgba(0,255,0,0.2)',
              borderRadius: '10px',
              border: '2px solid var(--green-neon)'
            }}>
              <p style={{ color: 'var(--green-neon)', textAlign: 'center' }}>
                Code Progress: {konamiProgress}/{konamiSequence.length} ↑↑↓↓←→←→BA
              </p>
            </div>
          )}
          
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              className="hero-button"
              onClick={() => setActiveTab('courses')}
            >
              🎓 View Courses
            </button>
            <button 
              className="hero-button"
              onClick={() => setActiveTab('workshops')}
            >
              🛠️ Workshops
            </button>
            <button 
              className="hero-button"
              onClick={handleEasterEgg}
            >
              🎮 Secret Training
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <section className="products-section">
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '3rem',
            flexWrap: 'wrap'
          }}>
            <button
              className={`filter-btn ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              📚 Courses
            </button>
            <button
              className={`filter-btn ${activeTab === 'workshops' ? 'active' : ''}`}
              onClick={() => setActiveTab('workshops')}
            >
              🔧 Workshops
            </button>
            <button
              className={`filter-btn ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              👥 Community
            </button>
          </div>

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <>
              <h2 className="section-title">Digital Mastery Courses</h2>
              <div className="cards-grid">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className="product-card"
                    style={{
                      border: `2px solid ${course.color}`,
                      background: `linear-gradient(45deg, ${course.color}10, rgba(255,255,255,0.05))`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{ color: course.color, marginBottom: '0.5rem' }}>
                          {course.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--cyan-accent)' }}>{course.level}</span>
                          <span style={{ color: 'var(--purple-accent)' }}>{course.duration}</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--yellow-neon)'
                      }}>
                        {course.price}
                      </div>
                    </div>

                    <p style={{
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '1.5rem',
                      lineHeight: '1.5'
                    }}>
                      {course.description}
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ color: 'var(--pink-main)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Course Modules:
                      </h4>
                      <ul style={{ 
                        listStyle: 'none', 
                        padding: 0,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '0.5rem'
                      }}>
                        {course.modules.map((module, index) => (
                          <li key={index} style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.7)',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '5px'
                          }}>
                            {module}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="add-to-cart-btn" style={{ flex: 1 }}>
                        Enroll Now
                      </button>
                      <button className="filter-btn" style={{ flex: 1 }}>
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Workshops Tab */}
          {activeTab === 'workshops' && (
            <>
              <h2 className="section-title">Live Workshops & Events</h2>
              <div className="cards-grid">
                {workshops.map((workshop, index) => (
                  <div key={index} className="product-card">
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{ color: 'var(--cyan-accent)' }}>
                        {workshop.title}
                      </h3>
                      <span style={{
                        background: 'var(--purple-accent)',
                        color: 'var(--black)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '5px',
                        fontSize: '0.8rem'
                      }}>
                        {workshop.type}
                      </span>
                    </div>
                    
                    <p style={{
                      color: 'var(--yellow-neon)',
                      marginBottom: '1rem',
                      fontSize: '0.9rem'
                    }}>
                      📅 {workshop.date}
                    </p>
                    
                    <p style={{
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '1.5rem'
                    }}>
                      {workshop.description}
                    </p>
                    
                    <button className="hero-button" style={{ width: '100%' }}>
                      Join Workshop
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Community Tab */}
          {activeTab === 'community' && (
            <>
              <h2 className="section-title">Learning Community</h2>
              <div className="cards-grid">
                <div className="product-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
                  <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
                    Discord Server
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
                    Join our active community of digital artists, vintage collectors, and creative coders
                  </p>
                  <button className="add-to-cart-btn">Join Discord</button>
                </div>

                <div className="product-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
                  <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                    Student Gallery
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
                    Showcase your work and get feedback from fellow students and instructors
                  </p>
                  <button className="add-to-cart-btn">View Gallery</button>
                </div>

                <div className="product-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                  <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>
                    Challenges
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
                    Monthly design challenges with prizes and recognition
                  </p>
                  <button className="add-to-cart-btn">Enter Challenge</button>
                </div>
              </div>
            </>
          )}

          {/* Special Features */}
          <div style={{
            background: 'linear-gradient(45deg, rgba(255, 0, 150, 0.1), rgba(0, 255, 255, 0.1))',
            borderRadius: '20px',
            padding: '3rem',
            border: '2px solid var(--pink-main)',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              color: 'var(--pink-main)', 
              marginBottom: '2rem',
              fontSize: '1.8rem'
            }}>
              Why Choose vobvorot Academy?
            </h3>
            
            <div className="cards-grid" style={{ marginTop: '2rem' }}>
              <div>
                <h4 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                  🎯 Hands-on Learning
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Real projects, real results. No theory-only courses here.
                </p>
              </div>
              
              <div>
                <h4 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>
                  👨‍🏫 Expert Instructors
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Learn from industry professionals and successful creators.
                </p>
              </div>
              
              <div>
                <h4 style={{ color: 'var(--purple-accent)', marginBottom: '1rem' }}>
                  🌐 Global Community
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Connect with creatives from around the world.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}