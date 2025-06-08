'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'

export function FloatingCartIcons() {
  const [mounted, setMounted] = useState(false)
  const { state: cartState, dispatch: cartDispatch } = useCart()
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleCart = () => {
    // Закрываем вишлист если он открыт
    if (wishlistState.isOpen) {
      wishlistDispatch({ type: 'TOGGLE_WISHLIST' })
    }
    cartDispatch({ type: 'TOGGLE_CART' })
  }

  const toggleWishlist = () => {
    // Закрываем корзину если она открыта
    if (cartState.isOpen) {
      cartDispatch({ type: 'TOGGLE_CART' })
    }
    wishlistDispatch({ type: 'TOGGLE_WISHLIST' })
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1002,
      display: 'flex',
      gap: '1rem',
      flexDirection: 'column'
    }}>
      {/* Cart Icon */}
      <button
        onClick={toggleCart}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, var(--pink-main), var(--purple-accent))',
          border: 'none',
          color: 'white',
          fontSize: '1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(255,107,157,0.4)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(255,107,157,0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,157,0.4)'
        }}
      >
        🛒
        {cartState.itemCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'var(--green-neon)',
            color: 'var(--black)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.8rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            boxShadow: '0 0 10px rgba(57,255,20,0.5)',
            animation: cartState.itemCount > 0 ? 'pulse 1.5s infinite' : 'none'
          }}>
            {cartState.itemCount}
          </span>
        )}
      </button>

      {/* Wishlist Icon */}
      <button
        onClick={toggleWishlist}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, var(--cyan-accent), var(--purple-accent))',
          border: 'none',
          color: 'white',
          fontSize: '1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,245,255,0.4)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,245,255,0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,245,255,0.4)'
        }}
      >
        ✨
        {wishlistState.itemCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'var(--green-neon)',
            color: 'var(--black)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.8rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            boxShadow: '0 0 10px rgba(57,255,20,0.5)',
            animation: wishlistState.itemCount > 0 ? 'pulse 1.5s infinite' : 'none'
          }}>
            {wishlistState.itemCount}
          </span>
        )}
      </button>
    </div>
  )
}