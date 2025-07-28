import { prisma } from '@/lib/prisma'

/**
 * Get or create a temporary order for reservations
 */
export async function getTempOrderId(): Promise<string> {
  const tempOrderId = 'TEMP_RESERVATIONS_ORDER'
  
  try {
    // Check if temp order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: tempOrderId }
    })
    
    if (existingOrder) {
      return tempOrderId
    }
    
    // Create temp order
    await prisma.order.create({
      data: {
        id: tempOrderId,
        orderNumber: 'TEMP-RESERVATIONS',
        status: 'PENDING',
        shippingName: 'Temporary Reservations',
        shippingEmail: 'temp@vobvorot.com',
        shippingAddress: 'Temporary',
        shippingCity: 'Temporary',
        shippingCountry: 'US',
        shippingZip: '00000',
        subtotal: 0,
        shippingCost: 0,
        total: 0,
        currency: 'USD'
      }
    })
    
    console.log('Created temporary order for reservations:', tempOrderId)
    return tempOrderId
    
  } catch (error) {
    console.error('Error managing temp order:', error)
    // Fallback to a unique ID
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Clean up temporary reservations older than 6 hours
 */
export async function cleanupTempReservations(): Promise<void> {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
    
    await prisma.stockReservation.deleteMany({
      where: {
        orderId: 'TEMP_RESERVATIONS_ORDER',
        createdAt: { lt: sixHoursAgo }
      }
    })
    
    console.log('Cleaned up old temporary reservations')
  } catch (error) {
    console.error('Error cleaning up temp reservations:', error)
  }
}