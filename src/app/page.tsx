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
  const [homeVideo, setHomeVideo] = useState<string>('')
  const [allVideos, setAllVideos] = useState<string[]>([])
  const { findPiece, dispatch: puzzleDispatch } = usePuzzle()
  
  const videos = useMemo(() => allVideos, [allVideos])

  const allCategories = [
    { id: 'all', name: 'All Items', icon: '' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'clothing', name: 'Clothing', icon: '👗' },
    { id: 'accessories', name: 'Accessories', icon: '💍' },
    { id: 'vintage', name: 'Vintage', icon: '📼' },
    { id: 'custom', name: 'Custom', icon: '🎨' },
    { id: 'bags', name: 'Bags', icon: '👜' }
  ]

  // Функция для загрузки видео галереи
  const loadVideosGallery = () => {
    console.log('Fetching home videos gallery from API...')
    fetch('/api/admin/site/home-videos')
      .then(res => {
        console.log('Home videos API response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('Home videos API data:', data)
        if (data.videos && data.videos.length > 0) {
          const videoUrls = data.videos.map((video: any) => video.url)
          console.log('Setting home videos to:', videoUrls)
          setHomeVideo(videoUrls[0]) // Устанавливаем первое видео как текущее
          setAllVideos(videoUrls) // Обновляем массив всех видео
          console.log('Home videos gallery loaded. Total videos:', videoUrls.length)
        } else {
          console.log('No videos in gallery, showing empty state')
          setAllVideos([]) // Пустой массив - нет видео для показа
        }
      })
      .catch(err => console.error('Failed to fetch home videos:', err))
  }

  // Загружаем галерею видео с API и обновляем каждые 30 секунд
  useEffect(() => {
    loadVideosGallery()
    const interval = setInterval(loadVideosGallery, 30000) // Обновляем каждые 30 секунд
    return () => clearInterval(interval)
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
        
        // For EXVICPMOUR Store section, show only EXVICPMOUR category products
        const exvicpmourProducts = productsList.filter((p: Product) => 
          p.category.slug === 'exvicpmour'
        )
        setFilteredProducts(exvicpmourProducts)
        
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
    
    // Always filter within EXVICPMOUR products only
    const exvicpmourProducts = products.filter((p: Product) => 
      p.category.slug === 'exvicpmour'
    )
    
    if (categoryId === 'all') {
      setFilteredProducts(exvicpmourProducts)
    } else {
      // For EXVICPMOUR Store, we only show EXVICPMOUR products
      // So other category filters will show empty results
      const filtered = exvicpmourProducts.filter(product => 
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
        {videos.length > 0 ? (
          videos.map((video, index) => (
            <video
              key={`${video}-${index}`}
              className={`hero-video-container ${index === currentVideoIndex ? 'active' : ''}`}
              autoPlay
              muted
              loop
              playsInline
              onError={(e) => console.error('Video error:', e, 'Video src:', video)}
              onLoadStart={() => console.log('Video load started:', video)}
              onLoadedData={() => console.log('Video loaded successfully:', video)}
              onCanPlay={() => console.log('Video can play:', video)}
            >
              <source src={video} type="video/mp4" />
            </video>
          ))
        ) : (
          // Нет видео - скрытый placeholder
          <div className="hero-video-container active" style={{
            backgroundColor: '#0a0a0a'
          }}>
            {/* Пустой блок без текста */}
          </div>
        )}
        
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
              {category.icon && <span style={{ marginRight: '0.5rem' }}>{category.icon}</span>}
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
              SOLD OUT
            </h3>
            <button 
              className="filter-btn"
              onClick={() => {
                try {
                  router.push('/products')
                } catch (error) {
                  window.location.href = '/products'
                }
              }}
            >
              Show All Categories
            </button>
          </div>
        )}
        
        {/* View All Items Button */}
        {filteredProducts.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/products" className="hero-button">
              View All Items
            </Link>
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
                Test your memory with our Y2K-themed puzzle game throughout the site
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
              <div className="feature-card-icon">🐇</div>
              <h3 className="feature-card-title" style={{ color: 'var(--purple-accent)' }}>
                Stay Healthy, Stay Iconic
              </h3>
              <p className="feature-card-description">
                diva mode: activated
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
