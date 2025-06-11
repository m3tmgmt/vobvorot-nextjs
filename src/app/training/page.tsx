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
          
          <div className="cards-grid">
            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>Food as Feeling</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Not just meals — whispers to your skin, messages to your mood. Secrets live in what you taste. What you feed yourself, you become — soft, glowing, rewired.
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏋️</div>
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>Body as Anchor</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Not just movement — a quiet ritual of shaping, shedding, becoming. Strength that stills the mind. Discipline that rewrites the self. The nervous system finds peace where the body feels home.
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🪞</div>
              <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>Mind as Mirror</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Where thoughts blur and spirit speaks. Quiet rituals, sacred silence. Sometimes clarity means turning the mind off — and tuning into God.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}