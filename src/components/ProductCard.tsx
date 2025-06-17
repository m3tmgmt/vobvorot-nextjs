'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ProductErrorBoundary, ProductImageErrorBoundary } from '@/components/ProductErrorBoundary'
import { useToastActions } from '@/components/Toast'
import { useCart } from '@/contexts/CartContext'
import { useStock } from '@/contexts/StockContext'
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
  const { lastUpdate } = useStock()
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [forceUpdateKey, setForceUpdateKey] = useState(0)

  // Force re-render when stock updates globally
  useEffect(() => {
    console.log('🔄 ProductCard stock update detected:', product.name, 'lastUpdate:', lastUpdate)
    setForceUpdateKey(prev => prev + 1)
  }, [lastUpdate, product.name])

  // Listen for order creation events for immediate refresh
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOrderCreated = () => {
      console.log('🛒 ProductCard received order created event for:', product.name)
      setForceUpdateKey(prev => prev + 1)
    }

    const handleReservationCreated = () => {
      console.log('🔒 ProductCard received reservation created event for:', product.name)
      setForceUpdateKey(prev => prev + 1)
    }

    const handleSSEStockUpdate = () => {
      console.log('📡 ProductCard received SSE stock update for:', product.name)
      setForceUpdateKey(prev => prev + 1)
    }

    window.addEventListener('vobvorot-order-created', handleOrderCreated)
    window.addEventListener('vobvorot-reservation-created', handleReservationCreated)
    window.addEventListener('vobvorot-sse-stock-update', handleSSEStockUpdate)
    
    return () => {
      window.removeEventListener('vobvorot-order-created', handleOrderCreated)
      window.removeEventListener('vobvorot-reservation-created', handleReservationCreated)  
      window.removeEventListener('vobvorot-sse-stock-update', handleSSEStockUpdate)
    }
  }, [product.name])

  // Memoize expensive calculations
  const productData = useMemo(() => {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
    const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
    
    // Use availableStock from API (already calculated correctly on backend)
    const availableStockBySku = product.skus.map(sku => {
      // Prefer API calculated availableStock, fallback to calculation only if not provided
      if (typeof sku.availableStock === 'number') {
        return Math.max(0, sku.availableStock)
      }
      // Fallback calculation (for older API responses)
      const available = sku.stock - (sku.reservedStock || 0)
      return Math.max(0, available)
    })
    
    console.log('🔍 ProductCard stock calculation for', product.name, ':', {
      skus: product.skus.map(sku => ({
        id: sku.id,
        stock: sku.stock,
        reservedStock: sku.reservedStock,
        availableStock: sku.availableStock,
        calculated: sku.stock - (sku.reservedStock || 0)
      })),
      availableStockBySku
    })
    
    const inStock = availableStockBySku.some(available => available > 0)
    const totalAvailableStock = availableStockBySku.reduce((total, available) => total + available, 0)
    const totalReservedStock = product.skus.reduce((total, sku) => total + (sku.reservedStock || 0), 0)
    const hasReservations = totalReservedStock > 0
    const defaultSku = product.skus[0]
    
    return {
      primaryImage,
      minPrice,
      inStock,
      totalStock: totalAvailableStock, // Use available stock instead of raw stock
      totalReservedStock,
      hasReservations,
      defaultSku,
      availableStockBySku
    }
  }, [product.images, product.skus, forceUpdateKey]) // Add forceUpdateKey to trigger recalculation

  // Destructure product data for easier access
  const { primaryImage, minPrice, inStock, totalStock, totalReservedStock, hasReservations, defaultSku, availableStockBySku } = productData

  // Memoize click handlers
  const handleAddToCart = useCallback(async () => {
    const defaultSkuAvailable = availableStockBySku[0] || 0 // Available stock for default SKU
    if (defaultSku && defaultSkuAvailable > 0) {
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
            weight: defaultSku.weight ? Number(defaultSku.weight) : 0.5,
            image: primaryImage?.url,
            size: defaultSku.size,
            color: defaultSku.color,
            maxStock: defaultSkuAvailable // Use available stock for max limit
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
  }, [defaultSku, availableStockBySku, primaryImage, dispatch, product.id, product.name, success, error])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageError(false)
  }, [])

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
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <span style={{ 
              color: inStock ? 'var(--green-neon)' : 'var(--pink-main)' 
            }}>
              {inStock ? (totalStock === 1 ? 'last one!' : `${totalStock} left`) : 'sold out'}
            </span>
            {hasReservations && (
              <span style={{ 
                fontSize: '0.75rem',
                color: 'var(--yellow-neon)',
                opacity: 0.8 
              }}>
                🔒 {totalReservedStock} reserved
              </span>
            )}
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

// Custom comparison function for memo to ensure re-render when stock changes
function areEqual(prevProps: ProductCardProps, nextProps: ProductCardProps) {
  // Always re-render if product ID is different
  if (prevProps.product.id !== nextProps.product.id) {
    return false
  }
  
  // Check if any SKU stock data has changed
  const prevSkus = prevProps.product.skus
  const nextSkus = nextProps.product.skus
  
  if (prevSkus.length !== nextSkus.length) {
    return false
  }
  
  for (let i = 0; i < prevSkus.length; i++) {
    const prevSku = prevSkus[i]
    const nextSku = nextSkus[i]
    
    if (
      prevSku.stock !== nextSku.stock ||
      prevSku.reservedStock !== nextSku.reservedStock ||
      (prevSku as any).availableStock !== (nextSku as any).availableStock
    ) {
      console.log('🔄 ProductCard re-rendering due to stock change:', {
        productName: nextProps.product.name,
        skuId: nextSku.id,
        prevStock: prevSku.stock,
        nextStock: nextSku.stock,
        prevReserved: prevSku.reservedStock,
        nextReserved: nextSku.reservedStock,
        prevAvailable: (prevSku as any).availableStock,
        nextAvailable: (nextSku as any).availableStock
      })
      return false // Re-render
    }
  }
  
  // Check other props that might affect rendering
  if (
    prevProps.priority !== nextProps.priority ||
    prevProps.loading !== nextProps.loading
  ) {
    return false
  }
  
  return true // Don't re-render
}

// Use custom comparison function
const MemoizedProductCard = memo(ProductCard, areEqual)
MemoizedProductCard.displayName = 'ProductCard'

export { MemoizedProductCard as ProductCard }