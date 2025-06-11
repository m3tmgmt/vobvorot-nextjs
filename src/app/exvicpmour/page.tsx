'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Footer } from '@/components/Footer'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  images: { url: string; alt?: string; isPrimary: boolean }[]
  skus: { id: string; price: number; stock: number; size?: string; color?: string }[]
  category: { name: string; slug: string }
}

export default function ExvicpmourPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch EXVICPMOUR-specific products
    fetch('/api/products?category=exvicpmour')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch EXVICPMOUR products:', err)
        setIsLoading(false)
      })
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="hero-section hero-small">
        <div className="hero-overlay" style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.8), rgba(0,255,255,0.6))' }}></div>
        
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <h1 className="hero-title glitch" data-logo style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            EXVICPMOUR
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
            Exclusive Collection ✨
          </p>
          <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
            Hey babe, you're one of a kind — dress like it.<br />
            This isn't just shopping. It's a treasure hunt for your statement piece.<br />
            Whether it's a touch of glamorous vintage or a rare, one-of-one wardrobe gem — every piece here is made to match the magic in you.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section section-spacing-medium">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title glitch">
            EXVICPMOUR Collection
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            Because you? You're not basic.<br />
            You're a mood. A moment. A masterpiece.<br />
            Find the thing that feels like you — loud, soft, sparkly, strange — whatever your glam looks like, it belongs here.<br />
            So go on. Fall in love with the piece that's been waiting for you.
          </p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="glitch" style={{ fontSize: '2rem', color: 'var(--cyan-accent)' }}>
              Loading EXVICPMOUR collection...
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎨</div>
            <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem', fontSize: '2rem' }}>
              WHAT?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              babe, don't blink — the drop's coming
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div className="product-card" style={{ minHeight: 'auto', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👟</div>
                <h4 style={{ color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>Walk of Desire</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Not just shoes — a statement waiting to be worn.</p>
              </div>
              <div className="product-card" style={{ minHeight: 'auto', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                <h4 style={{ color: 'var(--purple-accent)', marginBottom: '0.5rem' }}>Through Her Lens</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Restored relics, ready to romanticize your reality</p>
              </div>
              <div className="product-card" style={{ minHeight: 'auto', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💋</div>
                <h4 style={{ color: 'var(--yellow-neon)', marginBottom: '0.5rem' }}>Handle With Drama</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Exclusive pieces stitched for girls who don't do ordinary.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Brand Story Section */}
      <section className="products-section section-spacing-large">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title glitch">
            The EXVICPMOUR Story
          </h2>
          
          <div className="exvicpmour-story-grid">
            <div className="product-card" style={{ textAlign: 'center', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✸</div>
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>about us ✸</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                Exclusive, not for status — for soul.<br />
                Vintage is legacy. Custom is self-expression. Punk is freedom. Glamour is rebellious romance.<br />
                We don't chase trends — we collect rare stories, one piece at a time.
              </p>
            </div>
            
            <div className="product-card" style={{ textAlign: 'center', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>💫</div>
              <h3 style={{ color: 'var(--purple-accent)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>RARE, Like You</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                In a world where fashion moves fast and oceans fill faster — we slow it down.<br />
                Vintage isn't a trend for us. It's care. It's memory. It's style with a soul.<br />
                Every rare piece is a reminder: beauty isn't about more — it's about meaning.<br />
                We glam with intention. We love loud, but we consume soft.<br />
                Find what speaks to you — not the algorithm.
              </p>
            </div>
            
            <div className="product-card" style={{ textAlign: 'center', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✸</div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>artistic vision ✸</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                Inspiration lives inside you.<br />
                Beauty isn't out there — it's how you look at things.<br />
                Shift your gaze. Change the angle.<br />
                Notice what others miss.<br />
                Art begins the moment you really see.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}