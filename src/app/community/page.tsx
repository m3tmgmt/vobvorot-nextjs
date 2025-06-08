'use client'

import { useState, useEffect } from 'react'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { useClientOnly } from '@/hooks/useClientOnly'

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('events')
  const [ghostMode, setGhostMode] = useState(false)
  const [memberCount, setMemberCount] = useState(1337)
  const { findPiece, showNotification } = usePuzzle()
  const isClient = useClientOnly()

  useEffect(() => {
    if (!isClient) return
    
    // Simulate member count changes
    const interval = setInterval(() => {
      setMemberCount(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isClient])

  const handleGhostClick = () => {
    setGhostMode(true)
    findPiece('community-member')
    showNotification('👻 You became a ghost member!', 'success')
    setTimeout(() => setGhostMode(false), 5000)
  }

  const events = [
    {
      title: 'Y2K Design Contest',
      date: '2024-01-15',
      time: '19:00 UTC',
      type: 'Contest',
      description: 'Show off your best Y2K-inspired designs for a chance to win exclusive vobvorot merch',
      participants: 234
    },
    {
      title: 'Vintage Camera Meetup',
      date: '2024-01-20',
      time: '15:00 UTC',
      type: 'Meetup',
      description: 'Virtual meetup for vintage camera enthusiasts. Share your latest finds!',
      participants: 89
    },
    {
      title: 'Matrix Coding Workshop',
      date: '2024-01-25',
      time: '18:00 UTC',
      type: 'Workshop',
      description: 'Learn to create the iconic Matrix rain effect using p5.js',
      participants: 156
    }
  ]

  const members = [
    { name: 'PixelArtist2000', level: 'Legend', badges: ['🎨', '👑', '⚡'], online: true },
    { name: 'VintageHunter', level: 'Expert', badges: ['📷', '🔍', '💎'], online: true },
    { name: 'CodeWizard', level: 'Master', badges: ['💻', '🧙‍♂️', '🌟'], online: false },
    { name: 'Y2KQueen', level: 'Pro', badges: ['👑', '✨', '🎵'], online: true },
    { name: 'GlitchGod', level: 'Elite', badges: ['⚡', '🔥', '👾'], online: true }
  ]

  const projects = [
    {
      title: 'Holographic Business Cards',
      creator: 'PixelArtist2000',
      likes: 142,
      category: 'Design',
      image: '🌈'
    },
    {
      title: 'Custom Adidas Y2K Edition',
      creator: 'VintageHunter',
      likes: 89,
      category: 'Fashion',
      image: '👟'
    },
    {
      title: 'Interactive Matrix Background',
      creator: 'CodeWizard',
      likes: 203,
      category: 'Code',
      image: '💻'
    }
  ]

  return (
    <div className="community-section">
      {/* Hero Section */}
      <div className="hero-section" style={{ minHeight: '60vh', position: 'relative' }}>
        <div className="hero-overlay"></div>
        
        {/* Animated Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: ghostMode 
            ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'
            : 'linear-gradient(45deg, rgba(255,0,150,0.1), rgba(0,255,255,0.1))',
          animation: ghostMode ? 'pulse 2s ease-in-out infinite' : 'none'
        }} />
        
        <div className="hero-content">
          <h1 className="hero-title glitch">vobvorot Community</h1>
          <p className="hero-subtitle">
            connect • create • collaborate • digital culture collective
          </p>
          
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            border: '2px solid var(--cyan-accent)',
            maxWidth: '600px',
            margin: '2rem auto 0'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '2rem', color: 'var(--pink-main)', fontWeight: 'bold' }}>
                  {memberCount.toLocaleString()}
                </div>
                <div style={{ color: 'var(--cyan-accent)', fontSize: '0.9rem' }}>Members</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', color: 'var(--yellow-neon)', fontWeight: 'bold' }}>
                  24/7
                </div>
                <div style={{ color: 'var(--purple-accent)', fontSize: '0.9rem' }}>Online</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', color: 'var(--green-neon)', fontWeight: 'bold' }}>
                  Global
                </div>
                <div style={{ color: 'var(--pink-main)', fontSize: '0.9rem' }}>Network</div>
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button className="hero-button">
              💬 Join Discord
            </button>
            <button 
              className="hero-button"
              onClick={handleGhostClick}
              style={{ 
                background: ghostMode ? 'rgba(255,255,255,0.2)' : undefined,
                transform: ghostMode ? 'scale(1.1)' : undefined
              }}
            >
              👻 Become Ghost Member
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <section className="products-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '3rem',
            flexWrap: 'wrap'
          }}>
            <button
              className={`filter-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              🎉 Events
            </button>
            <button
              className={`filter-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              👥 Members
            </button>
            <button
              className={`filter-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              🎨 Projects
            </button>
            <button
              className={`filter-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 Live Chat
            </button>
          </div>

          {/* Events Tab */}
          {activeTab === 'events' && (
            <>
              <h2 className="section-title">Upcoming Events</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem'
              }}>
                {events.map((event, index) => (
                  <div key={index} className="product-card">
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>
                        {event.title}
                      </h3>
                      <span style={{
                        background: event.type === 'Contest' ? 'var(--yellow-neon)' :
                                  event.type === 'Workshop' ? 'var(--purple-accent)' : 'var(--pink-main)',
                        color: 'var(--black)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '5px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {event.type}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                      <p style={{ color: 'var(--pink-main)', marginBottom: '0.25rem' }}>
                        📅 {new Date(event.date).toLocaleDateString()}
                      </p>
                      <p style={{ color: 'var(--purple-accent)' }}>
                        ⏰ {event.time}
                      </p>
                    </div>
                    
                    <p style={{
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '1.5rem',
                      lineHeight: '1.5'
                    }}>
                      {event.description}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        color: 'var(--green-neon)', 
                        fontSize: '0.9rem' 
                      }}>
                        👥 {event.participants} participants
                      </span>
                      <button className="add-to-cart-btn">
                        Join Event
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <>
              <h2 className="section-title">Community Members</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem'
              }}>
                {members.map((member, index) => (
                  <div key={index} className="product-card">
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{ color: 'var(--cyan-accent)' }}>
                        {member.name}
                      </h3>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: member.online ? 'var(--green-neon)' : 'rgba(255,255,255,0.3)',
                        animation: member.online ? 'pulse 2s infinite' : 'none'
                      }} />
                    </div>
                    
                    <div style={{
                      background: `linear-gradient(45deg, ${
                        member.level === 'Legend' ? 'var(--yellow-neon)' :
                        member.level === 'Expert' ? 'var(--purple-accent)' :
                        member.level === 'Master' ? 'var(--cyan-accent)' :
                        member.level === 'Elite' ? 'var(--pink-main)' : 'var(--green-neon)'
                      }20, rgba(255,255,255,0.05))`,
                      border: `1px solid ${
                        member.level === 'Legend' ? 'var(--yellow-neon)' :
                        member.level === 'Expert' ? 'var(--purple-accent)' :
                        member.level === 'Master' ? 'var(--cyan-accent)' :
                        member.level === 'Elite' ? 'var(--pink-main)' : 'var(--green-neon)'
                      }`,
                      borderRadius: '10px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          color: member.level === 'Legend' ? 'var(--yellow-neon)' :
                                member.level === 'Expert' ? 'var(--purple-accent)' :
                                member.level === 'Master' ? 'var(--cyan-accent)' :
                                member.level === 'Elite' ? 'var(--pink-main)' : 'var(--green-neon)',
                          fontWeight: 'bold'
                        }}>
                          {member.level}
                        </span>
                        <div style={{ fontSize: '1.2rem' }}>
                          {member.badges.join(' ')}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="filter-btn" style={{ flex: 1 }}>
                        View Profile
                      </button>
                      <button className="hero-button" style={{ flex: 1 }}>
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <>
              <h2 className="section-title">Community Projects</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem'
              }}>
                {projects.map((project, index) => (
                  <div key={index} className="product-card">
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        fontSize: '3rem',
                        marginRight: '1rem',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {project.image}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>
                          {project.title}
                        </h3>
                        <p style={{ color: 'var(--purple-accent)', fontSize: '0.9rem' }}>
                          by {project.creator}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        background: 'var(--pink-main)',
                        color: 'var(--black)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '5px',
                        fontSize: '0.8rem'
                      }}>
                        {project.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--yellow-neon)' }}>❤️</span>
                        <span style={{ color: 'var(--white)' }}>{project.likes}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="filter-btn" style={{ flex: 1 }}>
                        View Project
                      </button>
                      <button className="add-to-cart-btn" style={{ flex: 1 }}>
                        ❤️ Like
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <>
              <h2 className="section-title">Live Community Chat</h2>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                border: '2px solid var(--cyan-accent)',
                padding: '2rem',
                marginBottom: '4rem'
              }}>
                <div style={{
                  height: '400px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  overflowY: 'auto',
                  fontFamily: 'monospace'
                }}>
                  <div style={{ color: 'var(--green-neon)', marginBottom: '0.5rem' }}>
                    [19:42] PixelArtist2000: just finished my Y2K poster design! 🎨
                  </div>
                  <div style={{ color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>
                    [19:43] VintageHunter: nice! can't wait to see it
                  </div>
                  <div style={{ color: 'var(--pink-main)', marginBottom: '0.5rem' }}>
                    [19:44] Y2KQueen: anyone going to the virtual meetup tomorrow?
                  </div>
                  <div style={{ color: 'var(--purple-accent)', marginBottom: '0.5rem' }}>
                    [19:45] CodeWizard: working on a new matrix effect in three.js 💻
                  </div>
                  <div style={{ color: 'var(--yellow-neon)', marginBottom: '0.5rem' }}>
                    [19:46] GlitchGod: anyone know where to find vintage polaroid cameras?
                  </div>
                  <div style={{ color: 'var(--green-neon)', marginBottom: '0.5rem' }}>
                    [19:47] PixelArtist2000: @GlitchGod check the marketplace section!
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '2px solid var(--cyan-accent)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      color: 'var(--white)',
                      fontSize: '1rem'
                    }}
                  />
                  <button className="add-to-cart-btn">
                    Send
                  </button>
                </div>
                
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem',
                  marginTop: '1rem',
                  textAlign: 'center'
                }}>
                  💡 Tip: Join our Discord server for real-time chat and community features!
                </p>
              </div>
            </>
          )}

          {/* Community Features */}
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
              Why Join Our Community?
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              marginTop: '2rem'
            }}>
              <div>
                <h4 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                  🎨 Share Your Art
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Showcase your creations and get feedback from fellow artists
                </p>
              </div>
              
              <div>
                <h4 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>
                  🤝 Collaborate
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Find collaborators for your next creative project
                </p>
              </div>
              
              <div>
                <h4 style={{ color: 'var(--purple-accent)', marginBottom: '1rem' }}>
                  📚 Learn Together
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Access exclusive tutorials and workshops
                </p>
              </div>
              
              <div>
                <h4 style={{ color: 'var(--green-neon)', marginBottom: '1rem' }}>
                  🏆 Competitions
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Participate in contests and win amazing prizes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}