import { Footer } from '@/components/Footer'

export default function CommunityPage() {
  return (
    <div className="community-section">
      <div className="hero-section hero-small">
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <h1 className="hero-title glitch">vobvorot Community</h1>
          <p className="hero-subtitle">
            Connect • Create • Collaborate ✨
          </p>
          
          <div style={{ 
            marginTop: '2rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '2rem',
            border: '2px solid var(--cyan-accent)',
            maxWidth: '600px',
            margin: '2rem auto 0'
          }}>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              Join our global community of digital artists, vintage collectors, and Y2K enthusiasts. 
              Share your creations and discover unique pieces from fellow creators.
            </p>
          </div>
        </div>
      </div>

      <section className="products-section section-spacing-medium">
        <div className="container">
          <h2 className="section-title">Community Features</h2>
          
          <div className="cards-grid">
            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌐</div>
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>Global Network</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Connect with creators from Ukraine and around the world
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>Creative Showcase</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Share your artwork, designs, and vintage finds with the community
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎪</div>
              <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>Events & Meetups</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Join virtual and IRL events celebrating Y2K culture and digital art
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,245,255,0.1)',
            borderRadius: '20px',
            padding: '3rem',
            border: '2px solid var(--cyan-accent)',
            textAlign: 'center',
            marginTop: '4rem'
          }}>
            <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              Join the Movement
            </h3>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'rgba(255,255,255,0.9)', 
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Be part of our growing community where Y2K nostalgia meets modern creativity. 
              Coming soon with exclusive member benefits and early access to drops.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="hero-button">Discord Server</button>
              <button className="hero-button">Instagram Community</button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}