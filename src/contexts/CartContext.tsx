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
  | { type: 'ADD_ITEM'; payload: CartItem & { maxStock: number } }
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
        // Check if adding would exceed stock
        const newQuantity = existingItem.quantity + action.payload.quantity
        if (newQuantity > action.payload.maxStock) {
          // Don't add more than available stock
          return state
        }
        
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.productId && item.skuId === action.payload.skuId
            ? { ...item, quantity: newQuantity }
            : item
        )
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        return { ...state, items: updatedItems, total, itemCount }
      } else {
        // Check if requested quantity exceeds stock
        if (action.payload.quantity > action.payload.maxStock) {
          return state
        }
        
        const { maxStock, ...item } = action.payload
        const updatedItems = [...state.items, item]
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
    
    // Debug logging for incognito mode
    console.log('CartProvider: Loading cart from localStorage')
    
    try {
      // Check if localStorage is available (may not work in incognito mode)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedCart = localStorage.getItem('vobvorot-cart')
        console.log('CartProvider: Saved cart from localStorage:', savedCart)
        
        if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
          const cartData = JSON.parse(savedCart)
          console.log('CartProvider: Parsed cart data:', cartData)
          
          // Only load if cart has items to prevent showing old data
          if (cartData && cartData.items && cartData.items.length > 0) {
            console.log('CartProvider: Loading cart with items:', cartData.items.length)
            dispatch({ type: 'LOAD_CART', payload: cartData })
          } else {
            console.log('CartProvider: Cart is empty, not loading')
            // Clear empty or invalid cart data
            localStorage.removeItem('vobvorot-cart')
          }
        } else {
          console.log('CartProvider: No saved cart found')
        }
      } else {
        console.log('CartProvider: localStorage not available')
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
      // Clear any corrupted data
      try {
        localStorage.removeItem('vobvorot-cart')
        console.log('CartProvider: Cleared corrupted cart data')
      } catch (e) {
        console.error('CartProvider: Failed to clear corrupted data', e)
      }
    }
  }, [])

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (!mounted) return
    try {
      // Only save if localStorage is available
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('vobvorot-cart', JSON.stringify(state))
      }
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
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