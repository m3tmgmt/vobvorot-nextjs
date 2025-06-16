import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Константы
const RESERVATION_DURATION_MINUTES = 5
const MAX_RETRY_ATTEMPTS = 3

// Интерфейсы
export interface ReservationItem {
  skuId: string
  quantity: number
}

export interface ReservationResult {
  success: boolean
  reservationId?: string
  error?: string
  insufficientStock?: Array<{
    skuId: string
    requested: number
    available: number
  }>
}

export interface AvailableStock {
  skuId: string
  totalStock: number
  reservedStock: number
  availableStock: number
}

// Получить доступные остатки для SKU
export async function getAvailableStock(skuIds: string[]): Promise<AvailableStock[]> {
  const skus = await prisma.productSku.findMany({
    where: {
      id: { in: skuIds },
      isActive: true
    },
    select: {
      id: true,
      stock: true,
      reservedStock: true
    }
  })

  return skus.map(sku => ({
    skuId: sku.id,
    totalStock: sku.stock,
    reservedStock: sku.reservedStock,
    availableStock: Math.max(0, sku.stock - sku.reservedStock)
  }))
}

// Резервировать товары для заказа (атомарная операция)
export async function reserveInventory(
  orderId: string, 
  items: ReservationItem[]
): Promise<ReservationResult> {
  let retryCount = 0
  
  while (retryCount < MAX_RETRY_ATTEMPTS) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Проверить доступные остатки
        const skuIds = items.map(item => item.skuId)
        const availableStocks = await tx.productSku.findMany({
          where: {
            id: { in: skuIds },
            isActive: true
          },
          select: {
            id: true,
            stock: true,
            reservedStock: true,
            product: {
              select: {
                name: true,
                isActive: true
              }
            }
          }
        })

        // 2. Проверить достаточность остатков
        const insufficientStock: Array<{
          skuId: string
          requested: number
          available: number
        }> = []

        for (const item of items) {
          const sku = availableStocks.find(s => s.id === item.skuId)
          
          if (!sku || !sku.product.isActive) {
            insufficientStock.push({
              skuId: item.skuId,
              requested: item.quantity,
              available: 0
            })
            continue
          }

          const availableStock = sku.stock - sku.reservedStock
          if (availableStock < item.quantity) {
            insufficientStock.push({
              skuId: item.skuId,
              requested: item.quantity,
              available: availableStock
            })
          }
        }

        if (insufficientStock.length > 0) {
          return {
            success: false,
            insufficientStock,
            error: 'Insufficient stock for some items'
          }
        }

        // 3. Создать резервирования
        const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000)
        const reservations = []

        for (const item of items) {
          // Обновить reservedStock в ProductSku
          await tx.productSku.update({
            where: { id: item.skuId },
            data: {
              reservedStock: {
                increment: item.quantity
              }
            }
          })

          // Создать запись резервирования
          const reservation = await tx.stockReservation.create({
            data: {
              skuId: item.skuId,
              orderId,
              quantity: item.quantity,
              expiresAt,
              status: 'ACTIVE'
            }
          })

          reservations.push(reservation)
        }

        console.log('✅ Inventory reserved successfully', {
          orderId,
          itemsCount: items.length,
          expiresAt: expiresAt.toISOString()
        })

        return {
          success: true,
          reservationId: reservations[0]?.id || 'batch',
          reservations
        }
      }, {
        isolationLevel: 'Serializable', // Максимальная изоляция для предотвращения race conditions
        timeout: 10000 // 10 секунд timeout
      })

      return result
      
    } catch (error) {
      retryCount++
      console.error(`❌ Reservation attempt ${retryCount} failed:`, error)
      
      if (retryCount >= MAX_RETRY_ATTEMPTS) {
        return {
          success: false,
          error: `Failed to reserve inventory after ${MAX_RETRY_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`
        }
      }
      
      // Экспоненциальная задержка перед повтором
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100))
    }
  }

  return {
    success: false,
    error: 'Maximum retry attempts exceeded'
  }
}

// Подтвердить резервирование (конвертировать в продажу)
export async function confirmReservation(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Найти все активные резервирования для заказа
      const reservations = await tx.stockReservation.findMany({
        where: {
          orderId,
          status: 'ACTIVE'
        }
      })

      if (reservations.length === 0) {
        throw new Error('No active reservations found for order')
      }

      // Для каждого резервирования:
      for (const reservation of reservations) {
        // 1. Уменьшить общий stock
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

        // 2. Отметить резервирование как подтвержденное
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: {
            status: 'CONFIRMED'
          }
        })
      }

      console.log('✅ Reservations confirmed successfully', {
        orderId,
        reservationsCount: reservations.length
      })
    })

    return { success: true }
    
  } catch (error) {
    console.error('❌ Failed to confirm reservation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Отменить резервирование (освободить товары)
export async function cancelReservation(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Найти все активные резервирования для заказа
      const reservations = await tx.stockReservation.findMany({
        where: {
          orderId,
          status: 'ACTIVE'
        }
      })

      // Для каждого резервирования:
      for (const reservation of reservations) {
        // 1. Уменьшить reservedStock (освободить товар)
        await tx.productSku.update({
          where: { id: reservation.skuId },
          data: {
            reservedStock: {
              decrement: reservation.quantity
            }
          }
        })

        // 2. Отметить резервирование как отмененное
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: {
            status: 'CANCELLED'
          }
        })
      }

      console.log('✅ Reservations cancelled successfully', {
        orderId,
        reservationsCount: reservations.length
      })
    })

    return { success: true }
    
  } catch (error) {
    console.error('❌ Failed to cancel reservation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Очистить просроченные резервирования
export async function cleanupExpiredReservations(): Promise<{ 
  success: boolean
  cleanedCount: number
  error?: string 
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Найти просроченные активные резервирования
      const expiredReservations = await tx.stockReservation.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: new Date()
          }
        }
      })

      // Для каждого просроченного резервирования:
      for (const reservation of expiredReservations) {
        // 1. Уменьшить reservedStock (освободить товар)
        await tx.productSku.update({
          where: { id: reservation.skuId },
          data: {
            reservedStock: {
              decrement: reservation.quantity
            }
          }
        })

        // 2. Отметить резервирование как просроченное
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: {
            status: 'EXPIRED'
          }
        })
      }

      console.log('✅ Expired reservations cleaned up', {
        cleanedCount: expiredReservations.length,
        cleanedAt: new Date().toISOString()
      })

      return expiredReservations.length
    })

    return {
      success: true,
      cleanedCount: result
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup expired reservations:', error)
    return {
      success: false,
      cleanedCount: 0,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Проверить наличие активных резервирований для заказа
export async function hasActiveReservations(orderId: string): Promise<boolean> {
  const count = await prisma.stockReservation.count({
    where: {
      orderId,
      status: 'ACTIVE'
    }
  })
  
  return count > 0
}

// Получить информацию о резервированиях заказа
export async function getOrderReservations(orderId: string) {
  return await prisma.stockReservation.findMany({
    where: { orderId },
    include: {
      sku: {
        include: {
          product: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Автоматическая архивация товаров с нулевым остатком
export async function archiveZeroStockProducts(): Promise<{
  success: boolean
  archivedCount: number
  error?: string
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Найти товары, у которых все SKU имеют нулевой доступный остаток
      const products = await tx.product.findMany({
        where: {
          isActive: true
        },
        include: {
          skus: {
            select: {
              stock: true,
              reservedStock: true
            }
          }
        }
      })

      const productsToArchive = products.filter(product => {
        const hasAvailableStock = product.skus.some(sku => 
          (sku.stock - sku.reservedStock) > 0
        )
        return !hasAvailableStock
      })

      // Архивировать товары
      for (const product of productsToArchive) {
        await tx.product.update({
          where: { id: product.id },
          data: { isActive: false }
        })
      }

      console.log('✅ Zero stock products archived', {
        archivedCount: productsToArchive.length,
        archivedAt: new Date().toISOString()
      })

      return productsToArchive.length
    })

    return {
      success: true,
      archivedCount: result
    }
    
  } catch (error) {
    console.error('❌ Failed to archive zero stock products:', error)
    return {
      success: false,
      archivedCount: 0,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}