import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'cleanup-orders':
        // Очистить все заказы и связанные данные
        const orderDeleteResult = await prisma.$transaction(async (tx) => {
          // Удалить OrderItem сначала (foreign key)
          const deletedOrderItems = await tx.orderItem.deleteMany()
          
          // Удалить заказы
          const deletedOrders = await tx.order.deleteMany()
          
          return {
            deletedOrderItems: deletedOrderItems.count,
            deletedOrders: deletedOrders.count
          }
        })

        return NextResponse.json({
          success: true,
          action: 'cleanup-orders',
          result: orderDeleteResult,
          message: `Удалено ${orderDeleteResult.deletedOrders} заказов и ${orderDeleteResult.deletedOrderItems} позиций`
        })

      case 'cleanup-test-products':
        // Очистить тестовые продукты (имена содержащие цифры или тестовые названия)
        const testProductsResult = await prisma.$transaction(async (tx) => {
          // Найти тестовые продукты (с числовыми именами или содержащие "test", "44444", "99999", "88", "333")
          const testProducts = await tx.product.findMany({
            where: {
              OR: [
                { name: { contains: "99999" } },
                { name: { contains: "88" } },
                { name: { contains: "44444" } },
                { name: { contains: "333" } },
                { name: { contains: "test" } },
                { name: { contains: "Test" } },
                { name: { contains: "TEST" } },
                { name: { in: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] } } // простые числовые имена
              ]
            },
            include: { 
              skus: true, 
              images: true 
            }
          })

          const testProductIds = testProducts.map(p => p.id)
          
          if (testProductIds.length === 0) {
            return { deletedProducts: 0, deletedSkus: 0, deletedImages: 0 }
          }

          // Удалить связанные данные
          const deletedImages = await tx.productImage.deleteMany({
            where: { productId: { in: testProductIds } }
          })

          const deletedSkus = await tx.productSku.deleteMany({
            where: { productId: { in: testProductIds } }
          })

          const deletedProducts = await tx.product.deleteMany({
            where: { id: { in: testProductIds } }
          })

          return {
            deletedProducts: deletedProducts.count,
            deletedSkus: deletedSkus.count,
            deletedImages: deletedImages.count,
            testProductNames: testProducts.map(p => p.name)
          }
        })

        return NextResponse.json({
          success: true,
          action: 'cleanup-test-products',
          result: testProductsResult,
          message: `Удалено ${testProductsResult.deletedProducts} тестовых продуктов`
        })

      case 'cleanup-reservations':
        // Очистить все резервирования
        const reservationsResult = await prisma.stockReservation.deleteMany()

        return NextResponse.json({
          success: true,
          action: 'cleanup-reservations',
          result: { deletedReservations: reservationsResult.count },
          message: `Удалено ${reservationsResult.count} резервирований`
        })

      case 'cleanup-settings':
        // Очистить настройки (кроме критически важных системных)
        const settingsResult = await prisma.setting.deleteMany({
          where: {
            key: {
              notIn: [
                'system_initialized',
                'database_version',
                'app_version'
              ]
            }
          }
        })

        return NextResponse.json({
          success: true,
          action: 'cleanup-settings',
          result: { deletedSettings: settingsResult.count },
          message: `Удалено ${settingsResult.count} настроек`
        })

      case 'reset-sku-counters':
        // Сбросить счетчики SKU в ProductSku
        const skuResetResult = await prisma.productSku.updateMany({
          data: {
            reservedStock: 0
          }
        })

        return NextResponse.json({
          success: true,
          action: 'reset-sku-counters',
          result: { updatedSkus: skuResetResult.count },
          message: `Сброшены счетчики для ${skuResetResult.count} SKU`
        })

      case 'full-cleanup':
        // Полная очистка всех тестовых данных
        const fullCleanupResult = await prisma.$transaction(async (tx) => {
          // 1. Удалить OrderItem
          const deletedOrderItems = await tx.orderItem.deleteMany()
          
          // 2. Удалить заказы
          const deletedOrders = await tx.order.deleteMany()
          
          // 3. Удалить резервирования
          const deletedReservations = await tx.stockReservation.deleteMany()
          
          // 4. Найти и удалить тестовые продукты
          const testProducts = await tx.product.findMany({
            where: {
              OR: [
                { name: { contains: "99999" } },
                { name: { contains: "88" } },
                { name: { contains: "44444" } },
                { name: { contains: "333" } },
                { name: { contains: "test" } },
                { name: { contains: "Test" } },
                { name: { contains: "TEST" } }
              ]
            }
          })

          const testProductIds = testProducts.map(p => p.id)
          
          let deletedImages = { count: 0 }
          let deletedSkus = { count: 0 }
          let deletedProducts = { count: 0 }
          
          if (testProductIds.length > 0) {
            deletedImages = await tx.productImage.deleteMany({
              where: { productId: { in: testProductIds } }
            })

            deletedSkus = await tx.productSku.deleteMany({
              where: { productId: { in: testProductIds } }
            })

            deletedProducts = await tx.product.deleteMany({
              where: { id: { in: testProductIds } }
            })
          }

          // 5. Очистить настройки (кроме важных)
          const deletedSettings = await tx.setting.deleteMany({
            where: {
              key: {
                notIn: [
                  'system_initialized',
                  'database_version',
                  'app_version'
                ]
              }
            }
          })

          // 6. Сбросить счетчики в оставшихся SKU
          const updatedSkus = await tx.productSku.updateMany({
            data: {
              reservedStock: 0
            }
          })

          return {
            deletedOrderItems: deletedOrderItems.count,
            deletedOrders: deletedOrders.count,
            deletedReservations: deletedReservations.count,
            deletedProducts: deletedProducts.count,
            deletedSkus: deletedSkus.count,
            deletedImages: deletedImages.count,
            deletedSettings: deletedSettings.count,
            updatedSkus: updatedSkus.count,
            testProductNames: testProducts.map(p => p.name)
          }
        })

        return NextResponse.json({
          success: true,
          action: 'full-cleanup',
          result: fullCleanupResult,
          message: `Полная очистка завершена: удалено ${fullCleanupResult.deletedOrders} заказов, ${fullCleanupResult.deletedProducts} тестовых продуктов`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          availableActions: [
            'cleanup-orders',
            'cleanup-test-products', 
            'cleanup-reservations',
            'cleanup-settings',
            'reset-sku-counters',
            'full-cleanup'
          ]
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup data',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}