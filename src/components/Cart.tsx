'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

export function Cart() {
  const { state, dispatch } = useCart()
  const router = useRouter()

  const updateQuantity = (productId: string, skuId: string, newQuantity: number) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, skuId, quantity: newQuantity }
    })
  }

  const removeItem = (productId: string, skuId: string) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { productId, skuId }
    })
  }

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' })
  }

  return (
    <>
      {/* Cart Modal */}
      <div className={`cart-modal ${state.isOpen ? 'active' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">Shopping Cart</h2>
          <button className="cart-close" onClick={closeCart}>
            ✕
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem 0' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
              Your cart is empty
            </p>
            <button 
              className="hero-button" 
              style={{ marginTop: '1rem' }}
              onClick={closeCart}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div>
              {state.items.map((item) => (
                <div key={`${item.productId}-${item.skuId}`} className="cart-item">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      width={80}
                      height={80}
                      className="cart-item-image"
                    />
                  )}
                  
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">{item.productName}</h3>
                    
                    {(item.size || item.color) && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '0.5rem'
                      }}>
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ' • '}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    
                    <p className="cart-item-price">${item.price}</p>
                    
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.productId, item.skuId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{
                        color: 'var(--white)',
                        fontWeight: '600',
                        minWidth: '2rem',
                        textAlign: 'center'
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.productId, item.skuId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.productId, item.skuId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--pink-main)',
                          cursor: 'pointer',
                          marginLeft: '1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Total */}
            <div className="cart-total">
              <div className="total-amount">
                Total: ${state.total.toFixed(2)}
              </div>
              <button 
                className="checkout-btn"
                onClick={() => {
                  console.log('Cart: Proceeding to checkout with items:', state.items.length)
                  dispatch({ type: 'TOGGLE_CART' })
                  router.push('/test-checkout')
                }}
              >
                Proceed to Checkout (Test)
              </button>
            </div>
          </>
        )}
      </div>

      {/* Backdrop */}
      {state.isOpen && (
        <div 
          className="modal-backdrop cart-backdrop"
          onClick={closeCart}
        />
      )}
    </>
  )
}