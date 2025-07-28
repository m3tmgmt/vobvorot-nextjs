'use client'

import Link from 'next/link'
import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { UserAccountModal } from '@/components/UserAccountModal'

function NavigationComponent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const { state, dispatch } = useCart()
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist()
  const { findPiece } = usePuzzle()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleCart = () => {
    // Закрываем вишлист если он открыт
    if (wishlistState.isOpen) {
      wishlistDispatch({ type: 'TOGGLE_WISHLIST' })
    }
    dispatch({ type: 'TOGGLE_CART' })
    // Закрываем навигационное меню на мобильных устройствах
    setIsOpen(false)
  }

  const toggleWishlist = () => {
    // Закрываем корзину если она открыта
    if (state.isOpen) {
      dispatch({ type: 'TOGGLE_CART' })
    }
    wishlistDispatch({ type: 'TOGGLE_WISHLIST' })
    // Закрываем навигационное меню на мобильных устройствах
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Menu Button */}
      <button 
        className="nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Navigation Sidebar */}
      <nav className={`navigation ${isOpen ? 'active' : ''}`}>
        <button 
          className="nav-close"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>

        <div className="nav-content">
          <h2 
            className="nav-title glitch" 
            data-logo
            onClick={() => findPiece('nav-secret')}
            style={{ cursor: 'pointer' }}
          >
            vobvorot
          </h2>
          
          <ul className="nav-links">
            <li>
              <button 
                onClick={() => {
                  router.push('/')
                  setIsOpen(false)
                }}
              >
                💒  Main Energy
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  router.push('/exvicpmour')
                  setIsOpen(false)
                }}
              >
                ✨  EXVICPMOUR Store
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  router.push('/products')
                  setIsOpen(false)
                }}
              >
                🛍️  Icons For Sale
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  router.push('/training')
                  setIsOpen(false)
                }}
              >
                🐇  Health, But Hotter
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  router.push('/puzzle')
                  setIsOpen(false)
                }}
              >
                🧩  Secret Hunters
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  router.push('/community')
                  setIsOpen(false)
                }}
              >
                🪽  Creative Ties
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  router.push('/about')
                  setIsOpen(false)
                }}
              >
                💖  Our Story
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  router.push('/your-name-my-pic')
                  setIsOpen(false)
                }}
              >
                💎  Your Name, My Pic
              </button>
            </li>
            <li>
              <button onClick={toggleCart}>
                🛒  Almost Yours
                {mounted && state.itemCount > 0 && (
                  <span className="cart-count">{state.itemCount}</span>
                )}
              </button>
            </li>
            <li>
              <button onClick={toggleWishlist}>
                ✨  Dream List
                {mounted && wishlistState.itemCount > 0 && (
                  <span className="cart-count" style={{ background: 'var(--cyan-accent)' }}>
                    {wishlistState.itemCount}
                  </span>
                )}
              </button>
            </li>
            
            {/* Auth Section - Temporarily hidden */}
            {/* 
            {status !== 'loading' && (
              <>
                {session ? (
                  <li>
                    <button 
                      onClick={() => {
                        setShowAccountModal(true)
                        setIsOpen(false)
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👤  Personal Account
                    </button>
                  </li>
                ) : (
                  <>
                    <li>
                      <button 
                        onClick={() => {
                          router.push('/auth/signin')
                          setIsOpen(false)
                        }}
                      >
                        🔐  Sign In
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          router.push('/auth/signup')
                          setIsOpen(false)
                        }}
                      >
                        ✨  Sign Up
                      </button>
                    </li>
                  </>
                )}
              </>
            )}
            */}
          </ul>
        </div>
      </nav>

      {/* Backdrop */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* User Account Modal */}
      <UserAccountModal 
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </>
  )
}

export const Navigation = memo(NavigationComponent)