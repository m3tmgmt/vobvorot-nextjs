import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface StockUpdate {
  skuId: string
  reservedStock: number
  availableStock: number
  timestamp: number
}

interface StockState {
  [skuId: string]: {
    reservedStock: number
    availableStock: number
    lastUpdated: number
  }
}

const STORAGE_KEY = 'stock_reservations'
const UPDATE_INTERVAL = 30000 // 30 seconds

export function useStockUpdates() {
  const [stockUpdates, setStockUpdates] = useState<StockState>({})
  const router = useRouter()

  // Load initial state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Filter out expired reservations (older than 5 minutes)
          const now = Date.now()
          const filtered = Object.entries(parsed).reduce((acc, [skuId, data]) => {
            if (now - (data as any).lastUpdated < 5 * 60 * 1000) {
              acc[skuId] = data as any
            }
            return acc
          }, {} as StockState)
          setStockUpdates(filtered)
        } catch (error) {
          console.error('Error loading stock updates:', error)
        }
      }
    }
  }, [])

  // Save to localStorage when updates change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(stockUpdates).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stockUpdates))
    }
  }, [stockUpdates])

  // Clean up expired reservations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setStockUpdates(prev => {
        const updated = { ...prev }
        let hasChanges = false
        
        Object.entries(updated).forEach(([skuId, data]) => {
          if (now - data.lastUpdated >= 5 * 60 * 1000) {
            delete updated[skuId]
            hasChanges = true
          }
        })
        
        if (hasChanges) {
          // Refresh the page when reservations expire
          router.refresh()
        }
        
        return hasChanges ? updated : prev
      })
    }, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [router])

  const updateStock = useCallback((skuId: string, reservedStock: number, originalStock: number) => {
    setStockUpdates(prev => ({
      ...prev,
      [skuId]: {
        reservedStock,
        availableStock: Math.max(0, originalStock - reservedStock),
        lastUpdated: Date.now()
      }
    }))
  }, [])

  const getAdjustedStock = useCallback((skuId: string, originalStock: number, originalReserved = 0) => {
    const update = stockUpdates[skuId]
    if (update) {
      return {
        reservedStock: update.reservedStock,
        availableStock: update.availableStock
      }
    }
    return {
      reservedStock: originalReserved,
      availableStock: Math.max(0, originalStock - originalReserved)
    }
  }, [stockUpdates])

  const clearStockUpdates = useCallback(() => {
    setStockUpdates({})
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const hasActiveReservations = Object.keys(stockUpdates).length > 0

  return {
    updateStock,
    getAdjustedStock,
    clearStockUpdates,
    hasActiveReservations,
    stockUpdates
  }
}