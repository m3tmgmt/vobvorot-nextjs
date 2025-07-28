'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  productId: string
  skuId: string
  quantity: number
  productName: string
  price: number
  weight?: number // Вес единицы товара в кг для расчета доставки
  image?: string
  size?: string
  color?: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isOpen: boolean
  reservationStatus?: 'none' | 'reserving' | 'reserved' | 'failed'
  reservationExpiry?: Date
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
  | { type: 'CLEAN_INVALID_ITEMS'; payload: { skuIdsToRemove: string[] } }
  | { type: 'UPDATE_INVALID_QUANTITIES'; payload: { updates: Array<{ skuId: string; maxQuantity: number }> } }
  | { type: 'SET_RESERVATION_STATUS'; payload: { status: 'none' | 'reserving' | 'reserved' | 'failed'; expiry?: Date } }

interface CartContextType {
  state: CartState
  dispatch: React.Dispatch<CartAction>
  validateCart: () => Promise<void>
  reserveCart: () => Promise<boolean>
  releaseReservation: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

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

    case 'CLEAN_INVALID_ITEMS': {
      const updatedItems = state.items.filter(item => !action.payload.skuIdsToRemove.includes(item.skuId))
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: updatedItems, total, itemCount }
    }

    case 'UPDATE_INVALID_QUANTITIES': {
      const updatedItems = state.items.map(item => {
        const update = action.payload.updates.find(u => u.skuId === item.skuId)
        if (update && item.quantity > update.maxQuantity) {
          return { ...item, quantity: update.maxQuantity }
        }
        return item
      })
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: updatedItems, total, itemCount }
    }

    case 'SET_RESERVATION_STATUS': {
      return { 
        ...state, 
        reservationStatus: action.payload.status,
        reservationExpiry: action.payload.expiry
      }
    }

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
    isOpen: false,
    reservationStatus: 'none'
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

  // Validate cart function
  const validateCart = React.useCallback(async () => {
    if (state.items.length === 0) return

    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.items.map(item => ({
            skuId: item.skuId,
            quantity: item.quantity,
            productId: item.productId
          }))
        })
      })

      if (!response.ok) {
        console.error('Cart validation failed:', response.status)
        return
      }

      const result = await response.json()
      const { validationResults } = result.data

      // Process validation results
      const itemsToRemove: string[] = []
      const quantityUpdates: Array<{ skuId: string; maxQuantity: number }> = []

      validationResults.forEach((result: any) => {
        if (!result.isValid) {
          if (result.shouldRemove) {
            itemsToRemove.push(result.skuId)
          } else if (result.shouldUpdate && result.maxQuantity !== undefined) {
            quantityUpdates.push({
              skuId: result.skuId,
              maxQuantity: result.maxQuantity
            })
          }
        }
      })

      // Apply updates
      if (itemsToRemove.length > 0) {
        dispatch({ type: 'CLEAN_INVALID_ITEMS', payload: { skuIdsToRemove: itemsToRemove } })
      }

      if (quantityUpdates.length > 0) {
        dispatch({ type: 'UPDATE_INVALID_QUANTITIES', payload: { updates: quantityUpdates } })
      }

      // Show user notification if items were removed/updated
      if (itemsToRemove.length > 0 || quantityUpdates.length > 0) {
        console.log('Cart updated:', {
          removedItems: itemsToRemove.length,
          updatedQuantities: quantityUpdates.length
        })
      }

    } catch (error) {
      console.error('Failed to validate cart:', error)
    }
  }, [state.items])

  // Reserve cart items
  const reserveCart = React.useCallback(async (): Promise<boolean> => {
    if (state.items.length === 0) return false

    try {
      dispatch({ type: 'SET_RESERVATION_STATUS', payload: { status: 'reserving' } })

      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      const response = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: state.items.map(item => ({
            skuId: item.skuId,
            quantity: item.quantity
          })),
          sessionId
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const expiry = new Date(result.expiresAt)
        dispatch({ 
          type: 'SET_RESERVATION_STATUS', 
          payload: { status: 'reserved', expiry } 
        })
        
        // Store session ID for cleanup
        sessionStorage.setItem('cartReservationSessionId', sessionId)
        return true
      } else {
        dispatch({ type: 'SET_RESERVATION_STATUS', payload: { status: 'failed' } })
        return false
      }
    } catch (error) {
      console.error('Cart reservation error:', error)
      dispatch({ type: 'SET_RESERVATION_STATUS', payload: { status: 'failed' } })
      return false
    }
  }, [state.items])

  // Release cart reservation
  const releaseReservation = React.useCallback(async (): Promise<void> => {
    const sessionId = sessionStorage.getItem('cartReservationSessionId')
    if (!sessionId) return

    try {
      await fetch('/api/cart/reserve', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      })

      dispatch({ type: 'SET_RESERVATION_STATUS', payload: { status: 'none' } })
      sessionStorage.removeItem('cartReservationSessionId')
    } catch (error) {
      console.error('Failed to release reservation:', error)
    }
  }, [])

  // Validate cart periodically
  useEffect(() => {
    if (!mounted || state.items.length === 0) return

    // Validate cart every 5 minutes
    const interval = setInterval(validateCart, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [mounted, state.items.length, validateCart])

  return (
    <CartContext.Provider value={{ state, dispatch, validateCart, reserveCart, releaseReservation }}>
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