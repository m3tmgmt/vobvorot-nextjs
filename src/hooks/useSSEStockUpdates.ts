'use client'

import { useEffect, useRef } from 'react'
import { useStock } from '@/contexts/StockContext'

export function useSSEStockUpdates() {
  const { triggerUpdate } = useStock()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return

    const connectSSE = () => {
      try {
        console.log('📡 Connecting to SSE stock updates stream...')
        
        eventSourceRef.current = new EventSource('/api/sse/stock-updates')
        
        eventSourceRef.current.onopen = () => {
          console.log('📡 SSE connection opened')
          reconnectAttempts.current = 0
        }
        
        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📡 SSE message received:', data)
            
            switch (data.type) {
              case 'CONNECTED':
                console.log('📡 SSE connected successfully:', data.clientId)
                break
                
              case 'STOCK_UPDATE':
                console.log('📡 Stock update received via SSE:', data)
                triggerUpdate()
                
                // Also dispatch custom event for immediate UI updates
                window.dispatchEvent(new CustomEvent('vobvorot-sse-stock-update', {
                  detail: data
                }))
                break
                
              case 'ORDER_CREATED':
                console.log('📡 Order created notification via SSE:', data)
                triggerUpdate()
                
                window.dispatchEvent(new CustomEvent('vobvorot-order-created', {
                  detail: { 
                    orderNumber: data.orderNumber,
                    timestamp: data.timestamp 
                  }
                }))
                break
                
              case 'RESERVATION_CREATED':
                console.log('📡 Reservation created notification via SSE:', data)
                triggerUpdate()
                
                window.dispatchEvent(new CustomEvent('vobvorot-reservation-created', {
                  detail: { 
                    orderNumber: data.orderNumber,
                    reservedItems: data.reservedItems,
                    timestamp: data.timestamp 
                  }
                }))
                break
                
              case 'PING':
                // Keep-alive ping, no action needed
                break
                
              default:
                console.log('📡 Unknown SSE message type:', data.type)
            }
          } catch (error) {
            console.error('📡 Failed to parse SSE message:', error)
          }
        }
        
        eventSourceRef.current.onerror = (error) => {
          console.error('📡 SSE connection error:', error)
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
          }
          
          // Attempt reconnection with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
            console.log(`📡 Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++
              connectSSE()
            }, delay)
          } else {
            console.error('📡 Max SSE reconnection attempts reached, giving up')
          }
        }
        
      } catch (error) {
        console.error('📡 Failed to create SSE connection:', error)
      }
    }

    // Start the connection
    connectSSE()

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('📡 Closing SSE connection')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [triggerUpdate])

  return {
    isConnected: typeof EventSource !== 'undefined' && eventSourceRef.current?.readyState === EventSource.OPEN
  }
}