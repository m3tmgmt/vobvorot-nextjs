'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { useStock } from '@/contexts/StockContext'
import { useStockRefresh } from '@/hooks/useStockRefresh'
import { Footer } from '@/components/Footer'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  images: { url: string; alt?: string; isPrimary: boolean }[]
  skus: { id: string; price: any; stock: number; reservedStock?: number; availableStock?: number; size?: string; color?: string }[]
  category: { name: string; slug: string; emoji?: string }
}

interface Category {
  id: string
  name: string
  slug: string
  emoji?: string
}

export default function ProductsPageClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const { lastUpdate, shouldRefetch, resetRefetch, triggerUpdate } = useStock()
  
  // Автоматическое обновление остатков каждые 5 секунд для быстрой реакции
  useStockRefresh({ interval: 5000, enabled: true })

  useEffect(() => {
    console.log('📊 Fetching products on products page, triggered by stock update:', lastUpdate)
    // Fetch both products and categories with cache bypass
    Promise.all([
      fetch('/api/products?t=' + Date.now()).then(res => res.json()),
      fetch('/api/categories?t=' + Date.now()).then(res => res.json())
    ])
      .then(([productsData, categoriesData]) => {
        const productsList = productsData.data?.products || productsData.products || []
        setAllProducts(productsList)
        setProducts(productsList)
        
        // Use categories from API with emoji data
        const apiCategories = Array.isArray(categoriesData) ? categoriesData : []
        
        // Only show categories that have products
        const categoriesWithProducts: Category[] = [{ id: 'all', name: 'All Products', slug: 'all' }]
        
        apiCategories.forEach((category: any) => {
          const hasProducts = productsList.some((p: Product) => p.category.slug === category.slug)
          if (hasProducts) {
            categoriesWithProducts.push({
              id: category.id,
              name: category.name,
              slug: category.slug,
              emoji: category.emoji || '✨'
            } as Category)
          }
        })
        
        setCategories(categoriesWithProducts)
        setIsLoading(false)
        
        // Reset refetch flag after successful fetch
        if (shouldRefetch) {
          resetRefetch()
        }
      })
      .catch(err => {
        console.error('Failed to fetch data:', err)
        // Fallback to products only
        fetch('/api/products')
          .then(res => res.json())
          .then((productsData) => {
            const productsList = productsData.data?.products || productsData.products || []
            setAllProducts(productsList)
            setProducts(productsList)
            
            // Extract unique categories from products as fallback
            const uniqueCategories = Array.from(
              new Set(productsList.map((p: Product) => p.category.slug))
            ).map(slug => {
              const product = productsList.find((p: Product) => p.category.slug === slug)
              return product ? { id: slug, name: product.category.name, slug, emoji: '✨' } as Category : null
            }).filter((cat): cat is Category => cat !== null)
            
            const categoriesWithProducts: Category[] = [{ id: 'all', name: 'All Products', slug: 'all' }]
            if (uniqueCategories.length > 0) {
              categoriesWithProducts.push(...uniqueCategories)
            }
            
            setCategories(categoriesWithProducts)
            setIsLoading(false)
            
            // Reset refetch flag after successful fetch
            if (shouldRefetch) {
              resetRefetch()
            }
          })
          .catch(() => {
            setAllProducts([])
            setProducts([])
            setCategories([{ id: 'all', name: 'All Products', slug: 'all' }] as Category[])
            setIsLoading(false)
          })
      })
  }, [lastUpdate, shouldRefetch, resetRefetch])

  // Listen for order creation events for immediate stock refresh
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOrderCreated = (event: CustomEvent) => {
      console.log('🛒 Order created event received on products page:', event.detail)
      // Force immediate product refresh
      setTimeout(() => {
        console.log('🔄 Force refreshing products page after order')
        triggerUpdate()
      }, 100)
    }

    window.addEventListener('vobvorot-order-created', handleOrderCreated as EventListener)
    
    return () => {
      window.removeEventListener('vobvorot-order-created', handleOrderCreated as EventListener)
    }
  }, [triggerUpdate])

  // Filter products by category only
  useEffect(() => {
    let filteredProducts = allProducts

    // Filter by category
    if (activeCategory !== 'all') {
      filteredProducts = allProducts.filter(product => 
        product.category.slug === activeCategory
      )
    }

    setProducts(filteredProducts)
  }, [allProducts, activeCategory])

  const handleCategoryChange = (categorySlug: string) => {
    setActiveCategory(categorySlug)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <h1 className="hero-title glitch" data-logo>
            All Products
          </h1>
          <p className="hero-subtitle">
            Discover our complete collection ✨
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="products-section section-spacing-medium">
        <div style={{ marginBottom: '3rem' }}>
          <div className="filter-bar" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`filter-btn ${activeCategory === category.slug ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.slug)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="glitch" style={{ fontSize: '2rem', color: 'var(--cyan-accent)' }}>
              Loading products...
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
            <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem', fontSize: '2rem' }}>
              No products found
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              No products found in the {categories.find(c => c.slug === activeCategory)?.name} category
            </p>
            <button 
              className="hero-button"
              onClick={() => setActiveCategory('all')}
            >
              View All Products
            </button>
          </div>
        )}
      </section>

      {/* Categories Showcase */}
      {activeCategory === 'all' && (
        <section className="products-section section-spacing-large">
          <h2 className="section-title glitch">
            Browse by Category
          </h2>
          
          <div className="cards-grid">
            {categories.slice(1).map((category) => {
              const categoryProducts = allProducts.filter(p => p.category.slug === category.slug)
              return (
                <div 
                  key={category.id} 
                  className="product-card" 
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => handleCategoryChange(category.slug)}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {category.emoji || '✨'}
                  </div>
                  <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                    {category.name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
                    {categoryProducts.length} item{categoryProducts.length !== 1 ? 's' : ''}
                  </p>
                  <button className="add-to-cart-btn">
                    Explore {category.name}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}