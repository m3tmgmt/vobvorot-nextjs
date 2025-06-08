'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  productId: string
  skuId: string
  quantity: number
  productName: string
  price: number
  image?: string
  size?: string
  color?: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; skuId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; skuId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.productId === action.payload.productId && item.skuId === action.payload.skuId
      )

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.productId && item.skuId === action.payload.skuId
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        return { ...state, items: updatedItems, total, itemCount }
      } else {
        const updatedItems = [...state.items, action.payload]
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        return { ...state, items: updatedItems, total, itemCount }
      }
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(
        item => !(item.productId === action.payload.productId && item.skuId === action.payload.skuId)
      )
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: updatedItems, total, itemCount }
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload })
      }
      
      const updatedItems = state.items.map(item =>
        item.productId === action.payload.productId && item.skuId === action.payload.skuId
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: updatedItems, total, itemCount }
    }

    case 'CLEAR_CART':
      return { ...state, items: [], total: 0, itemCount: 0 }

    case 'LOAD_CART':
      return { ...action.payload, isOpen: false }

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen }

    case 'OPEN_CART':
      return { ...state, isOpen: true }

    case 'CLOSE_CART':
      return { ...state, isOpen: false }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
    isOpen: false
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedCart = localStorage.getItem('vobvorot-cart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartData })
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error)
      }
    }
  }, [])

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('vobvorot-cart', JSON.stringify(state))
  }, [state, mounted])



  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}