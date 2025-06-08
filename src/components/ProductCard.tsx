'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  images: { url: string; alt?: string; isPrimary: boolean }[]
  skus: { id: string; price: number; stock: number; size?: string; color?: string }[]
  category: { name: string; slug: string }
  averageRating?: number
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart()
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
  const minPrice = Math.min(...product.skus.map(sku => sku.price))
  const inStock = product.skus.some(sku => sku.stock > 0)
  const defaultSku = product.skus[0]

  const handleAddToCart = () => {
    if (defaultSku) {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          productId: product.id,
          skuId: defaultSku.id,
          quantity: 1,
          productName: product.name,
          price: defaultSku.price,
          image: primaryImage?.url,
          size: defaultSku.size,
          color: defaultSku.color
        }
      })
    }
  }

  return (
    <div className="product-card">
      <Link href={`/products/${product.slug}`}>
        <div className="product-image">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              style={{objectFit: 'cover'}}
              className="product-image"
            />
          ) : (
            <div className="w-full h-full flex-center" style={{background: 'rgba(255,255,255,0.1)'}}>
              <span style={{color: 'rgba(255,255,255,0.5)'}}>No Image</span>
            </div>
          )}
          
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

      <div>
        {product.brand && (
          <p style={{
            color: 'var(--cyan-accent)',
            fontSize: '0.9rem',
            marginBottom: '0.5rem',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {product.brand}
          </p>
        )}
        
        <Link href={`/products/${product.slug}`}>
          <h3 className="product-title glitch">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="product-description">
            {product.description.length > 100 
              ? `${product.description.substring(0, 100)}...` 
              : product.description
            }
          </p>
        )}

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

        <div className="product-price">
          ${minPrice}
          {product.skus.length > 1 && (
            <span style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.6)',
              marginLeft: '0.5rem'
            }}>
              from
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="add-to-cart-btn"
          style={{opacity: inStock ? 1 : 0.5}}
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  )
}