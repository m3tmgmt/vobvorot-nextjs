'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface StockContextType {
  lastUpdate: number
  triggerUpdate: () => void
  shouldRefetch: boolean
  resetRefetch: () => void
}

const StockContext = createContext<StockContextType | undefined>(undefined)

export function StockProvider({ children }: { children: ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [shouldRefetch, setShouldRefetch] = useState(false)

  const triggerUpdate = useCallback(() => {
    console.log('📊 Stock update triggered')
    setLastUpdate(Date.now())
    setShouldRefetch(true)
  }, [])

  const resetRefetch = useCallback(() => {
    setShouldRefetch(false)
  }, [])

  return (
    <StockContext.Provider value={{ lastUpdate, triggerUpdate, shouldRefetch, resetRefetch }}>
      {children}
    </StockContext.Provider>
  )
}

export function useStock() {
  const context = useContext(StockContext)
  if (!context) {
    throw new Error('useStock must be used within StockProvider')
  }
  return context
}