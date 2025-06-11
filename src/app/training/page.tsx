import { Footer } from '@/components/Footer'

export default function TrainingPage() {
  return (
    <div className="training-section">
      <div className="hero-section hero-medium">
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <h1 className="hero-title glitch">vobvorot Academy</h1>
          <p className="hero-subtitle">
            Digital creativity courses • Coming soon ✨
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
              Learn digital design, Y2K aesthetics, and creative coding from Ukrainian artists. 
              Our courses blend traditional craftsmanship with modern technology.
            </p>
          </div>
        </div>
      </div>

      <section className="products-section section-spacing-medium">
        <div className="container">
          <h2 className="section-title">Coming Courses</h2>
          
          <div className="cards-grid">
            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>Digital Art Fundamentals</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Master the basics of digital design with Y2K and cyberpunk aesthetics
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💻</div>
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>Creative Coding</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Learn to code interactive experiences and generative art
              </p>
            </div>

            <div className="product-card content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
              <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>Brand Design</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Create memorable brands with Ukrainian heritage and modern appeal
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}