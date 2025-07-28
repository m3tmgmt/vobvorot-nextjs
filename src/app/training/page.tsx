import { Footer } from '@/components/Footer'

export default function TrainingPage() {
  return (
    <div className="training-section">
      <div className="hero-section hero-medium">
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <h1 className="hero-title glitch">vobvorot Academy</h1>
          <p className="hero-subtitle">
            Training & food secrets? Stay tuned.<br />
            Coming soon — no gatekeeping, just glow ✨
          </p>
          
          <div style={{ 
            marginTop: '2rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '2rem',
            border: '2px solid var(--purple-accent)',
            maxWidth: '600px',
            margin: '2rem auto 0'
          }}>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              This body holds a soul that remembers Heaven.<br />
              Every step, every breath — a return to God.
            </p>
          </div>
        </div>
      </div>

      <section className="products-section section-spacing-medium">
        <div className="container">
          <h2 className="section-title">Glow loading…</h2>
          
          <div className="training-cards-grid">
            <div className="product-card feature-card">
              <div>
                <div className="feature-card-icon">🍽️</div>
                <h3 className="feature-card-title" style={{ color: 'var(--pink-main)' }}>
                  Food as Feeling
                </h3>
                <p className="feature-card-description">
                  Not just meals — whispers to your skin, messages to your mood. Secrets live in what you taste. What you feed yourself, you become — soft, glowing, rewired.
                </p>
              </div>
            </div>

            <div className="product-card feature-card">
              <div>
                <div className="feature-card-icon">🏋️</div>
                <h3 className="feature-card-title" style={{ color: 'var(--cyan-accent)' }}>
                  Body as Anchor
                </h3>
                <p className="feature-card-description">
                  Not just movement — a quiet ritual of shaping, shedding, becoming. Strength that stills the mind. Discipline that rewrites the self. The nervous system finds peace where the body feels home.
                </p>
              </div>
            </div>

            <div className="product-card feature-card">
              <div>
                <div className="feature-card-icon">🪞</div>
                <h3 className="feature-card-title" style={{ color: 'var(--yellow-neon)' }}>
                  Mind as Mirror
                </h3>
                <p className="feature-card-description">
                  Where thoughts blur and spirit speaks. Quiet rituals, sacred silence. Sometimes clarity means turning the mind off — and tuning into God.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}