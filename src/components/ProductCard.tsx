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
          <div className="product-image" style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            overflow: 'hidden'
          }}>
            <ProductImageErrorBoundary>
              {primaryImage && !imageError ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt || product.name}
                  fill
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
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
        {/* Компактная двухколоночная раскладка в 2 строки */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gridTemplateRows: 'auto auto',
          gap: '0.5rem',
          alignItems: 'start',
          marginBottom: '1rem'
        }}>
          {/* Первая строка: Название товара и категория */}
          <Link href={`/products/${product.slug}`} style={{ gridColumn: '1', gridRow: '1' }}>
            <h3 className="product-title" style={{ margin: 0 }}>
              {product.name}
            </h3>
          </Link>
          <p className="product-category" style={{ 
            margin: 0, 
            gridColumn: '2', 
            gridRow: '1',
            textAlign: 'right',
            fontSize: '0.8rem'
          }}>
            {product.category.name}
          </p>
          
          {/* Вторая строка: Цена и остатки */}
          <p className="product-price" style={{ 
            margin: 0, 
            gridColumn: '1', 
            gridRow: '2' 
          }}>
            ${minPrice} USD
          </p>
          <p className="product-stock" style={{ 
            margin: 0, 
            gridColumn: '2', 
            gridRow: '2',
            textAlign: 'right',
            fontSize: '0.85rem' 
          }}>
            {inStock ? (totalStock === 1 ? 'last one!' : `${totalStock} left`) : 'sold out'}
          </p>
        </div>

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