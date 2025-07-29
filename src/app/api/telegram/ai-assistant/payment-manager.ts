// Модуль управления платежами для AI ассистента
import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from './utils'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.INTERNAL_API_KEY || 'fallback-key'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vobvorot.com'

// Кеш для статусов платежей (TTL: 60 секунд)
const statusCache = new Map<string, { 
  data: any, 
  timestamp: number 
}>()

const CACHE_TTL = 60000 // 60 секунд

export interface RefundResult {
  success: boolean
  refundId?: string
  refundAmount?: number
  message?: string
  error?: string
}

export interface PaymentInfo {
  orderId: string
  orderNumber: string
  total: number
  paymentStatus: string
  paymentMethod?: string
  paymentId?: string
  canRefund: boolean
  refundedAmount: number
  maxRefundAmount: number
  // Дополнительные поля
  orderStatus?: string
  customerName?: string
  customerEmail?: string
  itemsCount?: number
  createdAt?: Date
}

// Возврат платежа
export async function refundPayment(
  orderId: string, 
  reason: string, 
  amount?: number
): Promise<RefundResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      },
      body: JSON.stringify({
        reason,
        amount,
        adminId: 'telegram-ai-assistant',
        notifyCustomer: true
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`
      }
    }
    
    // Очищаем кеш после успешного возврата
    clearPaymentCache(orderId)
    
    return {
      success: true,
      refundId: data.refundId,
      refundAmount: data.refundAmount,
      message: data.message
    }
  } catch (error: any) {
    console.error('Refund payment error:', error)
    return {
      success: false,
      error: error.message || 'Ошибка возврата платежа'
    }
  }
}

// Получить информацию о платеже (с кешированием)
export async function getPaymentInfo(orderId: string): Promise<PaymentInfo | null> {
  try {
    // Проверяем кеш
    const cacheKey = `payment_info_${orderId}`
    const cached = statusCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    
    // Расширенный запрос с дополнительной информацией
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    })
    
    if (!order) {
      return null
    }
    
    const canRefund = order.status !== 'REFUNDED' && 
                     order.status !== 'CANCELLED' &&
                     order.paymentStatus === 'COMPLETED'
    
    const refundedAmount = order.refundAmount ? parseFloat(order.refundAmount.toString()) : 0
    const total = parseFloat(order.total.toString())
    const maxRefundAmount = total - refundedAmount
    
    const paymentInfo = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || undefined,
      paymentId: order.paymentId || undefined,
      canRefund,
      refundedAmount,
      maxRefundAmount,
      // Дополнительная информация
      orderStatus: order.status,
      customerName: order.customer?.name,
      customerEmail: order.customer?.email,
      itemsCount: order.orderItems.length,
      createdAt: order.createdAt
    }
    
    // Сохраняем в кеш
    statusCache.set(cacheKey, {
      data: paymentInfo,
      timestamp: Date.now()
    })
    
    return paymentInfo
  } catch (error) {
    console.error('Get payment info error:', error)
    return null
  }
}

// Функция для очистки кеша
export function clearPaymentCache(orderId?: string) {
  if (orderId) {
    // Очищаем кеш для конкретного заказа
    statusCache.delete(`payment_info_${orderId}`)
    statusCache.delete(`payment_status_${orderId}`)
  } else {
    // Очищаем весь кеш
    statusCache.clear()
  }
}

// Повторная попытка платежа
export async function retryPayment(orderId: string): Promise<{
  success: boolean
  paymentId?: string
  formData?: any
  error?: string
}> {
  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/retry-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`
      }
    }
    
    // Очищаем кеш после создания новой платежной сессии
    clearPaymentCache(orderId)
    
    return {
      success: true,
      paymentId: data.paymentId,
      formData: data.formData
    }
  } catch (error: any) {
    console.error('Retry payment error:', error)
    return {
      success: false,
      error: error.message || 'Ошибка повторной попытки платежа'
    }
  }
}

// Проверить статус платежа (оптимизированная версия с кешем)
export async function checkPaymentStatus(orderId: string): Promise<string> {
  try {
    // Проверяем кеш
    const cacheKey = `payment_status_${orderId}`
    const cached = statusCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    
    // Расширенный запрос с информацией о платежах
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      select: {
        orderNumber: true,
        paymentStatus: true,
        status: true,
        total: true,
        refundAmount: true,
        createdAt: true,
        updatedAt: true,
        paymentMethod: true,
        paymentId: true,
        // Информация о клиенте
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        // Последние логи платежей
        paymentLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            status: true,
            message: true,
            createdAt: true
          }
        }
      }
    })
    
    if (!order) {
      return '❌ Заказ не найден'
    }
    
    let statusEmoji = '❓'
    let statusText = 'Неизвестно'
    
    switch (order.paymentStatus) {
      case 'PENDING':
        statusEmoji = '⏳'
        statusText = 'Ожидает оплаты'
        break
      case 'PROCESSING':
        statusEmoji = '🔄'
        statusText = 'Обрабатывается'
        break
      case 'COMPLETED':
        statusEmoji = '✅'
        statusText = 'Оплачен'
        break
      case 'FAILED':
        statusEmoji = '❌'
        statusText = 'Ошибка оплаты'
        break
      case 'CANCELLED':
        statusEmoji = '🚫'
        statusText = 'Отменен'
        break
    }
    
    let message = `💳 *Статус платежа для заказа \\#${escapeMarkdownV2(order.orderNumber)}*\\n\\n`
    message += `${statusEmoji} Платеж: ${escapeMarkdownV2(statusText)}\\n`
    message += `📦 Заказ: ${escapeMarkdownV2(order.status)}\\n`
    message += `💰 Сумма: ${escapeMarkdownV2(formatPrice(order.total))}\\n`
    
    if (order.paymentMethod) {
      message += `💳 Метод: ${escapeMarkdownV2(order.paymentMethod)}\\n`
    }
    
    if (order.customer) {
      message += `\\n👤 *Клиент:*\\n`
      message += `${escapeMarkdownV2(order.customer.name)}\\n`
      message += `${escapeMarkdownV2(order.customer.email)}\\n`
    }
    
    if (order.refundAmount && parseFloat(order.refundAmount.toString()) > 0) {
      message += `\\n💸 Возвращено: ${escapeMarkdownV2(formatPrice(order.refundAmount))}\\n`
    }
    
    // Время последнего обновления
    const lastUpdate = new Date(order.updatedAt).toLocaleString('ru')
    message += `\\n🕐 Обновлено: ${escapeMarkdownV2(lastUpdate)}`
    
    // Сохраняем в кеш
    statusCache.set(cacheKey, {
      data: message,
      timestamp: Date.now()
    })
    
    return message
  } catch (error) {
    console.error('Check payment status error:', error)
    return '❌ Ошибка проверки статуса платежа'
  }
}

// Форматировать информацию о платеже (расширенная версия)
export function formatPaymentInfo(payment: PaymentInfo): string {
  let message = `💳 *Информация о платеже*\\n\\n`
  message += `🆔 Заказ: \\#${escapeMarkdownV2(payment.orderNumber)}\\n`
  message += `💰 Сумма: ${escapeMarkdownV2(formatPrice(payment.total))}\\n`
  
  let statusEmoji = '❓'
  switch (payment.paymentStatus) {
    case 'PENDING': statusEmoji = '⏳'; break
    case 'PROCESSING': statusEmoji = '🔄'; break
    case 'COMPLETED': statusEmoji = '✅'; break
    case 'FAILED': statusEmoji = '❌'; break
    case 'CANCELLED': statusEmoji = '🚫'; break
  }
  
  message += `${statusEmoji} Статус платежа: ${escapeMarkdownV2(payment.paymentStatus)}\\n`
  
  if (payment.orderStatus) {
    message += `📦 Статус заказа: ${escapeMarkdownV2(payment.orderStatus)}\\n`
  }
  
  if (payment.paymentMethod) {
    message += `💳 Метод: ${escapeMarkdownV2(payment.paymentMethod)}\\n`
  }
  
  if (payment.paymentId) {
    message += `🔑 ID платежа: \\\`${escapeMarkdownV2(payment.paymentId)}\\\`\\n`
  }
  
  // Информация о клиенте
  if (payment.customerName || payment.customerEmail) {
    message += `\\n👤 *Клиент:*\\n`
    if (payment.customerName) {
      message += `${escapeMarkdownV2(payment.customerName)}\\n`
    }
    if (payment.customerEmail) {
      message += `${escapeMarkdownV2(payment.customerEmail)}\\n`
    }
  }
  
  // Информация о товарах
  if (payment.itemsCount) {
    message += `\\n🛍 Товаров в заказе: ${payment.itemsCount}\\n`
  }
  
  // Информация о возврате
  message += `\\n💸 *Возврат:*\\n`
  
  if (payment.canRefund) {
    message += `✅ Доступен возврат\\n`
    message += `💰 Максимум для возврата: ${escapeMarkdownV2(formatPrice(payment.maxRefundAmount))}\\n`
  } else {
    message += `❌ Возврат недоступен\\n`
    const reason = payment.paymentStatus !== 'COMPLETED' ? 
      '\\(платеж не завершен\\)' : 
      payment.orderStatus === 'REFUNDED' ? 
      '\\(заказ уже возвращен\\)' : 
      '\\(заказ отменен\\)'
    message += `📝 Причина: ${reason}\\n`
  }
  
  if (payment.refundedAmount > 0) {
    message += `💸 Уже возвращено: ${escapeMarkdownV2(formatPrice(payment.refundedAmount))}\\n`
  }
  
  // Дата создания заказа
  if (payment.createdAt) {
    const createdDate = new Date(payment.createdAt).toLocaleString('ru')
    message += `\\n📅 Создан: ${escapeMarkdownV2(createdDate)}`
  }
  
  return message
}

// Форматировать информацию о возврате
export function formatRefundInfo(refund: RefundResult, orderId: string): string {
  if (!refund.success) {
    return `❌ Ошибка возврата для заказа \\#${escapeMarkdownV2(orderId)}\\n\\n` +
           `Причина: ${escapeMarkdownV2(refund.error || 'Неизвестная ошибка')}`
  }
  
  let message = `✅ *Возврат успешно обработан\\!*\\n\\n`
  message += `🆔 Заказ: \\#${escapeMarkdownV2(orderId)}\\n`
  
  if (refund.refundAmount) {
    message += `💸 Сумма возврата: ${escapeMarkdownV2(formatPrice(refund.refundAmount))}\\n`
  }
  
  if (refund.refundId) {
    message += `🔑 ID возврата: \\\`${escapeMarkdownV2(refund.refundId)}\\\`\\n`
  }
  
  if (refund.message) {
    message += `\\n📝 ${escapeMarkdownV2(refund.message)}`
  }
  
  return message
}