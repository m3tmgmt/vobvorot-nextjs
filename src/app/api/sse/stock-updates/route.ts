import { NextRequest } from 'next/server'
import { addSSEConnection, removeSSEConnection, broadcastStockUpdate } from '@/lib/sse-broadcaster'

export async function GET(request: NextRequest) {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log('📡 New SSE client connected:', clientId)

  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this client
      addSSEConnection(clientId, controller)
      
      // Send initial connection message
      const data = JSON.stringify({
        type: 'CONNECTED',
        clientId,
        timestamp: Date.now(),
        message: 'Stock updates stream connected'
      })
      
      controller.enqueue(`data: ${data}\n\n`)
      
      // Keep-alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'PING',
            timestamp: Date.now()
          })}\n\n`)
        } catch (error) {
          console.log('📡 Client disconnected:', clientId)
          clearInterval(keepAlive)
          removeSSEConnection(clientId)
        }
      }, 30000)
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        console.log('📡 Client disconnected:', clientId)
        clearInterval(keepAlive)
        removeSSEConnection(clientId)
        try {
          controller.close()
        } catch (error) {
          // Controller already closed
        }
      })
    },
    
    cancel() {
      console.log('📡 Stream cancelled for client:', clientId)
      removeSSEConnection(clientId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientsNotified = broadcastStockUpdate(body)
    
    return Response.json({ 
      success: true, 
      clientsNotified,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('SSE broadcast error:', error)
    return Response.json({ error: 'Failed to broadcast' }, { status: 500 })
  }
}