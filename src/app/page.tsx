'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { usePuzzle } from '@/contexts/PuzzleContext'
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

export default function HomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const [showLetterForm, setShowLetterForm] = useState(false)
  const { findPiece, dispatch: puzzleDispatch } = usePuzzle()
  
  const videos = [
    '/assets/videos/hero2.mp4'
  ]

  const categories = [
    { id: 'all', name: 'All Items', icon: '✨' },
    { id: 'cameras', name: 'Cameras', icon: '📷' },
    { id: 'fashion', name: 'Fashion', icon: '👗' },
    { id: 'accessories', name: 'Accessories', icon: '💍' },
    { id: 'vintage', name: 'Vintage', icon: '📼' },
    { id: 'custom', name: 'Custom', icon: '🎨' }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/api/products?limit=12')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || [])
        setFilteredProducts(data.products || [])
      })
      .catch(err => console.error('Failed to fetch products:', err))
  }, [])

  const handleFilter = (categoryId: string) => {
    setActiveFilter(categoryId)
    if (categoryId === 'all') {
      setFilteredProducts(products)
    } else {
      // Since we don't have exact category matches, simulate filtering
      const filtered = products.filter((_, index) => {
        if (categoryId === 'cameras') return index % 5 === 0
        if (categoryId === 'fashion') return index % 5 === 1 || index % 5 === 2
        if (categoryId === 'accessories') return index % 5 === 3
        if (categoryId === 'vintage') return index % 3 === 0
        if (categoryId === 'custom') return index % 3 === 1
        return true
      })
      setFilteredProducts(filtered)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        {videos.map((video, index) => (
          <video
            key={video}
            className="hero-video"
            style={{
              opacity: index === currentVideoIndex ? 1 : 0,
              transition: 'opacity 1s ease-in-out'
            }}
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={video} type="video/mp4" />
          </video>
        ))}
        
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <h1 
            className="hero-title glitch"
            onClick={() => findPiece('hero-click')}
            style={{ cursor: 'pointer' }}
            data-logo
          >
            vobvorot
          </h1>
          <p className="hero-subtitle">
            digital playground ✨
          </p>
          <button 
            className="hero-button"
            onClick={() => {
              console.log('Navigating to /exvicpmour')
              try {
                router.push('/exvicpmour')
              } catch (error) {
                window.location.href = '/exvicpmour'
              }
            }}
            style={{
              position: 'relative',
              zIndex: 10,
              pointerEvents: 'auto',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Explore EXVICPMOUR
          </button>
        </div>
        
        <div style={{position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)'}}>
          <div className="flex" style={{gap: '0.5rem'}}>
            {videos.map((_, index) => (
              <button
                key={index}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: index === currentVideoIndex ? 'var(--pink-main)' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onClick={() => setCurrentVideoIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section">
        <h2 className="section-title glitch">
          EXVICPMOUR Store
        </h2>
        
        {/* Category Filters */}
        <div className="filter-bar">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-btn ${activeFilter === category.id ? 'active' : ''}`}
              onClick={() => handleFilter(category.id)}
            >
              <span style={{ marginRight: '0.5rem' }}>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
              No items found in this category
            </h3>
            <button 
              className="filter-btn"
              onClick={() => handleFilter('all')}
            >
              View All Items
            </button>
          </div>
        )}
      </section>

      {/* Interactive Sections */}
      <section className="products-section">
        <h2 className="section-title glitch">
          Interactive Features
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {/* Puzzle Game Card */}
          <div className="product-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧩</div>
              <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                Memory Puzzle
              </h3>
              <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Test your memory with our Y2K-themed puzzle game
              </p>
            </div>
            <button 
              className="add-to-cart-btn"
              onClick={() => {
                try {
                  router.push('/puzzle')
                } catch (error) {
                  window.location.href = '/puzzle'
                }
              }}
            >
              Play Now
            </button>
          </div>

          {/* Training Programs Card */}
          <div className="product-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
              <h3 style={{ color: 'var(--purple-accent)', marginBottom: '1rem' }}>
                Training Programs
              </h3>
              <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Learn digital design, curation, and creative coding
              </p>
            </div>
            <button 
              className="add-to-cart-btn"
              onClick={() => {
                try {
                  router.push('/training')
                } catch (error) {
                  window.location.href = '/training'
                }
              }}
            >
              Explore Courses
            </button>
          </div>

          {/* Community Card */}
          <div className="product-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌐</div>
              <h3 style={{ color: 'var(--yellow-neon)', marginBottom: '1rem' }}>
                Community Hub
              </h3>
              <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Connect with creators and join events
              </p>
            </div>
            <button 
              className="add-to-cart-btn"
              onClick={() => {
                try {
                  router.push('/community')
                } catch (error) {
                  window.location.href = '/community'
                }
              }}
            >
              Join Community
            </button>
          </div>
        </div>
      </section>

      {/* Letters to Future Section */}
      <section className="products-section">
        <h2 className="section-title glitch">
          Letters to Future
        </h2>
        
        <div style={{
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <div className="product-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💌</div>
              <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
                Letters to Future
              </h3>
              <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Write a message to your future self. We'll deliver it when the time comes.
              </p>
            </div>
            
            {!showLetterForm ? (
              <button 
                className="add-to-cart-btn"
                onClick={() => setShowLetterForm(true)}
              >
                Write Letter
              </button>
            ) : (
              <div>
                <textarea
                  placeholder="Dear future me..."
                  style={{
                    width: '100%',
                    height: '120px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '2px solid var(--pink-main)',
                    borderRadius: '10px',
                    padding: '1rem',
                    color: 'var(--white)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    marginBottom: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '2px solid var(--cyan-accent)',
                      borderRadius: '5px',
                      padding: '0.5rem',
                      color: 'var(--white)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => {
                      puzzleDispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'time-traveler' })
                    }}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    Send to Future
                  </button>
                  <button 
                    className="filter-btn"
                    onClick={() => setShowLetterForm(false)}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
