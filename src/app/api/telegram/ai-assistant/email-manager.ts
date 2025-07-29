// Модуль управления email уведомлениями для AI ассистента
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'
import { sendShippingNotification } from '@/lib/email'
import { 
  sendBulkOrderNotifications,
  sendMarketingEmail,
  sendNewsletterEmail,
  getEmailStats,
  createNewsletterTemplate
} from '@/lib/email-utils'
import { escapeMarkdownV2 } from './utils'

// Интерфейсы для результатов
export interface EmailResult {
  success: boolean
  message?: string
  error?: string
  details?: any
}

export interface BulkEmailResult {
  success: number
  failed: number
  errors: string[]
}

// Отправка тестового email
export async function sendTestEmail(
  email: string
): Promise<EmailResult> {
  try {
    await emailService.sendTestEmail(email)
    
    return {
      success: true,
      message: `Тестовое письмо отправлено на ${email}`
    }
  } catch (error: any) {
    console.error('Send test email error:', error)
    return {
      success: false,
      error: error.message || 'Ошибка отправки тестового письма'
    }
  }
}

// Отправка уведомления о заказе
export async function sendOrderNotificationEmail(
  orderId: string,
  type: 'confirmation' | 'status-update' = 'confirmation'
): Promise<EmailResult> {
  try {
    // Получаем данные заказа
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
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
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
    
    // Подготавливаем данные для email
    const emailData = {
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || order.shippingName || 'Customer',
      customerEmail: order.customer?.email || order.shippingEmail || '',
      items: order.orderItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        imageUrl: item.product.images[0]?.url
      })),
      subtotal: parseFloat(order.subtotal.toString()),
      shippingCost: parseFloat(order.shippingCost.toString()),
      total: parseFloat(order.total.toString()),
      shippingAddress: {
        name: order.shippingName || '',
        address: order.shippingAddress || '',
        city: order.shippingCity || '',
        country: order.shippingCountry || '',
        zip: order.shippingZip || ''
      },
      status: order.status,
      trackingNumber: order.trackingNumber || undefined,
      estimatedDelivery: order.estimatedDelivery?.toLocaleDateString('ru') || undefined
    }
    
    // Отправляем email
    if (type === 'confirmation') {
      await emailService.sendOrderConfirmation(emailData)
    } else {
      await emailService.sendOrderStatusUpdate(emailData)
    }
    
    // Отправляем админу если новый заказ
    if (type === 'confirmation') {
      await emailService.sendAdminOrderNotification({
        orderNumber: order.orderNumber,
        customerName: emailData.customerName,
        customerEmail: emailData.customerEmail,
        total: emailData.total,
        itemCount: order.orderItems.length,
        paymentMethod: order.paymentMethod || 'Unknown',
        shippingAddress: `${emailData.shippingAddress.address}, ${emailData.shippingAddress.city}`
      })
    }
    
    return {
      success: true,
      message: `Уведомление о заказе #${order.orderNumber} отправлено на ${emailData.customerEmail}`,
      details: {
        orderNumber: order.orderNumber,
        email: emailData.customerEmail,
        type
      }
    }
  } catch (error: any) {
    console.error('Send order notification error:', error)
    return {
      success: false,
      error: error.message || 'Ошибка отправки уведомления о заказе'
    }
  }
}

// Отправка уведомления об отправке
export async function sendShippingNotificationEmail(
  orderId: string,
  trackingNumber: string,
  carrier?: string
): Promise<EmailResult> {
  try {
    // Получаем данные заказа
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
    
    const customerEmail = order.customer?.email || order.shippingEmail || ''
    const customerName = order.customer?.name || order.shippingName || 'Customer'
    
    // Отправляем уведомление
    await sendShippingNotification(
      order.orderNumber,
      customerEmail,
      customerName,
      trackingNumber,
      carrier,
      'ru'
    )
    
    // Обновляем заказ
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber,
        carrier,
        status: 'SHIPPED',
        shippedAt: new Date()
      }
    })
    
    return {
      success: true,
      message: `Уведомление об отправке заказа #${order.orderNumber} отправлено на ${customerEmail}`,
      details: {
        orderNumber: order.orderNumber,
        email: customerEmail,
        trackingNumber,
        carrier
      }
    }
  } catch (error: any) {
    console.error('Send shipping notification error:', error)
    return {
      success: false,
      error: error.message || 'Ошибка отправки уведомления об отправке'
    }
  }
}

// Массовая рассылка уведомлений
export async function sendBulkEmails(
  type: 'confirmation' | 'status-update',
  filters?: {
    orderIds?: string[]
    status?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<BulkEmailResult> {
  try {
    const options: any = {}
    
    if (filters?.orderIds?.length) {
      options.orderIds = filters.orderIds
    }
    
    if (filters?.status) {
      options.status = filters.status
    }
    
    if (filters?.dateFrom) {
      options.dateFrom = new Date(filters.dateFrom)
    }
    
    if (filters?.dateTo) {
      options.dateTo = new Date(filters.dateTo)
    }
    
    const result = await sendBulkOrderNotifications(type, options)
    
    return result
  } catch (error: any) {
    console.error('Send bulk emails error:', error)
    return {
      success: 0,
      failed: 0,
      errors: [error.message || 'Ошибка массовой рассылки']
    }
  }
}

// Маркетинговая рассылка
export async function sendMarketingCampaign(
  subject: string,
  content: string,
  filters?: {
    customerIds?: string[]
    onlyRecentCustomers?: boolean
    daysBack?: number
  }
): Promise<BulkEmailResult> {
  try {
    // Создаем HTML шаблон
    const { html, text } = createNewsletterTemplate(
      subject,
      content,
      'Перейти в магазин',
      process.env.NEXT_PUBLIC_SITE_URL,
      'ru'
    )
    
    const options: any = {}
    
    if (filters?.customerIds?.length) {
      options.customerIds = filters.customerIds
    }
    
    if (filters?.onlyRecentCustomers) {
      options.onlyRecentCustomers = true
      options.daysBack = filters.daysBack || 30
    }
    
    const result = await sendMarketingEmail(
      subject,
      html,
      text,
      options
    )
    
    return result
  } catch (error: any) {
    console.error('Send marketing campaign error:', error)
    return {
      success: 0,
      failed: 0,
      errors: [error.message || 'Ошибка маркетинговой рассылки']
    }
  }
}

// Получение статистики email
export async function getEmailStatistics(
  dateFrom?: string,
  dateTo?: string
): Promise<{
  totalOrders: number
  uniqueCustomers: number
  ordersByStatus: Array<{
    status: string
    count: number
  }>
}> {
  try {
    const stats = await getEmailStats(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    )
    
    return stats
  } catch (error: any) {
    console.error('Get email stats error:', error)
    throw error
  }
}

// Форматирование результата email
export function formatEmailResult(result: EmailResult): string {
  if (result.success) {
    let message = `✅ ${escapeMarkdownV2(result.message || 'Email отправлен')}`
    
    if (result.details) {
      message += `\\n\\n📋 *Детали:*\\n`
      
      if (result.details.orderNumber) {
        message += `🆔 Заказ: \\#${escapeMarkdownV2(result.details.orderNumber)}\\n`
      }
      
      if (result.details.email) {
        message += `📧 Email: ${escapeMarkdownV2(result.details.email)}\\n`
      }
      
      if (result.details.trackingNumber) {
        message += `📦 Трек\\-номер: \`${escapeMarkdownV2(result.details.trackingNumber)}\`\\n`
      }
      
      if (result.details.type) {
        message += `📑 Тип: ${escapeMarkdownV2(result.details.type)}`
      }
    }
    
    return message
  } else {
    return `❌ Ошибка: ${escapeMarkdownV2(result.error || 'Неизвестная ошибка')}`
  }
}

// Форматирование результата массовой рассылки
export function formatBulkEmailResult(result: BulkEmailResult): string {
  let message = `📧 *Результаты массовой рассылки:*\\n\\n`
  
  message += `✅ Успешно: ${result.success}\\n`
  message += `❌ Ошибок: ${result.failed}\\n`
  
  if (result.success > 0 || result.failed > 0) {
    const total = result.success + result.failed
    const successRate = Math.round((result.success / total) * 100)
    message += `📊 Успешность: ${successRate}%\\n`
  }
  
  if (result.errors.length > 0) {
    message += `\\n⚠️ *Ошибки:*\\n`
    result.errors.slice(0, 5).forEach(error => {
      message += `• ${escapeMarkdownV2(error)}\\n`
    })
    
    if (result.errors.length > 5) {
      message += `\\n_\\.\\.\\.и еще ${result.errors.length - 5} ошибок_`
    }
  }
  
  return message
}

// Форматирование статистики email
export function formatEmailStats(stats: any): string {
  let message = `📊 *Статистика email рассылок:*\\n\\n`
  
  message += `📧 Всего заказов: ${stats.totalOrders}\\n`
  message += `👥 Уникальных клиентов: ${stats.uniqueCustomers}\\n`
  
  if (stats.ordersByStatus?.length > 0) {
    message += `\\n📈 *По статусам:*\\n`
    
    stats.ordersByStatus.forEach((item: any) => {
      let emoji = '📦'
      switch (item.status) {
        case 'PENDING': emoji = '⏳'; break
        case 'CONFIRMED': emoji = '✅'; break
        case 'PROCESSING': emoji = '🔄'; break
        case 'SHIPPED': emoji = '🚚'; break
        case 'DELIVERED': emoji = '📬'; break
        case 'CANCELLED': emoji = '❌'; break
      }
      
      message += `${emoji} ${escapeMarkdownV2(item.status)}: ${item.count}\\n`
    })
  }
  
  return message
}