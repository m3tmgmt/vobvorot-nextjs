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

  const moveToCart = (item: any) => {
    // Add to cart (assuming single SKU for simplicity)
    cartDispatch({
      type: 'ADD_ITEM',
      payload: {
        productId: item.productId,
        skuId: 'default',
        quantity: 1,
        productName: item.productName,
        price: item.price,
        image: item.image
      }
    })
    
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
      <div className={`cart-modal ${state.isOpen ? 'active' : ''}`} style={{
        borderLeft: '2px solid var(--cyan-accent)'
      }}>
        <div className="cart-header">
          <h2 className="cart-title" style={{ color: 'var(--cyan-accent)' }}>
            ✨ Wishlist
          </h2>
          <button className="cart-close" onClick={closeWishlist}>
            ✕
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💫</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '1rem' }}>
              Your wishlist is empty
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
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
                <div key={item.id} className="cart-item" style={{
                  border: '1px solid rgba(0,245,255,0.3)'
                }}>
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
                    
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.5rem',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      Added: {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                    
                    <p className="cart-item-price" style={{ color: 'var(--cyan-accent)' }}>
                      ${item.price}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => moveToCart(item)}
                        style={{
                          background: 'linear-gradient(45deg, var(--pink-main), var(--purple-accent))',
                          border: 'none',
                          color: 'white',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '15px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,107,157,0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        🛒 Add to Cart
                      </button>
                      
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'rgba(255,255,255,0.8)',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '15px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,0,0,0.2)'
                          e.currentTarget.style.borderColor = 'rgba(255,0,0,0.5)'
                          e.currentTarget.style.color = '#ff6b6b'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                          e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Wishlist Actions */}
            <div className="cart-total" style={{
              borderTop: '2px solid var(--cyan-accent)'
            }}>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'var(--cyan-accent)',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {state.itemCount} item{state.itemCount !== 1 ? 's' : ''} saved
              </div>
              
              <button 
                className="checkout-btn"
                onClick={closeWishlist}
                style={{
                  background: 'linear-gradient(45deg, var(--cyan-accent), var(--purple-accent))',
                  color: 'var(--black)'
                }}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1001
          }}
          onClick={closeWishlist}
        />
      )}
    </>
  )
}