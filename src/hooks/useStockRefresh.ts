'use client'

import { useEffect, useRef } from 'react'
import { useStock } from '@/contexts/StockContext'

interface UseStockRefreshOptions {
  interval?: number // Интервал обновления в миллисекундах (по умолчанию 30 секунд)
  onReservation?: boolean // Обновлять ли при резервировании
  enabled?: boolean // Включено ли автообновление
}

export function useStockRefresh(options: UseStockRefreshOptions = {}) {
  const { 
    interval = 30000, // 30 секунд по умолчанию
    onReservation = true,
    enabled = true 
  } = options
  
  const { triggerUpdate } = useStock()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Автоматическое обновление каждые N секунд
  useEffect(() => {
    if (!enabled) return
    
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing stock data')
        triggerUpdate()
      }, interval)
    }
    
    startPolling()
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, triggerUpdate])
  
  // Ручное обновление
  const refreshNow = () => {
    console.log('🔄 Manual stock refresh triggered')
    triggerUpdate()
  }
  
  // Обновление при резервировании (вызывается извне)
  const onReservationComplete = () => {
    if (onReservation) {
      console.log('🔄 Stock refresh after reservation')
      triggerUpdate()
    }
  }
  
  return {
    refreshNow,
    onReservationComplete
  }
}