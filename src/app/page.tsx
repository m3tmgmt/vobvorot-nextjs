'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { Footer } from '@/components/Footer'
import LettersToFuture from '@/components/LettersToFuture'
import { LazySection } from '@/components/LazySection'

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
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string, icon: string}[]>([])
  const [homeVideo, setHomeVideo] = useState<string>('/assets/videos/hero2.mp4')
  const { findPiece, dispatch: puzzleDispatch } = usePuzzle()
  
  const videos = useMemo(() => [homeVideo], [homeVideo])

  const allCategories = [
    { id: 'all', name: 'All Items', icon: '✨' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'clothing', name: 'Clothing', icon: '👗' },
    { id: 'accessories', name: 'Accessories', icon: '💍' },
    { id: 'vintage', name: 'Vintage', icon: '📼' },
    { id: 'custom', name: 'Custom', icon: '🎨' },
    { id: 'bags', name: 'Bags', icon: '👜' }
  ]

  // Загружаем видео с API
  useEffect(() => {
    console.log('Fetching home video from API...')
    fetch('/api/admin/site/home-video')
      .then(res => {
        console.log('Home video API response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('Home video API data:', data)
        if (data.videoUrl) {
          console.log('Setting home video to:', data.videoUrl)
          setHomeVideo(data.videoUrl)
        } else {
          console.log('No videoUrl in response, using default')
        }
      })
      .catch(err => console.error('Failed to fetch home video:', err))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [videos.length])

  useEffect(() => {
    fetch('/api/products?limit=12')
      .then(res => res.json())
      .then(data => {
        const productsList = data.products || []
        setProducts(productsList)
        setFilteredProducts(productsList)
        
        // Get unique categories from actual products
        const productCategories = new Set(productsList.map((p: Product) => p.category.slug))
        
        // Filter categories to show only those with products, plus "all"
        const categoriesWithProducts = allCategories.filter(cat => 
          cat.id === 'all' || productCategories.has(cat.id)
        )
        
        setAvailableCategories(categoriesWithProducts)
      })
      .catch(err => console.error('Failed to fetch products:', err))
  }, [])

  const handleFilter = (categoryId: string) => {
    setActiveFilter(categoryId)
    if (categoryId === 'all') {
      setFilteredProducts(products)
    } else {
      // Filter by actual category slug
      const filtered = products.filter(product => 
        product.category.slug === categoryId
      )
      setFilteredProducts(filtered)
    }
  }

  console.log('Current home video state:', homeVideo)
  console.log('Videos array:', videos)

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        {videos.map((video, index) => (
          <video
            key={video}
            className={`hero-video-container ${index === currentVideoIndex ? 'active' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            onError={(e) => console.error('Video error:', e, 'Video src:', video)}
            onLoadStart={() => console.log('Video load started:', video)}
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
          <div className="hero-button-wrapper">
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
            >
              Explore EXVICPMOUR
            </button>
          </div>
        </div>
        
        <div className="hero-pagination">
          {videos.map((_, index) => (
            <button
              key={index}
              className={`hero-pagination-dot ${index === currentVideoIndex ? 'active' : ''}`}
              onClick={() => setCurrentVideoIndex(index)}
            />
          ))}
        </div>
      </section>

      {/* Products Section */}
      <LazySection 
        className="products-section section-spacing-large"
        minHeight="400px"
        rootMargin="200px"
      >
        <h2 className="section-title glitch">
          EXVICPMOUR Store
        </h2>
        
        {/* Category Filters */}
        <div className="filter-bar">
          {availableCategories.map((category) => (
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
          {filteredProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product as any} 
              priority={index < 4}
              loading={index < 4 ? 'eager' : 'lazy'}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="empty-state">
            <h3 className="empty-state-title">
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
      </LazySection>

      {/* Interactive Sections */}
      <LazySection 
        className="products-section section-spacing-large"
        minHeight="300px"
        rootMargin="200px"
      >
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 className="section-title glitch">
            Interactive Features
          </h2>
          <div className="cards-grid">
          {/* Puzzle Game Card */}
          <div className="product-card feature-card">
            <div>
              <div className="feature-card-icon">🧩</div>
              <h3 className="feature-card-title" style={{ color: 'var(--cyan-accent)' }}>
                Memory Puzzle
              </h3>
              <p className="feature-card-description">
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
          <div className="product-card feature-card">
            <div>
              <div className="feature-card-icon">🎓</div>
              <h3 className="feature-card-title" style={{ color: 'var(--purple-accent)' }}>
                Training Programs
              </h3>
              <p className="feature-card-description">
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
          <div className="product-card feature-card">
            <div>
              <div className="feature-card-icon">🌐</div>
              <h3 className="feature-card-title" style={{ color: 'var(--yellow-neon)' }}>
                Community Hub
              </h3>
              <p className="feature-card-description">
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

          {/* Letters to Future Card */}
          <LettersToFuture />
        </div>
        </div>
      </LazySection>

      
      <Footer />
    </div>
  )
}
