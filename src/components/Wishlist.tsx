'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'

export function Wishlist() {
  const { state, removeFromWishlist, dispatch } = useWishlist()
  const { dispatch: cartDispatch } = useCart()

  const closeWishlist = () => {
    dispatch({ type: 'CLOSE_WISHLIST' })
  }

  const moveToCart = async (item: any) => {
    try {
      // Fetch current product data to get stock info
      const response = await fetch(`/api/products/${item.slug}`)
      const product = await response.json()
      
      if (product && product.skus?.length > 0) {
        const defaultSku = product.skus[0]
        
        if (defaultSku.stock > 0) {
          cartDispatch({
            type: 'ADD_ITEM',
            payload: {
              productId: item.id,
              skuId: defaultSku.id,
              quantity: 1,
              productName: item.name,
              price: defaultSku.price,
              image: item.images?.[0]?.url,
              size: defaultSku.size,
              color: defaultSku.color,
              maxStock: defaultSku.stock
            }
          })
        } else {
          // Show out of stock notification
          const notification = document.createElement('div')
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff4444, #cc0000);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 0 20px rgba(255,68,68,0.5);
            animation: slideIn 0.3s ease;
          `
          notification.textContent = `${item.name} is out of stock!`
          
          document.body.appendChild(notification)
          
          setTimeout(() => {
            notification.remove()
          }, 3000)
          return
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      return
    }
    
    // Show notification
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, var(--pink-main), var(--purple-accent));
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      z-index: 10000;
      box-shadow: 0 0 20px rgba(255,107,157,0.5);
      animation: slideIn 0.3s ease;
    `
    notification.textContent = `${item.productName} added to cart!`
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  return (
    <>
      {/* Wishlist Modal */}
      <div className={`wishlist-modal ${state.isOpen ? 'active' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title" style={{ color: 'var(--cyan-accent)' }}>
            ✨ Wishlist
          </h2>
          <button className="cart-close" onClick={closeWishlist}>
            ✕
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="text-center wishlist-empty">
            <div className="wishlist-empty-icon">💫</div>
            <p className="wishlist-empty-title">
              Your wishlist is empty
            </p>
            <p className="wishlist-empty-subtitle">
              Save items you love for later!
            </p>
            <button 
              className="hero-button" 
              style={{ marginTop: '1rem' }}
              onClick={closeWishlist}
            >
              Discover Products
            </button>
          </div>
        ) : (
          <>
            {/* Wishlist Items */}
            <div>
              {state.items.map((item) => (
                <div key={item.id} className="cart-item wishlist-item">
                  {item.images?.[0]?.url && (
                    <Link href={`/products/${item.slug}`} onClick={closeWishlist}>
                      <Image
                        src={item.images[0].url}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="cart-item-image"
                        style={{ cursor: 'pointer' }}
                      />
                    </Link>
                  )}
                  
                  <div className="cart-item-details">
                    <Link href={`/products/${item.slug}`} onClick={closeWishlist}>
                      <h3 className="cart-item-title" style={{ 
                        cursor: 'pointer',
                        textDecoration: 'none'
                      }}>
                        {item.name}
                      </h3>
                    </Link>
                    
                    <p className="wishlist-item-date">
                      Added: {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                    
                    <p className="cart-item-price wishlist-item-price">
                      ${item.price}
                    </p>
                    
                    <div className="wishlist-buttons">
                      <button
                        onClick={() => moveToCart(item)}
                        className="wishlist-add-to-cart-btn"
                      >
                        🛒 Add to Cart
                      </button>
                      
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="wishlist-remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Wishlist Actions */}
            <div className="cart-total wishlist-total">
              <div className="wishlist-count">
                {state.itemCount} item{state.itemCount !== 1 ? 's' : ''} saved
              </div>
              
              <button 
                className="checkout-btn wishlist-continue-btn"
                onClick={closeWishlist}
              >
                Continue Shopping ✨
              </button>
            </div>
          </>
        )}
      </div>

      {/* Backdrop */}
      {state.isOpen && (
        <div 
          className="modal-backdrop wishlist-backdrop"
          onClick={closeWishlist}
        />
      )}
    </>
  )
}