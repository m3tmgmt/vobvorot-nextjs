import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { 
  calculateShipping, 
  canShipToCountry, 
  getAvailableCountries,
  getShippingZone,
  SHIPPING_ZONES
} from '@/lib/meest-shipping'
import { escapeMarkdownV2 } from './utils'

export interface ShippingResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// Функция расчета стоимости доставки для заказа
export async function calculateOrderShipping(
  orderId: string,
  packageType: 'box' | 'package' = 'box',
  currency: 'UAH' | 'USD' = 'USD'
): Promise<ShippingResult> {
  try {
    // Получаем заказ из БД
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: true
      }
    })

    if (!order) {
      return {
        success: false,
        error: 'Заказ не найден'
      }
    }

    // Рассчитываем общий вес
    const totalWeight = order.orderItems.reduce((total, item) => {
      const weight = item.product.weight || 0.5 // По умолчанию 0.5 кг
      return total + (weight * item.quantity)
    }, 0)

    // Проверяем возможность доставки
    const countryCode = order.shippingCountry || 'UA'
    const shippingCheck = canShipToCountry(countryCode, totalWeight)
    
    if (!shippingCheck.canShip) {
      return {
        success: false,
        error: shippingCheck.reason,
        data: { maxWeight: shippingCheck.maxWeight }
      }
    }

    // Рассчитываем стоимость
    const shippingResult = calculateShipping(
      countryCode,
      packageType,
      totalWeight,
      undefined, // dimensions пока не используем
      currency
    )

    return {
      success: true,
      message: 'Стоимость доставки рассчитана',
      data: {
        orderId: order.orderNumber,
        customerEmail: order.customer?.email,
        destination: order.shippingCountry,
        totalWeight,
        ...shippingResult
      }
    }
  } catch (error) {
    console.error('Ошибка расчета доставки:', error)
    return {
      success: false,
      error: 'Ошибка при расчете стоимости доставки'
    }
  }
}

// Функция проверки возможности доставки
export async function checkShippingAvailability(
  countryCode: string,
  weight?: number
): Promise<ShippingResult> {
  try {
    const zone = getShippingZone(countryCode)
    const zoneInfo = SHIPPING_ZONES[zone]
    
    if (!zoneInfo) {
      return {
        success: false,
        error: 'Доставка в эту страну не поддерживается'
      }
    }

    // Если указан вес, проверяем ограничения
    if (weight) {
      const check = canShipToCountry(countryCode, weight)
      if (!check.canShip) {
        return {
          success: false,
          error: check.reason,
          data: { maxWeight: check.maxWeight }
        }
      }
    }

    return {
      success: true,
      message: `Доставка в ${zoneInfo.name} доступна`,
      data: {
        zone: zoneInfo.name,
        deliveryTime: zoneInfo.deliveryTime,
        maxWeight: zoneInfo.maxWeight,
        maxDimensions: zoneInfo.maxDimensions
      }
    }
  } catch (error) {
    console.error('Ошибка проверки доставки:', error)
    return {
      success: false,
      error: 'Ошибка при проверке возможности доставки'
    }
  }
}

// Функция обновления трекинг информации
export async function updateOrderTracking(
  orderId: string,
  trackingNumber: string,
  carrier: string = 'Meest Express'
): Promise<ShippingResult> {
  try {
    // Обновляем заказ
    const order = await prisma.order.update({
      where: { 
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      data: {
        status: 'SHIPPED',
        trackingNumber,
        shippedAt: new Date()
      },
      include: {
        customer: true
      }
    })

    return {
      success: true,
      message: 'Трекинг информация обновлена',
      data: {
        orderId: order.orderNumber,
        trackingNumber,
        carrier,
        status: order.status,
        shippedAt: order.shippedAt
      }
    }
  } catch (error) {
    console.error('Ошибка обновления трекинга:', error)
    return {
      success: false,
      error: 'Ошибка при обновлении трекинг номера'
    }
  }
}

// Функция получения статуса доставки
export async function getDeliveryStatus(orderId: string): Promise<ShippingResult> {
  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      include: {
        customer: true
      }
    })

    if (!order) {
      return {
        success: false,
        error: 'Заказ не найден'
      }
    }

    // Определяем статус доставки на основе статуса заказа
    let deliveryStatus = 'Не отправлен'
    let estimatedDelivery = null
    
    if (order.status === 'SHIPPED' && order.shippedAt) {
      deliveryStatus = 'В пути'
      
      // Получаем информацию о зоне доставки
      const zone = getShippingZone(order.shippingCountry || 'UA')
      const zoneInfo = SHIPPING_ZONES[zone]
      
      if (zoneInfo) {
        // Парсим время доставки (например, "10-17 дней")
        const match = zoneInfo.deliveryTime.match(/(\d+)-(\d+)/)
        if (match) {
          const maxDays = parseInt(match[2])
          const estimatedDate = new Date(order.shippedAt)
          estimatedDate.setDate(estimatedDate.getDate() + maxDays)
          estimatedDelivery = estimatedDate
        }
      }
    } else if (order.status === 'DELIVERED') {
      deliveryStatus = 'Доставлен'
    }

    return {
      success: true,
      message: 'Статус доставки получен',
      data: {
        orderId: order.orderNumber,
        orderStatus: order.status,
        deliveryStatus,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        estimatedDelivery,
        destination: order.shippingCountry
      }
    }
  } catch (error) {
    console.error('Ошибка получения статуса:', error)
    return {
      success: false,
      error: 'Ошибка при получении статуса доставки'
    }
  }
}

// Функция получения списка доступных стран
export async function getShippingZones(): Promise<ShippingResult> {
  try {
    const countries = getAvailableCountries()
    
    // Группируем страны по зонам
    const zones: Record<string, any> = {}
    
    Object.entries(SHIPPING_ZONES).forEach(([zoneKey, zone]) => {
      zones[zoneKey] = {
        name: zone.name,
        deliveryTime: zone.deliveryTime,
        maxWeight: zone.maxWeight,
        countries: countries
          .filter(c => c.zone === zoneKey)
          .map(c => ({ code: c.code, name: c.name }))
      }
    })

    return {
      success: true,
      message: 'Список зон доставки',
      data: zones
    }
  } catch (error) {
    console.error('Ошибка получения зон:', error)
    return {
      success: false,
      error: 'Ошибка при получении списка зон доставки'
    }
  }
}

// Функция массового расчета доставки
export async function calculateBulkShipping(
  orderIds: string[],
  packageType: 'box' | 'package' = 'box',
  currency: 'UAH' | 'USD' = 'USD'
): Promise<ShippingResult> {
  try {
    const results = []
    let totalCost = 0
    let errors = 0

    for (const orderId of orderIds) {
      const result = await calculateOrderShipping(orderId, packageType, currency)
      
      if (result.success && result.data) {
        results.push({
          orderId,
          cost: result.data.totalCost,
          weight: result.data.totalWeight,
          destination: result.data.destination
        })
        totalCost += result.data.totalCost
      } else {
        errors++
        results.push({
          orderId,
          error: result.error
        })
      }
    }

    return {
      success: true,
      message: 'Массовый расчет доставки выполнен',
      data: {
        processed: orderIds.length,
        successful: orderIds.length - errors,
        errors,
        totalCost,
        currency,
        results
      }
    }
  } catch (error) {
    console.error('Ошибка массового расчета:', error)
    return {
      success: false,
      error: 'Ошибка при массовом расчете доставки'
    }
  }
}

// Форматирование результатов для Telegram
export function formatShippingResult(result: ShippingResult): string {
  if (!result.success) {
    return `❌ ${escapeMarkdownV2(result.error || 'Неизвестная ошибка')}`
  }

  const data = result.data
  if (!data) {
    return `✅ ${escapeMarkdownV2(result.message)}`
  }

  let response = `✅ ${escapeMarkdownV2(result.message)}`

  // Форматирование для расчета стоимости
  if (data.totalCost !== undefined) {
    response += `\n\n📋 *Детали доставки:*`
    if (data.orderId) response += `\n🆔 Заказ: ${escapeMarkdownV2(data.orderId)}`
    if (data.destination) response += `\n🌍 Страна: ${escapeMarkdownV2(data.destination)}`
    if (data.zone) response += `\n📍 Зона: ${escapeMarkdownV2(data.zone)}`
    response += `\n⚖️ Вес: ${escapeMarkdownV2(data.totalWeight.toString())} кг`
    response += `\n📦 Тип: ${escapeMarkdownV2(data.packageType)}`
    response += `\n💰 Стоимость: ${escapeMarkdownV2(data.totalCost.toString())} ${escapeMarkdownV2(data.currency)}`
    response += `\n🚚 Срок: ${escapeMarkdownV2(data.deliveryTime)}`
  }

  // Форматирование для статуса доставки
  if (data.deliveryStatus) {
    response += `\n\n📦 *Статус доставки:*`
    response += `\n🆔 Заказ: ${escapeMarkdownV2(data.orderId)}`
    response += `\n📊 Статус: ${escapeMarkdownV2(data.deliveryStatus)}`
    if (data.trackingNumber) {
      response += `\n🔍 Трек\\-номер: ${escapeMarkdownV2(data.trackingNumber)}`
    }
    if (data.shippedAt) {
      response += `\n📅 Отправлен: ${escapeMarkdownV2(new Date(data.shippedAt).toLocaleDateString('ru-RU'))}`
    }
    if (data.estimatedDelivery) {
      response += `\n📅 Ожидается: ${escapeMarkdownV2(new Date(data.estimatedDelivery).toLocaleDateString('ru-RU'))}`
    }
  }

  // Форматирование для зон доставки
  if (data.ukraine || data.europe || data.usa) {
    response += `\n\n🌍 *Доступные зоны доставки:*`
    Object.entries(data).forEach(([zoneKey, zone]: [string, any]) => {
      if (zone.name && zone.countries) {
        response += `\n\n📍 *${escapeMarkdownV2(zone.name)}*`
        response += `\n⏱️ Срок: ${escapeMarkdownV2(zone.deliveryTime)}`
        response += `\n⚖️ Макс\\. вес: ${escapeMarkdownV2(zone.maxWeight.toString())} кг`
        response += `\n🌐 Страны: ${escapeMarkdownV2(zone.countries.length.toString())} стран`
      }
    })
  }

  return response
}

// Форматирование результатов массового расчета
export function formatBulkShippingResult(result: ShippingResult): string {
  if (!result.success) {
    return `❌ ${escapeMarkdownV2(result.error || 'Неизвестная ошибка')}`
  }

  const data = result.data
  if (!data) {
    return `✅ ${escapeMarkdownV2(result.message)}`
  }

  let response = `📦 *Результаты массового расчета доставки:*`
  response += `\n✅ Успешно: ${escapeMarkdownV2(data.successful.toString())}`
  response += `\n❌ Ошибок: ${escapeMarkdownV2(data.errors.toString())}`
  response += `\n💰 Общая стоимость: ${escapeMarkdownV2(data.totalCost.toString())} ${escapeMarkdownV2(data.currency)}`

  if (data.results && data.results.length > 0) {
    response += `\n\n📋 *Детали по заказам:*`
    data.results.slice(0, 10).forEach((result: any) => {
      if (result.error) {
        response += `\n❌ ${escapeMarkdownV2(result.orderId)}: ${escapeMarkdownV2(result.error)}`
      } else {
        response += `\n✅ ${escapeMarkdownV2(result.orderId)}: ${escapeMarkdownV2(result.cost.toString())} ${escapeMarkdownV2(data.currency)} \\(${escapeMarkdownV2(result.weight.toString())} кг\\)`
      }
    })
    
    if (data.results.length > 10) {
      response += `\n\\.\\.\\. и еще ${escapeMarkdownV2((data.results.length - 10).toString())} заказов`
    }
  }

  return response
}