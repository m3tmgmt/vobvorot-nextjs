import { prisma } from '@/lib/prisma'
// import { shared } from '@/lib/shared-data'

// Mock inventory data for when database is unavailable
const mockInventory = {
  "mock-sku-1": { stock: 10, reservedStock: 0, isActive: true },
  "mock-sku-2": { stock: 5, reservedStock: 0, isActive: true },
  "mock-sku-3": { stock: 3, reservedStock: 0, isActive: true },
  "mock-sku-4": { stock: 8, reservedStock: 0, isActive: true },
  "mock-sku-5": { stock: 2, reservedStock: 0, isActive: true },
  "mock-sku-6": { stock: 4, reservedStock: 0, isActive: true }
}

// Mock reservations storage (in-memory for demo purposes)
let mockReservations: Array<{
  id: string
  skuId: string
  quantity: number
  expiresAt: Date
  status: string
}> = []

export interface StockReservationResult {
  success: boolean
  reservationId?: string
  availableStock?: number
  error?: string
  skuId?: string
  reservedStock?: number
  originalStock?: number
}

export interface InventoryItem {
  skuId: string
  quantity: number
}

/**
 * Reserve stock for multiple SKUs for 5 minutes
 */
export async function reserveStock(
  items: InventoryItem[],
  orderId?: string
): Promise<StockReservationResult[]> {
  const results: StockReservationResult[] = []
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

  // Clean up expired reservations first
  await cleanupExpiredReservations()

  // Process each item
  for (const item of items) {
    try {
      console.log(`Processing reservation for SKU: ${item.skuId}, quantity: ${item.quantity}`)
      
      // Check if this is a mock SKU
      if (item.skuId.startsWith('mock-sku-')) {
        console.log('Processing mock SKU:', item.skuId)
        
        const mockSku = mockInventory[item.skuId as keyof typeof mockInventory]
        if (!mockSku) {
          console.log(`Mock SKU ${item.skuId} not found`)
          results.push({ success: false, error: 'Mock SKU not found' })
          break
        }

        if (!mockSku.isActive) {
          console.log(`Mock SKU ${item.skuId} is not active`)
          results.push({ success: false, error: 'Product is no longer available' })
          break
        }

        const availableStock = mockSku.stock - mockSku.reservedStock
        console.log(`Mock available stock calculation: ${mockSku.stock} - ${mockSku.reservedStock} = ${availableStock}`)

        if (availableStock < item.quantity) {
          console.log(`Mock insufficient stock: need ${item.quantity}, available ${availableStock}`)
          results.push({ 
            success: false, 
            availableStock,
            error: `Only ${availableStock} items available in stock` 
          })
          break
        }

        // Create mock reservation
        const reservationId = `mock-reservation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        mockReservations.push({
          id: reservationId,
          skuId: item.skuId,
          quantity: item.quantity,
          expiresAt: expiresAt,
          status: 'ACTIVE'
        })

        // Update mock reserved stock
        mockSku.reservedStock += item.quantity
        
        console.log(`Created mock reservation:`, reservationId)
        results.push({ 
          success: true, 
          reservationId,
          skuId: item.skuId,
          availableStock: availableStock - item.quantity,
          reservedStock: mockSku.reservedStock,
          originalStock: mockSku.stock
        })
        
        continue
      }
      
      // Process real SKU with database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get current SKU with available stock
        const sku = await tx.productSku.findUnique({
          where: { id: item.skuId },
          include: { reservations: true }
        })

        console.log(`Found SKU:`, sku ? {
          id: sku.id,
          stock: sku.stock,
          reservedStock: sku.reservedStock,
          isActive: sku.isActive,
          reservationsCount: sku.reservations.length
        } : 'NOT FOUND')

        if (!sku) {
          console.log(`SKU ${item.skuId} not found`)
          return { success: false, error: 'Product SKU not found' }
        }

        if (!sku.isActive) {
          console.log(`SKU ${item.skuId} is not active`)
          return { success: false, error: 'Product is no longer available' }
        }

        // Calculate available stock (total stock - reserved stock)
        const availableStock = sku.stock - sku.reservedStock
        console.log(`Available stock calculation: ${sku.stock} - ${sku.reservedStock} = ${availableStock}`)

        if (availableStock < item.quantity) {
          console.log(`Insufficient stock: need ${item.quantity}, available ${availableStock}`)
          return { 
            success: false, 
            availableStock,
            error: `Only ${availableStock} items available in stock` 
          }
        }

        // Create reservation with temporary order for DB compatibility
        let tempOrderId = orderId
        if (!orderId) {
          // Use temp order management for temporary reservations
          const { getTempOrderId } = await import('@/lib/temp-order-manager')
          tempOrderId = await getTempOrderId()
        }
        
        console.log(`Creating reservation with data:`, {
          skuId: item.skuId,
          quantity: item.quantity,
          orderId: tempOrderId,
          isTemporary: !orderId,
          expiresAt,
          status: 'ACTIVE'
        })
        
        const reservation = await tx.stockReservation.create({
          data: {
            skuId: item.skuId,
            quantity: item.quantity,
            orderId: tempOrderId,
            expiresAt,
            status: 'ACTIVE'
          }
        })
        
        console.log(`Created reservation:`, reservation.id)

        // Update reserved stock count
        await tx.productSku.update({
          where: { id: item.skuId },
          data: {
            reservedStock: {
              increment: item.quantity
            }
          }
        })

        return { 
          success: true, 
          reservationId: reservation.id,
          skuId: item.skuId,
          availableStock: availableStock - item.quantity,
          reservedStock: sku.reservedStock + item.quantity,
          originalStock: sku.stock
        }
      })

      results.push(result)

      // If any reservation fails, rollback all previous reservations
      if (!result.success) {
        await rollbackReservations(results.filter(r => r.success && r.reservationId))
        break
      }

    } catch (error) {
      console.error('Error reserving stock for SKU', item.skuId, ':', error)
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
      results.push({ 
        success: false, 
        error: `Failed to reserve stock: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      
      // Rollback all successful reservations
      await rollbackReservations(results.filter(r => r.success && r.reservationId))
      break
    }
  }

  // Update shared data for real-time inventory
  await updateSharedInventory()

  return results
}

/**
 * Release a specific stock reservation
 */
export async function releaseReservation(reservationId: string): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { id: reservationId }
      })

      if (!reservation) return false

      // Decrease reserved stock count
      await tx.productSku.update({
        where: { id: reservation.skuId },
        data: {
          reservedStock: {
            decrement: reservation.quantity
          }
        }
      })

      // Delete reservation
      await tx.stockReservation.delete({
        where: { id: reservationId }
      })
    })

    await updateSharedInventory()
    return true
  } catch (error) {
    console.error('Error releasing reservation:', error)
    return false
  }
}

/**
 * Release all reservations for an order (including temporary checkout reservations)
 */
export async function releaseOrderReservations(orderId: string): Promise<boolean> {
  try {
    const reservations = await prisma.stockReservation.findMany({
      where: { orderId }
    })

    for (const reservation of reservations) {
      await releaseReservation(reservation.id)
    }

    return true
  } catch (error) {
    console.error('Error releasing order reservations:', error)
    return false
  }
}

/**
 * Release all temporary reservations
 */
export async function releaseTemporaryReservations(): Promise<number> {
  try {
    const tempReservations = await prisma.stockReservation.findMany({
      where: { 
        orderId: 'TEMP_RESERVATIONS_ORDER'
      }
    })

    let releasedCount = 0
    for (const reservation of tempReservations) {
      const released = await releaseReservation(reservation.id)
      if (released) releasedCount++
    }

    return releasedCount
  } catch (error) {
    console.error('Error releasing temporary reservations:', error)
    return 0
  }
}

/**
 * Convert reservations to actual sales (after successful payment)
 */
export async function convertReservationToSale(orderId: string): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      const reservations = await tx.stockReservation.findMany({
        where: { orderId }
      })

      for (const reservation of reservations) {
        // Decrease actual stock and reserved stock
        await tx.productSku.update({
          where: { id: reservation.skuId },
          data: {
            stock: {
              decrement: reservation.quantity
            },
            reservedStock: {
              decrement: reservation.quantity
            }
          }
        })

        // Delete reservation
        await tx.stockReservation.delete({
          where: { id: reservation.id }
        })
      }
    })

    await updateSharedInventory()
    return true
  } catch (error) {
    console.error('Error converting reservation to sale:', error)
    return false
  }
}

/**
 * Clean up expired reservations and sync reserved stock
 */
export async function cleanupExpiredReservations(): Promise<number> {
  try {
    // Step 1: Remove expired reservations
    const expiredReservations = await prisma.stockReservation.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    let cleanedCount = 0

    for (const reservation of expiredReservations) {
      const released = await releaseReservation(reservation.id)
      if (released) cleanedCount++
    }

    // Step 2: Sync reservedStock with actual active reservations
    // Get all SKUs with their current reservations
    const skusWithReservations = await prisma.productSku.findMany({
      where: {
        reservedStock: {
          gt: 0
        }
      },
      include: {
        reservations: {
          where: {
            expiresAt: {
              gt: new Date() // Only active (non-expired) reservations
            }
          }
        }
      }
    })

    // Update reservedStock to match actual active reservations
    for (const sku of skusWithReservations) {
      const actualReserved = sku.reservations.reduce((sum, reservation) => sum + reservation.quantity, 0)
      
      if (sku.reservedStock !== actualReserved) {
        await prisma.productSku.update({
          where: { id: sku.id },
          data: { reservedStock: actualReserved }
        })
        console.log(`Synced reservedStock for SKU ${sku.id}: ${sku.reservedStock} -> ${actualReserved}`)
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired reservations`)
    }

    return cleanedCount
  } catch (error) {
    console.error('Error cleaning up expired reservations:', error)
    return 0
  }
}

/**
 * Rollback multiple reservations
 */
async function rollbackReservations(results: StockReservationResult[]): Promise<void> {
  for (const result of results) {
    if (result.reservationId) {
      await releaseReservation(result.reservationId)
    }
  }
}

/**
 * Update shared inventory data for real-time sync
 */
async function updateSharedInventory(): Promise<void> {
  try {
    const skus = await prisma.productSku.findMany({
      select: {
        id: true,
        sku: true,
        stock: true,
        reservedStock: true,
        isActive: true
      }
    })

    // Update shared data - temporarily disabled due to import issue
    // TODO: Fix shared data import and re-enable this functionality
    // shared.inventory = skus.reduce((acc, sku) => {
    //   acc[sku.id] = {
    //     stock: sku.stock,
    //     reservedStock: sku.reservedStock,
    //     availableStock: sku.stock - sku.reservedStock,
    //     isActive: sku.isActive
    //   }
    //   return acc
    // }, {} as Record<string, any>)

  } catch (error) {
    console.error('Error updating shared inventory:', error)
  }
}

/**
 * Get available stock for a SKU (considering reservations)
 */
export async function getAvailableStock(skuId: string): Promise<number> {
  try {
    // Check if this is a mock SKU
    if (skuId.startsWith('mock-sku-') && mockInventory[skuId as keyof typeof mockInventory]) {
      const mockSku = mockInventory[skuId as keyof typeof mockInventory]
      if (!mockSku.isActive) return 0
      return Math.max(0, mockSku.stock - mockSku.reservedStock)
    }

    // Try database for real SKUs
    const sku = await prisma.productSku.findUnique({
      where: { id: skuId },
      select: {
        stock: true,
        reservedStock: true,
        isActive: true
      }
    })

    if (!sku || !sku.isActive) return 0
    
    return Math.max(0, sku.stock - sku.reservedStock)
  } catch (error) {
    console.error('Error getting available stock:', error)
    
    // Fallback to mock data if database fails
    if (mockInventory[skuId as keyof typeof mockInventory]) {
      const mockSku = mockInventory[skuId as keyof typeof mockInventory]
      return mockSku.isActive ? Math.max(0, mockSku.stock - mockSku.reservedStock) : 0
    }
    
    return 0
  }
}

/**
 * Check if items are available for reservation
 */
export async function checkStockAvailability(items: InventoryItem[]): Promise<{
  available: boolean
  unavailableItems: Array<{ skuId: string, requested: number, available: number }>
}> {
  await cleanupExpiredReservations()
  
  const unavailableItems: Array<{ skuId: string, requested: number, available: number }> = []

  for (const item of items) {
    const availableStock = await getAvailableStock(item.skuId)
    
    if (availableStock < item.quantity) {
      unavailableItems.push({
        skuId: item.skuId,
        requested: item.quantity,
        available: availableStock
      })
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems
  }
}

/**
 * Periodic cleanup function to be called by a cron job
 */
export async function scheduleInventoryCleanup(): Promise<void> {
  setInterval(async () => {
    await cleanupExpiredReservations()
  }, 60000) // Run every minute
}