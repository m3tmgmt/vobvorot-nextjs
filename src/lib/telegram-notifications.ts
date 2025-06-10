// Система уведомлений для Telegram бота
import { Bot } from 'grammy'

interface OrderNotification {
  orderId: string
  customerName: string
  customerEmail: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  shippingAddress: any
  paymentStatus: string
}

interface LowStockNotification {
  productId: string
  productName: string
  currentStock: number
  threshold: number
  lastSold: string
}

interface ReviewNotification {
  productId: string
  productName: string
  customerName: string
  rating: number
  review: string
  createdAt: string
}

class TelegramNotificationService {
  private bot: Bot
  private ownerChatId: string

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const ownerChatId = process.env.OWNER_TELEGRAM_ID
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required in environment variables')
    }
    
    if (!ownerChatId) {
      throw new Error('OWNER_TELEGRAM_ID is required in environment variables')
    }
    
    this.bot = new Bot(botToken)
    this.ownerChatId = ownerChatId
  }

  // Уведомление о новом заказе
  async notifyNewOrder(order: OrderNotification) {
    try {
      const itemsList = order.items
        .map(item => `• ${item.name} x${item.quantity} - $${Number(item.price)}`)
        .join('\n')

      const message = `
🆕 *НОВЫЙ ЗАКАЗ* #${order.orderId}

👤 *Клиент:* ${order.customerName}
📧 *Email:* ${order.customerEmail}
💰 *Сумма:* $${Number(order.total)}
💳 *Оплата:* ${order.paymentStatus}

📦 *Товары:*
${itemsList}

🏠 *Адрес доставки:*
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.country}
${order.shippingAddress.postalCode}

⏰ ${new Date().toLocaleString('ru-RU')}
      `.trim()

      // Создаем inline клавиатуру для быстрых действий
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: `confirm_order_${order.orderId}` },
            { text: '📦 В обработку', callback_data: `process_order_${order.orderId}` }
          ],
          [
            { text: '👁️ Детали заказа', callback_data: `view_order_${order.orderId}` },
            { text: '💬 Написать клиенту', callback_data: `message_customer_${order.orderId}` }
          ]
        ]
      }

      await this.bot.api.sendMessage(
        this.ownerChatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )

      // Звуковое уведомление (если включено)
      await this.bot.api.sendMessage(
        this.ownerChatId,
        '🔔 Новый заказ требует внимания!',
        { 
          reply_markup: { remove_keyboard: true },
          disable_notification: false
        }
      )

    } catch (error) {
      console.error('Failed to send new order notification:', error)
    }
  }

  // Уведомление о низком остатке
  async notifyLowStock(products: LowStockNotification[]) {
    try {
      if (products.length === 0) return

      const productsList = products
        .map(product => 
          `• *${product.productName}*\n  📦 Остаток: ${product.currentStock} шт. (мин: ${product.threshold})\n  📅 Последняя продажа: ${product.lastSold}`
        )
        .join('\n\n')

      const message = `
⚠️ *НИЗКИЙ ОСТАТОК ТОВАРОВ*

${productsList}

🔄 Рекомендуется пополнить склад
⏰ ${new Date().toLocaleString('ru-RU')}
      `.trim()

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Статистика склада', callback_data: 'inventory_stats' },
            { text: '➕ Добавить товары', callback_data: 'add_inventory' }
          ],
          [
            { text: '📝 Запланировать закупку', callback_data: 'plan_restock' }
          ]
        ]
      }

      await this.bot.api.sendMessage(
        this.ownerChatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )

    } catch (error) {
      console.error('Failed to send low stock notification:', error)
    }
  }

  // Уведомление о новом отзыве
  async notifyNewReview(review: ReviewNotification) {
    try {
      const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
      
      const message = `
💬 *НОВЫЙ ОТЗЫВ*

🛍️ *Товар:* ${review.productName}
👤 *Клиент:* ${review.customerName}
${stars} *Оценка:* ${review.rating}/5

*Отзыв:*
"${review.review}"

⏰ ${new Date(review.createdAt).toLocaleString('ru-RU')}
      `.trim()

      const keyboard = {
        inline_keyboard: [
          [
            { text: '👁️ Посмотреть товар', callback_data: `view_product_${review.productId}` },
            { text: '💬 Ответить', callback_data: `reply_review_${review.productId}` }
          ]
        ]
      }

      await this.bot.api.sendMessage(
        this.ownerChatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )

    } catch (error) {
      console.error('Failed to send review notification:', error)
    }
  }

  // Уведомление об изменении статуса заказа
  async notifyOrderStatusChange(orderId: string, oldStatus: string, newStatus: string, customerName: string) {
    try {
      const statusEmojis: { [key: string]: string } = {
        'pending': '🕐',
        'confirmed': '✅',
        'processing': '🔄',
        'shipped': '📦',
        'completed': '🎉',
        'cancelled': '❌'
      }

      const message = `
📋 *ИЗМЕНЕНИЕ СТАТУСА ЗАКАЗА*

🆔 *Заказ:* #${orderId}
👤 *Клиент:* ${customerName}
${statusEmojis[oldStatus]} *Было:* ${oldStatus}
${statusEmojis[newStatus]} *Стало:* ${newStatus}

⏰ ${new Date().toLocaleString('ru-RU')}
      `.trim()

      await this.bot.api.sendMessage(
        this.ownerChatId,
        message,
        { parse_mode: 'Markdown' }
      )

    } catch (error) {
      console.error('Failed to send status change notification:', error)
    }
  }

  // Уведомление о возврате/отмене заказа
  async notifyOrderRefund(orderId: string, customerName: string, amount: number, reason: string) {
    try {
      const message = `
💸 *ВОЗВРАТ/ОТМЕНА ЗАКАЗА*

🆔 *Заказ:* #${orderId}
👤 *Клиент:* ${customerName}
💰 *Сумма возврата:* $${Number(amount)}
📝 *Причина:* ${reason}

⏰ ${new Date().toLocaleString('ru-RU')}
      `.trim()

      const keyboard = {
        inline_keyboard: [
          [
            { text: '👁️ Детали заказа', callback_data: `view_order_${orderId}` },
            { text: '💬 Связаться с клиентом', callback_data: `contact_customer_${orderId}` }
          ]
        ]
      }

      await this.bot.api.sendMessage(
        this.ownerChatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )

    } catch (error) {
      console.error('Failed to send refund notification:', error)
    }
  }

  // Ежедневная сводка
  async sendDailySummary(stats: any) {
    try {
      const message = `
📊 *ЕЖЕДНЕВНАЯ СВОДКА*
${new Date().toLocaleDateString('ru-RU')}

💰 *Продажи:*
• Заказов: ${stats.ordersToday}
• Выручка: $${stats.revenueToday}
• Средний чек: $${stats.averageOrderValue}

📦 *Товары:*
• Продано единиц: ${stats.itemsSold}
• Новые товары: ${stats.newProducts}
• Низкий остаток: ${stats.lowStockItems}

👥 *Клиенты:*
• Новые клиенты: ${stats.newCustomers}
• Возвраты: ${stats.returningCustomers}

📈 *По сравнению с вчера:*
• Заказы: ${stats.ordersChange > 0 ? '+' : ''}${stats.ordersChange}%
• Выручка: ${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%

⏰ Данные на ${new Date().toLocaleTimeString('ru-RU')}
      `.trim()

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Подробная статистика', callback_data: 'detailed_stats' },
            { text: '📦 Заказы за день', callback_data: 'today_orders' }
          ]
        ]
      }

      await this.bot.api.sendMessage(
        this.ownerChatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )

    } catch (error) {
      console.error('Failed to send daily summary:', error)
    }
  }

  // Уведомление об ошибках системы
  async notifySystemError(error: string, context: string) {
    try {
      const message = `
🚨 *СИСТЕМНАЯ ОШИБКА*

📍 *Контекст:* ${context}
❌ *Ошибка:* ${error}

⏰ ${new Date().toLocaleString('ru-RU')}

⚠️ Требует внимания администратора
      `.trim()

      await this.bot.api.sendMessage(
        this.ownerChatId,
        message,
        { parse_mode: 'Markdown' }
      )

    } catch (error) {
      console.error('Failed to send system error notification:', error)
    }
  }

  // Проверка доступности бота
  async checkBotHealth(): Promise<boolean> {
    try {
      const me = await this.bot.api.getMe()
      return me.username === process.env.TELEGRAM_BOT_USERNAME
    } catch (error) {
      console.error('Bot health check failed:', error)
      return false
    }
  }
}

// Экспорт singleton instance
export const telegramNotifications = new TelegramNotificationService()

// Хелпер функции для использования в API
export async function notifyNewOrder(orderData: OrderNotification) {
  await telegramNotifications.notifyNewOrder(orderData)
}

export async function notifyLowStock(products: LowStockNotification[]) {
  await telegramNotifications.notifyLowStock(products)
}

export async function notifyNewReview(reviewData: ReviewNotification) {
  await telegramNotifications.notifyNewReview(reviewData)
}

export async function notifyOrderStatusChange(orderId: string, oldStatus: string, newStatus: string, customerName: string) {
  await telegramNotifications.notifyOrderStatusChange(orderId, oldStatus, newStatus, customerName)
}

export async function sendDailySummary(stats: any) {
  await telegramNotifications.sendDailySummary(stats)
}

export async function notifySystemError(error: string, context: string) {
  await telegramNotifications.notifySystemError(error, context)
}

export async function sendTelegramNotification(message: string, data?: any) {
  await telegramNotifications.notifySystemError(message, data?.context || 'General notification')
}