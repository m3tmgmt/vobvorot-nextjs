'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart()
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
  const minPrice = Math.min(...product.skus.map(sku => sku.price))
  const inStock = product.skus.some(sku => sku.stock > 0)
  const totalStock = product.skus.reduce((total, sku) => total + sku.stock, 0)
  const defaultSku = product.skus[0]

  const handleAddToCart = () => {
    if (defaultSku && defaultSku.stock > 0) {
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
          color: defaultSku.color,
          maxStock: defaultSku.stock
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
              width={280}
              height={280}
              style={{objectFit: 'cover'}}
              sizes="(max-width: 480px) 200px, (max-width: 768px) 250px, 280px"
              priority={false}
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
          disabled={!inStock}
          className="add-to-cart-btn"
          style={{opacity: inStock ? 1 : 0.5}}
        >
          {inStock ? 'add to bag' : 'sold out'}
        </button>
      </div>
    </div>
  )
}