// Global store for active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()

export function addSSEConnection(clientId: string, controller: ReadableStreamDefaultController) {
  connections.set(clientId, controller)
  console.log('📡 SSE client connected:', clientId, 'Total clients:', connections.size)
}

export function removeSSEConnection(clientId: string) {
  connections.delete(clientId)
  console.log('📡 SSE client disconnected:', clientId, 'Remaining clients:', connections.size)
}

// Function to broadcast stock updates to all connected clients
export function broadcastStockUpdate(data: {
  type: 'STOCK_UPDATE' | 'ORDER_CREATED'
  productIds?: string[]
  orderNumber?: string
  timestamp: number
}) {
  const message = JSON.stringify(data)
  const eventData = `data: ${message}\n\n`
  
  console.log('📡 Broadcasting to', connections.size, 'SSE clients:', data.type)
  
  // Send to all connected clients
  connections.forEach((controller, clientId) => {
    try {
      controller.enqueue(eventData)
    } catch (error) {
      console.log('📡 Failed to send to client:', clientId, error instanceof Error ? error.message : String(error))
      connections.delete(clientId)
    }
  })
  
  return connections.size
}