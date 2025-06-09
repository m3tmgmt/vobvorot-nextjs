'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { usePuzzle } from '@/contexts/PuzzleContext'

export function Navigation() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
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
  }

  const toggleWishlist = () => {
    // Закрываем корзину если она открыта
    if (state.isOpen) {
      dispatch({ type: 'TOGGLE_CART' })
    }
    wishlistDispatch({ type: 'TOGGLE_WISHLIST' })
  }

  return (
    <>
      {/* Hamburger Menu Button */}
      <button 
        className="nav-toggle"
        onClick={() => setIsOpen(true)}
      >
        ☰
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
                  console.log('Navigating to /')
                  try {
                    router.push('/')
                  } catch (error) {
                    window.location.href = '/'
                  }
                  setIsOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.1rem',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  borderLeft: '2px solid transparent',
                  paddingLeft: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Home
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  console.log('Navigating to /exvicpmour')
                  try {
                    router.push('/exvicpmour')
                  } catch (error) {
                    window.location.href = '/exvicpmour'
                  }
                  setIsOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.1rem',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  borderLeft: '2px solid transparent',
                  paddingLeft: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                EXVICPMOUR Store
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  console.log('Navigating to /products')
                  try {
                    router.push('/products')
                  } catch (error) {
                    window.location.href = '/products'
                  }
                  setIsOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.1rem',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  borderLeft: '2px solid transparent',
                  paddingLeft: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                All Products
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  console.log('Navigating to /training')
                  try {
                    router.push('/training')
                  } catch (error) {
                    window.location.href = '/training'
                  }
                  setIsOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.1rem',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  borderLeft: '2px solid transparent',
                  paddingLeft: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Training Programs
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  console.log('Navigating to /puzzle')
                  try {
                    router.push('/puzzle')
                  } catch (error) {
                    window.location.href = '/puzzle'
                  }
                  setIsOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.1rem',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  borderLeft: '2px solid transparent',
                  paddingLeft: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Puzzle Game
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  console.log('Navigating to /community')
                  try {
                    router.push('/community')
                  } catch (error) {
                    window.location.href = '/community'
                  }
                  setIsOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.1rem',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  borderLeft: '2px solid transparent',
                  paddingLeft: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Community
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  console.log('Navigating to /about')
                  try {
                    router.push('/about')
                  } catch (error) {
                    window.location.href = '/about'
                  }
                  setIsOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.1rem',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  borderLeft: '2px solid transparent',
                  paddingLeft: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                About
              </button>
            </li>
            <li>
              <button onClick={toggleCart} style={{
                background: 'none',
                border: 'none',
                color: 'var(--white)',
                fontSize: '1.1rem',
                padding: '0.5rem 0',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                borderLeft: '2px solid transparent',
                paddingLeft: '1rem',
                transition: 'all 0.3s ease'
              }}>
                🛒 Cart
                {mounted && state.itemCount > 0 && (
                  <span className="cart-count">{state.itemCount}</span>
                )}
              </button>
            </li>
            <li>
              <button onClick={toggleWishlist} style={{
                background: 'none',
                border: 'none',
                color: 'var(--white)',
                fontSize: '1.1rem',
                padding: '0.5rem 0',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                borderLeft: '2px solid transparent',
                paddingLeft: '1rem',
                transition: 'all 0.3s ease'
              }}>
                ✨ Wishlist
                {mounted && wishlistState.itemCount > 0 && (
                  <span className="cart-count" style={{ background: 'var(--cyan-accent)' }}>
                    {wishlistState.itemCount}
                  </span>
                )}
              </button>
            </li>
            
            {/* Auth Section */}
            {status !== 'loading' && (
              <>
                {session ? (
                  <>
                    <li>
                      <button 
                        onClick={() => {
                          router.push('/account')
                          setIsOpen(false)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--white)',
                          fontSize: '1.1rem',
                          padding: '0.5rem 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          borderLeft: '2px solid transparent',
                          paddingLeft: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        👤 {session.user.name || session.user.email}
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          router.push('/account/orders')
                          setIsOpen(false)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cyan-accent)',
                          fontSize: '1.1rem',
                          padding: '0.5rem 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          borderLeft: '2px solid transparent',
                          paddingLeft: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        📦 My Orders
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          signOut({ callbackUrl: '/' })
                          setIsOpen(false)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--pink-neon)',
                          fontSize: '1.1rem',
                          padding: '0.5rem 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          borderLeft: '2px solid transparent',
                          paddingLeft: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🚪 Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <button 
                        onClick={() => {
                          router.push('/auth/signin')
                          setIsOpen(false)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cyan-accent)',
                          fontSize: '1.1rem',
                          padding: '0.5rem 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          borderLeft: '2px solid transparent',
                          paddingLeft: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🔐 Sign In
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          router.push('/auth/signup')
                          setIsOpen(false)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--green-neon)',
                          fontSize: '1.1rem',
                          padding: '0.5rem 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          borderLeft: '2px solid transparent',
                          paddingLeft: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        ✨ Sign Up
                      </button>
                    </li>
                  </>
                )}
              </>
            )}
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
    </>
  )
}