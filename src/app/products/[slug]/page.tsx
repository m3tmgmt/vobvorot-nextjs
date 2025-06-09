'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
// import { ProductReviews } from '@/components/ProductReviews' // Скрыто до появления серийных товаров

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  images: { url: string; alt?: string; isPrimary: boolean }[]
  skus: { id: string; price: number; stock: number; size?: string; color?: string }[]
  category: { name: string; slug: string }
  video?: {
    url: string
    thumbnail?: string
    title?: string
  }
}

export default function ProductPage() {
  const params = useParams()
  const { dispatch } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedSku, setSelectedSku] = useState<string>('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (params.slug) {
      fetch(`/api/products/${params.slug}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data)
          if (data?.skus?.length > 0) {
            setSelectedSku(data.skus[0].id)
          }
        })
        .catch(err => console.error('Failed to fetch product:', err))
    }
  }, [params.slug])

  if (!product) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderLeft: '4px solid var(--pink-main)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <p style={{ color: 'var(--cyan-accent)', fontFamily: 'JetBrains Mono, monospace' }}>
          Loading product...
        </p>
      </div>
    )
  }

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
          price: selectedSkuData.price,
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
        price: selectedSkuData?.price || 0,
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
      <div className="products-section">
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
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || product.name}
                      fill
                      style={{ objectFit: 'cover' }}
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
                        ${sku.price}
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
              >
                Add to Cart - ${selectedSkuData?.price}
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
              >
                {isInWishlist(product?.id || '') ? '✨ Already in Wishlist' : 'Add to Wishlist ✨'}
              </button>
            </div>
          </div>
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