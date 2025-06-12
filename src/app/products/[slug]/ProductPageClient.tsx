'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import ProductVideoGallery from '@/components/ProductVideoGallery'
// import { ProductReviews } from '@/components/ProductReviews' // Скрыто до появления серийных товаров

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  images: { url: string; alt?: string; isPrimary: boolean }[]
  skus: { id: string; price: any; stock: number; size?: string; color?: string }[]
  category: { name: string; slug: string }
  video?: {
    url: string
    thumbnail?: string
    title?: string
  }
}

interface ProductPageClientProps {
  product: Product
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const { dispatch } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const [selectedSku, setSelectedSku] = useState<string>(product.skus[0]?.id || '')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const selectedSkuData = product.skus.find(sku => sku.id === selectedSku) || product.skus[0]

  const handleAddToCart = () => {
    if (selectedSkuData && selectedSkuData.stock > 0) {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          productId: product.id,
          skuId: selectedSkuData.id,
          quantity: 1,
          productName: product.name,
          price: Number(selectedSkuData.price),
          image: product.images[selectedImageIndex]?.url,
          size: selectedSkuData.size,
          color: selectedSkuData.color,
          maxStock: selectedSkuData.stock
        }
      })
    }
  }

  const handleAddToWishlist = () => {
    if (product && !isInWishlist(product.id)) {
      addToWishlist({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(selectedSkuData?.price) || 0,
        brand: product.brand,
        images: product.images,
        category: product.category
      })
      
      // Show notification
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, var(--cyan-accent), var(--purple-accent));
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(0,245,255,0.5);
        animation: slideIn 0.3s ease;
      `
      notification.textContent = `${product.name} added to wishlist!`
      
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.remove()
      }, 3000)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Breadcrumb Navigation */}
      <nav 
        style={{ 
          padding: '1rem 2rem',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,107,157,0.2)'
        }}
        aria-label="Breadcrumb"
      >
        <ol style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0,
          padding: 0,
          listStyle: 'none',
          fontSize: '0.9rem',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <li>
            <Link 
              href="/" 
              style={{ 
                color: 'var(--cyan-accent)', 
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink-main)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--cyan-accent)'}
            >
              Home
            </Link>
          </li>
          <li style={{ color: 'rgba(255,255,255,0.5)' }}>/</li>
          <li>
            <Link 
              href="/products" 
              style={{ 
                color: 'var(--cyan-accent)', 
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink-main)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--cyan-accent)'}
            >
              Products
            </Link>
          </li>
          <li style={{ color: 'rgba(255,255,255,0.5)' }}>/</li>
          <li>
            <Link 
              href={`/categories/${product.category.slug}`} 
              style={{ 
                color: 'var(--cyan-accent)', 
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink-main)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--cyan-accent)'}
            >
              {product.category.name}
            </Link>
          </li>
          <li style={{ color: 'rgba(255,255,255,0.5)' }}>/</li>
          <li style={{ color: 'rgba(255,255,255,0.8)' }}>{product.name}</li>
        </ol>
      </nav>

      {/* Hero Section with Video Background */}
      <section className="hero-section">
        {product.video && (
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={product.video.url} type="video/mp4" />
          </video>
        )}
        
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <h1 className="hero-title glitch" style={{ fontSize: '3rem' }}>
            {product.name}
          </h1>
          {product.brand && (
            <p className="hero-subtitle" style={{ 
              color: 'var(--pink-main)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontSize: '1rem'
            }}>
              {product.brand}
            </p>
          )}
        </div>
      </section>

      {/* Product Details */}
      <div className="products-section" style={{ marginTop: '4rem' }}>
        <div className="container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '3rem'
        }}>
          {/* Image Section */}
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              {product.images.length > 0 ? (
                <div style={{
                  aspectRatio: '1',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '15px',
                  border: '2px solid var(--pink-main)',
                  background: 'rgba(255,255,255,0.05)',
                  boxShadow: '0 0 30px rgba(255,107,157,0.3)'
                }}>
                  <Image
                    src={product.images[selectedImageIndex].url}
                    alt={product.images[selectedImageIndex].alt || product.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={selectedImageIndex === 0}
                  />
                </div>
              ) : (
                <div style={{
                  aspectRatio: '1',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '15px',
                  border: '2px solid var(--pink-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'var(--cyan-accent)' }}>No Image</span>
                </div>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '0.5rem' 
              }}>
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    style={{
                      aspectRatio: '1',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '8px',
                      border: selectedImageIndex === index ? '2px solid var(--pink-main)' : '2px solid transparent',
                      background: 'rgba(255,255,255,0.05)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(255,107,157,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    aria-label={`View image ${index + 1} of ${product.name}`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 25vw, (max-width: 1200px) 15vw, 10vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div style={{ padding: '1rem' }}>
            <div style={{
              background: 'var(--pink-main)',
              color: 'var(--black)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {product.category.name}
            </div>

            {product.description && (
              <div style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '1.1rem',
                lineHeight: '1.6',
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,107,157,0.3)',
                borderRadius: '10px'
              }}>
                {product.description}
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: 'var(--cyan-accent)',
                marginBottom: '1rem',
                textShadow: '0 0 10px var(--cyan-accent)'
              }}>
                Options:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {product.skus.map((sku) => (
                  <label
                    key={sku.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: selectedSku === sku.id 
                        ? '2px solid var(--pink-main)' 
                        : '2px solid rgba(255,255,255,0.2)',
                      background: selectedSku === sku.id 
                        ? 'rgba(255,107,157,0.1)' 
                        : 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSku !== sku.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(255,107,157,0.5)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSku !== sku.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="sku"
                      value={sku.id}
                      checked={selectedSku === sku.id}
                      onChange={() => setSelectedSku(sku.id)}
                      style={{ display: 'none' }}
                      aria-label={`Select ${sku.size || sku.color || 'standard'} option for $${Number(sku.price)}`}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {sku.size && <span style={{ color: 'var(--white)' }}>Size: {sku.size}</span>}
                      {sku.color && <span style={{ color: 'var(--white)' }}>Color: {sku.color}</span>}
                      {!sku.size && !sku.color && <span style={{ color: 'var(--white)' }}>Standard</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        fontWeight: '700', 
                        color: 'var(--pink-main)',
                        fontSize: '1.2rem',
                        marginBottom: '0.25rem'
                      }}>
                        ${Number(sku.price)}
                      </p>
                      {sku.stock > 0 ? (
                        <p style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--green-neon)',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                          {sku.stock} in stock
                        </p>
                      ) : (
                        <p style={{ 
                          fontSize: '0.8rem', 
                          color: '#ff4444',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                          Out of stock
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                className="hero-button"
                onClick={handleAddToCart}
                disabled={!selectedSkuData || selectedSkuData.stock === 0}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  opacity: (!selectedSkuData || selectedSkuData.stock === 0) ? 0.5 : 1,
                  cursor: (!selectedSkuData || selectedSkuData.stock === 0) ? 'not-allowed' : 'pointer'
                }}
                aria-label={`Add ${product.name} to cart for $${Number(selectedSkuData?.price)}`}
              >
                Add to Cart - ${Number(selectedSkuData?.price)}
              </button>
              
              <button
                className="filter-btn"
                onClick={handleAddToWishlist}
                disabled={!product || isInWishlist(product.id)}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  background: isInWishlist(product?.id || '') ? 'rgba(0,245,255,0.2)' : 'transparent',
                  border: '2px solid var(--cyan-accent)',
                  color: isInWishlist(product?.id || '') ? 'var(--cyan-accent)' : 'var(--cyan-accent)',
                  opacity: isInWishlist(product?.id || '') ? 0.7 : 1,
                  cursor: isInWishlist(product?.id || '') ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isInWishlist(product?.id || '')) {
                    e.currentTarget.style.background = 'var(--cyan-accent)'
                    e.currentTarget.style.color = 'var(--black)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isInWishlist(product?.id || '')) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--cyan-accent)'
                  }
                }}
                aria-label={isInWishlist(product?.id || '') ? 'Already in wishlist' : 'Add to wishlist'}
              >
                {isInWishlist(product?.id || '') ? '✨ Already in Wishlist' : 'Add to Wishlist ✨'}
              </button>
            </div>
          </div>
        </div>

        {/* Video Gallery Section */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '3rem auto 0 auto', 
          padding: '0 2rem' 
        }}>
          <h2 style={{ 
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--cyan-accent)',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Product Videos
          </h2>
          <ProductVideoGallery 
            productId={product.id}
            className="product-videos"
            autoplay={false}
            controls={true}
            muted={true}
            loop={false}
            playsInline={true}
          />
        </div>

        {/* Reviews Section - скрыто для уникальных товаров */}
        {/* <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <ProductReviews 
            productId={product.id} 
            productName={product.name}
          />
        </div> */}
      </div>
    </div>
  )
}