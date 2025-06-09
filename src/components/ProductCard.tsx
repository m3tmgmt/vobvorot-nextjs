'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, useMemo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProductErrorBoundary, ProductImageErrorBoundary } from '@/components/ProductErrorBoundary'
import { useToastActions } from '@/components/Toast'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  priority?: boolean
  loading?: 'eager' | 'lazy'
}

/**
 * Optimized ProductCard component with error boundaries and performance improvements
 * @param product - Product data to display
 * @param priority - Whether to prioritize image loading (for above-the-fold content)
 * @param loading - Image loading strategy
 */
const ProductCard = memo(function ProductCard({ 
  product, 
  priority = false,
  loading = 'lazy'
}: ProductCardProps) {
  const { dispatch } = useCart()
  const { success, error } = useToastActions()
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Memoize expensive calculations
  const productData = useMemo(() => {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
    const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
    const inStock = product.skus.some(sku => sku.stock > 0)
    const totalStock = product.skus.reduce((total, sku) => total + sku.stock, 0)
    const defaultSku = product.skus[0]
    
    return {
      primaryImage,
      minPrice,
      inStock,
      totalStock,
      defaultSku
    }
  }, [product.images, product.skus])

  // Memoize click handlers
  const handleAddToCart = useCallback(async () => {
    const { defaultSku, primaryImage } = productData
    if (defaultSku && defaultSku.stock > 0) {
      setIsLoading(true)
      try {
        dispatch({
          type: 'ADD_ITEM',
          payload: {
            productId: product.id,
            skuId: defaultSku.id,
            quantity: 1,
            productName: product.name,
            price: Number(defaultSku.price),
            image: primaryImage?.url,
            size: defaultSku.size,
            color: defaultSku.color,
            maxStock: defaultSku.stock
          }
        })
        
        success('Added to bag!', `${product.name} has been added to your cart`)
      } catch (err) {
        console.error('Failed to add item to cart:', err)
        error('Failed to add item', 'Please try again later')
      } finally {
        setIsLoading(false)
      }
    }
  }, [productData, dispatch, product.id, product.name])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageError(false)
  }, [])

  const { primaryImage, minPrice, inStock, totalStock, defaultSku } = productData

  return (
    <ProductErrorBoundary>
      <div className="product-card">
        <Link href={`/products/${product.slug}`}>
          <div className="product-image">
            <ProductImageErrorBoundary>
              {primaryImage && !imageError ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt || product.name}
                  width={280}
                  height={280}
                  style={{objectFit: 'cover'}}
                  sizes="(max-width: 480px) 200px, (max-width: 768px) 250px, 280px"
                  priority={priority}
                  loading={loading}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              ) : (
                <div className="w-full h-full flex-center" style={{
                  background: 'rgba(255,255,255,0.1)',
                  minHeight: '280px'
                }}>
                  <span style={{color: 'rgba(255,255,255,0.5)'}}>
                    {imageError ? 'Failed to load image' : 'No Image'}
                  </span>
                </div>
              )}
            </ProductImageErrorBoundary>
            
            {!inStock && (
              <div className="absolute" style={{
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="text-white" style={{fontWeight: '600'}}>Out of Stock</span>
              </div>
            )}
          </div>
        </Link>

      <div className="product-info">
        <p className="product-category">{product.category.name}</p>
        
        <Link href={`/products/${product.slug}`}>
          <h3 className="product-title">
            {product.name}
          </h3>
        </Link>

        {/* Rating - скрыто для уникальных товаров */}
        {/* {product.averageRating && product.averageRating > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', gap: '1px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    color: star <= Math.round(product.averageRating!) ? 'var(--yellow-neon)' : 'rgba(255,255,255,0.3)',
                    fontSize: '0.9rem'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.8rem'
            }}>
              ({product.averageRating.toFixed(1)})
            </span>
          </div>
        )} */}

        <p className="product-price">${minPrice} USD</p>
        
        <p className="product-stock">
          {inStock ? (totalStock === 1 ? 'last one!' : `${totalStock} left`) : 'sold out'}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={!inStock || isLoading}
          className="add-to-cart-btn"
          style={{
            opacity: inStock && !isLoading ? 1 : 0.5,
            cursor: inStock && !isLoading ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoading ? 'Adding...' : inStock ? 'add to bag' : 'sold out'}
        </button>
      </div>
      </div>
    </ProductErrorBoundary>
  )
})

// Custom comparison function for memo
ProductCard.displayName = 'ProductCard'

export { ProductCard }