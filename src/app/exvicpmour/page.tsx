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
      <section className="hero-section" style={{ height: '60vh', position: 'relative' }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.8), rgba(0,255,255,0.6))' }}></div>
        
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <h1 className="hero-title glitch" data-logo style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            EXVICPMOUR
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
            Exclusive Collection ✨
          </p>
          <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', color: 'rgba(255,255,255,0.9)' }}>
            Discover our limited edition EXVICPMOUR collection featuring custom designs, 
            vintage cameras, and exclusive accessories with Y2K aesthetic and Ukrainian patterns.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section" style={{ marginTop: '6rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title glitch">
            EXVICPMOUR Collection
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto' }}>
            Each piece in our EXVICPMOUR collection is carefully curated and designed to embody 
            the intersection of technology, art, and Ukrainian heritage. Limited quantities available.
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
              Collection Coming Soon
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              Our exclusive EXVICPMOUR pieces are being prepared for release.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div className="product-card" style={{ minHeight: 'auto', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👟</div>
                <h4 style={{ color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>Custom Footwear</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Limited edition designs</p>
              </div>
              <div className="product-card" style={{ minHeight: 'auto', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                <h4 style={{ color: 'var(--purple-accent)', marginBottom: '0.5rem' }}>Vintage Cameras</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Restored & customized</p>
              </div>
              <div className="product-card" style={{ minHeight: 'auto', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👜</div>
                <h4 style={{ color: 'var(--yellow-neon)', marginBottom: '0.5rem' }}>Designer Bags</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Handcrafted exclusives</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Brand Story Section */}
      <section className="products-section" style={{ background: 'rgba(0,0,0,0.3)', marginTop: '6rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title glitch">
            The EXVICPMOUR Story
          </h2>
          
          <div className="exvicpmour-story-grid">
            <div className="product-card" style={{ textAlign: 'center', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🇺🇦</div>
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Ukrainian Heritage</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                Rooted in Ukrainian culture and traditions, each piece tells a story of resilience and creativity from our homeland.
              </p>
            </div>
            
            <div className="product-card" style={{ textAlign: 'center', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>💫</div>
              <h3 style={{ color: 'var(--purple-accent)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Y2K Aesthetic</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                Embracing the digital future with nostalgic Y2K elements and cyberpunk influences that define our era.
              </p>
            </div>
            
            <div className="product-card" style={{ textAlign: 'center', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎨</div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Artistic Vision</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                Where technology meets art, creating unique pieces that push creative boundaries and inspire innovation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}