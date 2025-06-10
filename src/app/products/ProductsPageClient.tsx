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
  skus: { id: string; price: any; stock: number; size?: string; color?: string }[]
  category: { name: string; slug: string }
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ProductsPageClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    // Fetch products only (categories endpoint disabled)
    fetch('/api/products')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((productsData) => {
        const productsList = productsData.products || []
        setAllProducts(productsList)
        setProducts(productsList)
        
        // Extract unique categories from products - only categories that have products
        const uniqueCategories = Array.from(
          new Set(productsList.map((p: Product) => p.category.slug))
        ).map(slug => {
          const product = productsList.find((p: Product) => p.category.slug === slug)
          return product ? { id: slug, name: product.category.name, slug } : null
        }).filter((cat): cat is Category => cat !== null)
        
        // Only show "All Products" and categories that actually have products
        const categoriesWithProducts = [{ id: 'all', name: 'All Products', slug: 'all' }]
        if (uniqueCategories.length > 0) {
          categoriesWithProducts.push(...uniqueCategories)
        }
        
        setCategories(categoriesWithProducts)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch products:', err)
        // Fallback to empty state
        setAllProducts([])
        setProducts([])
        setCategories([{ id: 'all', name: 'All Products', slug: 'all' }])
        setIsLoading(false)
      })
  }, [])

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
      <section className="hero-section" style={{ height: '40vh', position: 'relative' }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(135deg, rgba(0,255,255,0.6), rgba(255,107,157,0.6))' }}></div>
        
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <h1 className="hero-title glitch" data-logo style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            All Products
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.3rem' }}>
            Discover our complete collection ✨
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="products-section" style={{ marginTop: '6rem' }}>
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
        <section className="products-section" style={{ background: 'rgba(0,0,0,0.3)', marginTop: '6rem' }}>
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
                    {category.slug === 'exvicpmour' && '🎨'}
                    {category.slug === 'shoes' && '👟'}
                    {category.slug === 'accessories' && '💍'}
                    {category.slug === 'hats' && '👒'}
                    {category.slug === 'vintage' && '📼'}
                    {category.slug === 'y2k' && '💫'}
                    {category.slug === 'bags' && '👜'}
                    {category.slug === 'cameras' && '📷'}
                    {category.slug === 'fashion' && '👗'}
                    {category.slug === 'custom' && '🎨'}
                    {!['exvicpmour', 'shoes', 'accessories', 'hats', 'vintage', 'y2k', 'bags', 'cameras', 'fashion', 'custom'].includes(category.slug) && '✨'}
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