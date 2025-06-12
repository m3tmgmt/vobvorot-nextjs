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
              we're here for the ones who feel deeply, create wildly, and believe in more.
              souls with vision, hearts with roots.
              let's build, dream, and lift each other — together.
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
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>world's open</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                we collab from anywhere — no borders, just vision
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>share your art. join the vision.</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                show us what you do. be seen. be weird. be brilliant.
                let's grow, glow & build something rare — together
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
              <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>join the vision IRL & online</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                virtual hangs, collab trips, late-night planning — build, dream, create together
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
              Enter the era. Your era.
            </h3>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'rgba(255,255,255,0.9)', 
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              First to know, first to feel.
              Drops, updates, unreleased things.
              Be part of the creative core — rare minds only.
              A space where visionaries connect, collaborate, and make it iconic.
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