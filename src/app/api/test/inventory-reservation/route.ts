import { NextRequest, NextResponse } from 'next/server'
import { 
  reserveInventory, 
  cancelReservation, 
  confirmReservation, 
  getAvailableStock,
  cleanupExpiredReservations 
} from '@/lib/inventory'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { action, orderId, items } = await request.json()

    switch (action) {
      case 'reserve':
        if (!orderId || !items) {
          return NextResponse.json({ 
            error: 'Missing orderId or items' 
          }, { status: 400 })
        }

        const reservationResult = await reserveInventory(orderId, items)
        return NextResponse.json(reservationResult)

      case 'cancel':
        if (!orderId) {
          return NextResponse.json({ 
            error: 'Missing orderId' 
          }, { status: 400 })
        }

        const cancelResult = await cancelReservation(orderId)
        return NextResponse.json(cancelResult)

      case 'confirm':
        if (!orderId) {
          return NextResponse.json({ 
            error: 'Missing orderId' 
          }, { status: 400 })
        }

        const confirmResult = await confirmReservation(orderId)
        return NextResponse.json(confirmResult)

      case 'cleanup':
        const cleanupResult = await cleanupExpiredReservations()
        return NextResponse.json(cleanupResult)

      case 'check-stock':
        if (!items) {
          return NextResponse.json({ 
            error: 'Missing items (array of skuIds)' 
          }, { status: 400 })
        }

        const stockResult = await getAvailableStock(items)
        return NextResponse.json({ 
          success: true, 
          stock: stockResult 
        })

      case 'test-full-flow':
        // Тестовый полный поток резервирования
        const testOrderId = `test-order-${Date.now()}`
        
        // Найти первый доступный SKU для теста
        const testSku = await prisma.productSku.findFirst({
          where: {
            stock: { gt: 0 },
            isActive: true
          }
        })

        if (!testSku) {
          return NextResponse.json({
            error: 'No SKUs available for testing'
          }, { status: 400 })
        }

        const testItems = [{ skuId: testSku.id, quantity: 1 }]

        // Шаг 1: Зарезервировать
        const reserve = await reserveInventory(testOrderId, testItems)
        if (!reserve.success) {
          return NextResponse.json({
            error: 'Failed to reserve inventory',
            details: reserve
          })
        }

        // Шаг 2: Проверить что резерв работает
        const stockCheck = await getAvailableStock([testSku.id])
        
        // Шаг 3: Подтвердить резервирование
        const confirm = await confirmReservation(testOrderId)

        // Шаг 4: Проверить финальное состояние
        const finalStock = await getAvailableStock([testSku.id])

        return NextResponse.json({
          success: true,
          testOrderId,
          flow: {
            step1_reserve: reserve,
            step2_stock_after_reserve: stockCheck,
            step3_confirm: confirm,
            step4_final_stock: finalStock
          }
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Available: reserve, cancel, confirm, cleanup, check-stock, test-full-flow' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Inventory reservation test error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Получить текущее состояние резервирований
    const reservations = await prisma.stockReservation.findMany({
      include: {
        sku: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        },
        order: {
          select: {
            orderNumber: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    })

  } catch (error) {
    console.error('Failed to get reservations:', error)
    return NextResponse.json({
      error: 'Failed to get reservations',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}