'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

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

  // BroadcastChannel для синхронизации между вкладками
  useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = new BroadcastChannel('vobvorot-stock-updates')
    
    // Слушать обновления от других вкладок
    channel.addEventListener('message', (event) => {
      if (event.data.type === 'STOCK_UPDATE') {
        console.log('📡 Received stock update broadcast from another tab:', event.data.timestamp)
        setLastUpdate(event.data.timestamp)
        setShouldRefetch(true)
      }
    })

    return () => {
      channel.close()
    }
  }, [])

  const triggerUpdate = useCallback(() => {
    const timestamp = Date.now()
    console.log('📊 Stock update triggered:', timestamp)
    setLastUpdate(timestamp)
    setShouldRefetch(true)
    
    // Отправить обновление на все вкладки
    if (typeof window !== 'undefined') {
      try {
        const channel = new BroadcastChannel('vobvorot-stock-updates')
        channel.postMessage({ 
          type: 'STOCK_UPDATE', 
          timestamp,
          source: 'triggerUpdate'
        })
        console.log('📡 Stock update broadcasted to all tabs')
      } catch (error) {
        console.warn('Failed to broadcast stock update:', error)
      }
    }
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