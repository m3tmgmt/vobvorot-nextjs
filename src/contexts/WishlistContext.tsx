'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface WishlistItem {
  id: string
  name: string
  slug: string
  price: number
  brand?: string
  images: { url: string; alt?: string }[]
  category?: any
  skus?: any[]
  addedAt: string
}

interface WishlistState {
  items: WishlistItem[]
  itemCount: number
  isOpen: boolean
}

type WishlistAction =
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'TOGGLE_WISHLIST' }
  | { type: 'CLOSE_WISHLIST' }
  | { type: 'LOAD_WISHLIST'; payload: WishlistItem[] }
  | { type: 'SYNC_FROM_DB'; payload: WishlistItem[] }

const initialState: WishlistState = {
  items: [],
  itemCount: 0,
  isOpen: false
}

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        // Item already in wishlist, don't add duplicate
        return state
      }

      const newItems = [...state.items, action.payload]
      return {
        ...state,
        items: newItems,
        itemCount: newItems.length
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.productId)
      return {
        ...state,
        items: newItems,
        itemCount: newItems.length
      }
    }

    case 'TOGGLE_WISHLIST':
      return {
        ...state,
        isOpen: !state.isOpen
      }

    case 'CLOSE_WISHLIST':
      return {
        ...state,
        isOpen: false
      }

    case 'LOAD_WISHLIST':
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.length
      }

    case 'SYNC_FROM_DB':
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.length
      }

    default:
      return state
  }
}

const WishlistContext = createContext<{
  state: WishlistState
  dispatch: React.Dispatch<WishlistAction>
  addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
} | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = React.useState(false)
  const [synced, setSynced] = React.useState(false)
  const [state, dispatch] = useReducer(wishlistReducer, initialState)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedWishlist = localStorage.getItem('vobvorot-wishlist')
    if (savedWishlist) {
      try {
        const wishlistItems = JSON.parse(savedWishlist)
        dispatch({ type: 'LOAD_WISHLIST', payload: wishlistItems })
      } catch (error) {
        console.error('Failed to load wishlist from localStorage:', error)
      }
    }
  }, [])

  // Save wishlist to localStorage only (database sync disabled)
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('vobvorot-wishlist', JSON.stringify(state.items))
  }, [state.items, mounted])

  const addToWishlist = async (item: Omit<WishlistItem, 'addedAt'>) => {
    const wishlistItem = {
      ...item,
      addedAt: new Date().toISOString()
    }
    
    dispatch({
      type: 'ADD_ITEM',
      payload: wishlistItem
    })

    // Database sync disabled
    // if (session?.user) { ... }
  }

  const removeFromWishlist = async (productId: string) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { productId }
    })

    // Database sync disabled
    // if (session?.user) { ... }
  }

  const isInWishlist = (productId: string) => {
    return state.items.some(item => item.id === productId)
  }

  const value = {
    state,
    dispatch,
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}