import { Bot, webhookCallback } from 'grammy'
import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from './utils'
import { rateLimiter } from './rate-limiter'
import { confirmationManager } from './confirmation-manager'
import { 
  uploadVideoFromTelegram, 
  updateHomeVideo, 
  getHomeVideo,
  getSignVideos, 
  addSignVideo, 
  deleteSignVideo,
  formatVideoList 
} from './video-manager'
import {
  refundPayment,
  getPaymentInfo,
  retryPayment,
  checkPaymentStatus,
  formatPaymentInfo,
  formatRefundInfo
} from './payment-manager'
import {
  sendTestEmail,
  sendOrderNotificationEmail,
  sendShippingNotificationEmail,
  sendBulkEmails,
  sendMarketingCampaign,
  getEmailStatistics,
  formatEmailResult,
  formatBulkEmailResult,
  formatEmailStats
} from './email-manager'
import {
  calculateOrderShipping,
  checkShippingAvailability,
  updateOrderTracking,
  getDeliveryStatus,
  getShippingZones,
  calculateBulkShipping,
  formatShippingResult,
  formatBulkShippingResult
} from './delivery-manager'
import {
  logAction,
  logError,
  logAIInteraction,
  getActionLogs,
  getErrorLogs,
  getUsageStatistics,
  exportLogs,
  cleanupOldLogs,
  formatUsageStats,
  formatLogs
} from './logging-manager'

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// System prompt для анализа намерений
const SYSTEM_PROMPT = `Ты AI ассистент магазина VOBVOROT. Анализируй сообщения и возвращай JSON с действием.

ВАЖНО: Возвращай ТОЛЬКО валидный JSON без дополнительного текста!

Формат ответа:
{
  "action": "string",
  "params": {},
  "needConfirm": boolean
}

Доступные действия:
- view_orders: показать заказы (params: {filter?: "today"|"week"|"month"|"all", status?: string})
- add_product: добавить товар (params: {name: string, price: number, category?: string})
- search_customer: найти клиента (params: {query: string})
- stats: статистика (params: {period?: "today"|"week"|"month"|"all"})
- search_product: найти товар (params: {query: string})
- update_order_status: изменить статус заказа (params: {orderId: number, status: string})
- add_category: создать категорию (params: {name: string, emoji?: string})
- view_categories: показать категории (params: {})
- upload_home_video: загрузить видео на главную (params: {})
- view_home_video: показать видео главной (params: {})
- delete_home_video: удалить видео главной (params: {})
- list_sign_videos: показать видео подписей (params: {})
- add_sign_video: добавить видео подписей (params: {})
- delete_sign_video: удалить видео подписей (params: {videoId: string})
- refund_payment: возврат платежа (params: {orderId: string, reason: string, amount?: number})
- check_payment_status: проверить статус платежа (params: {orderId: string})
- retry_payment: повторить платеж (params: {orderId: string})
- view_payment_info: информация о платеже (params: {orderId: string})
- send_test_email: отправить тестовое письмо (params: {email: string})
- send_order_notification: отправить уведомление о заказе (params: {orderId: string, type?: "confirmation"|"status-update"})
- send_shipping_notification: отправить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- send_bulk_emails: массовая рассылка уведомлений (params: {type: string, orderIds?: string[], status?: string, dateFrom?: string, dateTo?: string})
- send_marketing_campaign: маркетинговая рассылка (params: {subject: string, content: string, customerIds?: string[], onlyRecentCustomers?: boolean, daysBack?: number})
- get_email_statistics: статистика email (params: {dateFrom?: string, dateTo?: string})
- calculate_shipping: рассчитать доставку (params: {orderId: string, packageType?: "box"|"package", currency?: "UAH"|"USD"})
- check_shipping: проверить доставку в страну (params: {countryCode: string, weight?: number})
- update_tracking: обновить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- get_delivery_status: статус доставки (params: {orderId: string})
- get_shipping_zones: зоны доставки (params: {})
- calculate_bulk_shipping: массовый расчет доставки (params: {orderIds: string[], packageType?: "box"|"package", currency?: "UAH"|"USD"})
- view_logs: просмотр логов (params: {filter?: "errors"|"recent"|"user", userId?: string, dateFrom?: string, dateTo?: string})
- view_statistics: статистика использования (params: {dateFrom?: string, dateTo?: string})
- export_logs: экспорт логов (params: {format?: "csv"|"json", dateFrom?: string, dateTo?: string})
- cleanup_logs: очистка старых логов (params: {daysToKeep?: number})
- unknown: непонятная команда (params: {})

Примеры:
"покажи заказы" → {"action":"view_orders","params":{},"needConfirm":false}
"заказы за сегодня" → {"action":"view_orders","params":{"filter":"today"},"needConfirm":false}
"добавь платье за 2000" → {"action":"add_product","params":{"name":"платье","price":2000},"needConfirm":false}
"найди марию" → {"action":"search_customer","params":{"query":"мария"},"needConfirm":false}
"статистика за неделю" → {"action":"stats","params":{"period":"week"},"needConfirm":false}
"найди товар юбка" → {"action":"search_product","params":{"query":"юбка"},"needConfirm":false}
"измени статус заказа 123 на отправлен" → {"action":"update_order_status","params":{"orderId":123,"status":"отправлен"},"needConfirm":true}
"создай категорию одежда" → {"action":"add_category","params":{"name":"одежда"},"needConfirm":false}
"загрузи видео на главную" → {"action":"upload_home_video","params":{},"needConfirm":false}
"покажи видео главной" → {"action":"view_home_video","params":{},"needConfirm":false}
"удали видео главной" → {"action":"delete_home_video","params":{},"needConfirm":true}
"покажи видео подписей" → {"action":"list_sign_videos","params":{},"needConfirm":false}
"добавь видео подписей" → {"action":"add_sign_video","params":{},"needConfirm":false}
"удали видео подписей 123" → {"action":"delete_sign_video","params":{"videoId":"123"},"needConfirm":true}
"сделай возврат для заказа 123 причина брак" → {"action":"refund_payment","params":{"orderId":"123","reason":"брак"},"needConfirm":true}
"проверь статус платежа 456" → {"action":"check_payment_status","params":{"orderId":"456"},"needConfirm":false}
"повтори платеж для заказа 789" → {"action":"retry_payment","params":{"orderId":"789"},"needConfirm":false}
"информация о платеже 234" → {"action":"view_payment_info","params":{"orderId":"234"},"needConfirm":false}
"отправь тестовое письмо на test@example.com" → {"action":"send_test_email","params":{"email":"test@example.com"},"needConfirm":false}
"отправь уведомление о заказе 123" → {"action":"send_order_notification","params":{"orderId":"123"},"needConfirm":false}
"отправь трек-номер ABC123 для заказа 456" → {"action":"send_shipping_notification","params":{"orderId":"456","trackingNumber":"ABC123"},"needConfirm":false}
"сделай рассылку подтверждений за сегодня" → {"action":"send_bulk_emails","params":{"type":"confirmation","dateFrom":"today"},"needConfirm":true}
"отправь маркетинговое письмо всем: Скидка 20%" → {"action":"send_marketing_campaign","params":{"subject":"Скидка 20%","content":"Скидка 20%"},"needConfirm":true}
"покажи статистику email за месяц" → {"action":"get_email_statistics","params":{"dateFrom":"month"},"needConfirm":false}
"рассчитай доставку для заказа 789" → {"action":"calculate_shipping","params":{"orderId":"789"},"needConfirm":false}
"можно доставить в США" → {"action":"check_shipping","params":{"countryCode":"US"},"needConfirm":false}
"обнови трек-номер для заказа 123: RU123456789CN" → {"action":"update_tracking","params":{"orderId":"123","trackingNumber":"RU123456789CN"},"needConfirm":false}
"статус доставки заказа 456" → {"action":"get_delivery_status","params":{"orderId":"456"},"needConfirm":false}
"покажи зоны доставки" → {"action":"get_shipping_zones","params":{},"needConfirm":false}
"рассчитай доставку для заказов 123 456 789" → {"action":"calculate_bulk_shipping","params":{"orderIds":["123","456","789"]},"needConfirm":false}
"покажи логи ошибок" → {"action":"view_logs","params":{"filter":"errors"},"needConfirm":false}
"статистика за неделю" → {"action":"view_statistics","params":{"dateFrom":"week"},"needConfirm":false}
"экспорт логов в csv" → {"action":"export_logs","params":{"format":"csv"},"needConfirm":false}
"очистить логи старше 30 дней" → {"action":"cleanup_logs","params":{"daysToKeep":30},"needConfirm":true}

ВАЖНО: needConfirm должен быть true для критичных операций:
- update_order_status (изменение статуса заказа)
- delete_product (удаление товара) 
- delete_order (удаление заказа)
- send_mass_message (массовая рассылка)
- refund_payment (возврат платежа)
- delete_home_video (удаление видео главной)
- delete_sign_video (удаление видео подписей)
- send_bulk_emails (массовая рассылка email)
- send_marketing_campaign (маркетинговая рассылка)
- calculate_bulk_shipping (массовый расчет доставки)
- cleanup_logs (очистка логов)`

async function createBot() {
  const bot = new Bot(BOT_TOKEN)
  await bot.init()

  // Проверка админа
  function isAdmin(userId: string): boolean {
    return ADMIN_IDS.includes(userId)
  }

  // AI анализ сообщения
  async function analyzeMessage(text: string, userId: string) {
    const startTime = Date.now()
    
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nСообщение пользователя: "${text}"\n\nОтвет JSON:`
      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      // Очистка ответа от возможных markdown блоков
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      const parsedResult = JSON.parse(cleanedText)
      
      // Логируем AI взаимодействие
      const duration = Date.now() - startTime
      await logAIInteraction(userId, text, parsedResult.action, parsedResult.params, duration)
      
      return parsedResult
    } catch (error) {
      console.error('AI analysis error:', error)
      await logError(userId, 'ai_analysis', error, { userMessage: text })
      return { action: 'unknown', params: {}, needConfirm: false }
    }
  }

  // Команда /start
  bot.command('start', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) {
      await ctx.reply('⛔ У вас нет доступа к этому боту')
      return
    }

    await ctx.reply(
      '👋 *AI Ассистент VOBVOROT*\\n\\n' +
      '🤖 Я понимаю естественный язык\\! Просто напишите, что нужно:\\n\\n' +
      '📦 *Заказы:*\\n' +
      '• Покажи заказы\\n' +
      '• Заказы за сегодня\\n' +
      '• Заказы со статусом новый\\n\\n' +
      '🛍 *Товары:*\\n' +
      '• Добавь платье за 2500\\n' +
      '• Найди товар юбка\\n' +
      '• Добавь категорию одежда\\n\\n' +
      '👥 *Клиенты:*\\n' +
      '• Найди клиента Мария\\n' +
      '• Покажи клиента по телефону\\n\\n' +
      '📊 *Статистика:*\\n' +
      '• Покажи статистику\\n' +
      '• Статистика за неделю\\n\\n' +
      '🎬 *Видео:*\\n' +
      '• Загрузи видео на главную\\n' +
      '• Покажи видео главной\\n' +
      '• Добавь видео подписей\\n' +
      '• Покажи видео подписей\\n\\n' +
      '📧 *Email:*\\n' +
      '• Отправь тестовое письмо\\n' +
      '• Отправь уведомление о заказе\\n' +
      '• Отправь трек\\-номер клиенту\\n' +
      '• Сделай рассылку за сегодня\\n\\n' +
      '💡 *Подсказка:* Пишите простыми фразами\\!',
      { parse_mode: 'MarkdownV2' }
    )
  })

  // Обработчик видео сообщений
  bot.on('message:video', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return
    await handleVideoUpload(ctx)
  })

  // Обработчик текстовых сообщений
  bot.on('message:text', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return

    // Проверка rate limit
    const rateCheck = rateLimiter.checkUserLimit(ctx.from.id.toString())
    if (!rateCheck.allowed) {
      await ctx.reply(
        `⏱ Слишком много запросов\\! Подождите ${rateCheck.resetIn} секунд\\.`,
        { parse_mode: 'MarkdownV2' }
      )
      return
    }

    // Проверка на подтверждение
    const messageText = ctx.message.text.toLowerCase()
    if (messageText === 'да' || messageText === 'yes' || messageText === 'подтверждаю') {
      const confirmation = confirmationManager.getLastConfirmation(ctx.from.id.toString())
      if (confirmation) {
        // Выполняем подтвержденное действие
        await executeAction(ctx, confirmation.action, confirmation.params)
        return
      }
    } else if (messageText === 'нет' || messageText === 'no' || messageText === 'отмена') {
      confirmationManager.cancelUserConfirmations(ctx.from.id.toString())
      await ctx.reply('❌ Операция отменена')
      return
    }

    // Показываем индикатор набора текста
    const typing = ctx.replyWithChatAction('typing')
    
    try {
      const result = await analyzeMessage(ctx.message.text, ctx.from.id.toString())
      console.log('AI analysis result:', result)
      
      // Подтверждение для критичных операций
      if (result.needConfirm) {
        confirmationManager.createConfirmation(
          ctx.from.id.toString(),
          result.action,
          result.params,
          ctx.message.message_id
        )
        
        await ctx.reply(
          `⚠️ *Требуется подтверждение\\!*\\n\\n` +
          `Действие: *${escapeMarkdownV2(result.action)}*\\n` +
          `Параметры:\\n\`\`\`\\n${escapeMarkdownV2(JSON.stringify(result.params, null, 2))}\\n\`\`\`\\n\\n` +
          `Отправьте *"да"* для подтверждения или *"нет"* для отмены\\.`,
          { parse_mode: 'MarkdownV2' }
        )
        return
      }
      
      // Выполнение действий
      await executeAction(ctx, result.action, result.params)
    } catch (error) {
      console.error('Message handling error:', error)
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
    } finally {
      typing.then(t => t.delete().catch(() => {}))
    }
  })

  return bot
}

// Определение категории действия
function getCategoryFromAction(action: string): 'command' | 'error' | 'ai_request' | 'ai_response' | 'system' | 'payment' | 'email' | 'delivery' {
  if (action.includes('payment') || action.includes('refund')) return 'payment'
  if (action.includes('email') || action.includes('send_')) return 'email'
  if (action.includes('shipping') || action.includes('delivery') || action.includes('tracking')) return 'delivery'
  if (action === 'unknown') return 'error'
  if (action.includes('logs') || action.includes('statistics') || action.includes('cleanup')) return 'system'
  return 'command'
}

// Функция выполнения действий
async function executeAction(ctx: any, action: string, params: any) {
  const userId = ctx.from?.id?.toString() || 'unknown'
  const username = ctx.from?.username || ctx.from?.first_name
  
  // Логируем действие
  await logAction({
    userId,
    username,
    action,
    category: getCategoryFromAction(action),
    details: params
  })
  
  switch (action) {
    case 'view_orders':
      await handleViewOrders(ctx, params)
      break
    case 'add_product':
      await handleAddProduct(ctx, params)
      break
    case 'search_customer':
      await handleSearchCustomer(ctx, params)
      break
    case 'stats':
      await handleStats(ctx, params)
      break
    case 'search_product':
      await handleSearchProduct(ctx, params)
      break
    case 'update_order_status':
      await handleUpdateOrderStatus(ctx, params)
      break
    case 'add_category':
      await handleAddCategory(ctx, params)
      break
    case 'view_categories':
      await handleViewCategories(ctx, params)
      break
    case 'upload_home_video':
      await handleUploadHomeVideo(ctx, params)
      break
    case 'view_home_video':
      await handleViewHomeVideo(ctx, params)
      break
    case 'delete_home_video':
      await handleDeleteHomeVideo(ctx, params)
      break
    case 'list_sign_videos':
      await handleListSignVideos(ctx, params)
      break
    case 'add_sign_video':
      await handleAddSignVideo(ctx, params)
      break
    case 'delete_sign_video':
      await handleDeleteSignVideo(ctx, params)
      break
    case 'refund_payment':
      await handleRefundPayment(ctx, params)
      break
    case 'check_payment_status':
      await handleCheckPaymentStatus(ctx, params)
      break
    case 'retry_payment':
      await handleRetryPayment(ctx, params)
      break
    case 'view_payment_info':
      await handleViewPaymentInfo(ctx, params)
      break
    case 'send_test_email':
      await handleSendTestEmail(ctx, params)
      break
    case 'send_order_notification':
      await handleSendOrderNotification(ctx, params)
      break
    case 'send_shipping_notification':
      await handleSendShippingNotification(ctx, params)
      break
    case 'send_bulk_emails':
      await handleSendBulkEmails(ctx, params)
      break
    case 'send_marketing_campaign':
      await handleSendMarketingCampaign(ctx, params)
      break
    case 'get_email_statistics':
      await handleGetEmailStatistics(ctx, params)
      break
    case 'calculate_shipping':
      await handleCalculateShipping(ctx, params)
      break
    case 'check_shipping':
      await handleCheckShipping(ctx, params)
      break
    case 'update_tracking':
      await handleUpdateTracking(ctx, params)
      break
    case 'get_delivery_status':
      await handleGetDeliveryStatus(ctx, params)
      break
    case 'get_shipping_zones':
      await handleGetShippingZones(ctx, params)
      break
    case 'calculate_bulk_shipping':
      await handleCalculateBulkShipping(ctx, params)
      break
    case 'view_logs':
      await handleViewLogs(ctx, params)
      break
    case 'view_statistics':
      await handleViewStatistics(ctx, params)
      break
    case 'export_logs':
      await handleExportLogs(ctx, params)
      break
    case 'cleanup_logs':
      await handleCleanupLogs(ctx, params)
      break
    default:
      await ctx.reply(
        '🤔 Не понял вашу команду. Попробуйте сформулировать иначе.\n\n' +
        'Примеры команд:\n' +
        '• Покажи заказы за сегодня\n' +
        '• Добавь товар Платье 2500\n' +
        '• Найди клиента Мария\n' +
        '• Загрузи видео на главную\n' +
        '• Покажи видео подписей\n' +
        '• Удали видео главной\n' +
        '• Добавь видео подписей\n' +
        '• Сделай возврат для заказа 123\n' +
        '• Проверь статус платежа 456'
      )
  }
}

// Обработчики действий

async function handleViewOrders(ctx: any, params: any) {
  const where: any = {}
  
  // Фильтр по периоду
  if (params.filter) {
    const now = new Date()
    switch (params.filter) {
      case 'today':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        where.createdAt = { gte: today }
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        where.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        where.createdAt = { gte: monthAgo }
        break
    }
  }
  
  // Фильтр по статусу
  if (params.status) {
    where.status = params.status
  }

  const orders = await prisma.order.findMany({
    where,
    include: { 
      customer: true, 
      orderItems: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  if (orders.length === 0) {
    await ctx.reply('📦 Заказов не найдено по вашему запросу')
    return
  }

  let message = `📦 *Найдено заказов: ${orders.length}*\\n\\n`
  
  for (const order of orders) {
    const items = order.orderItems
      .map(item => `• ${escapeMarkdownV2(item.product.name)} x${item.quantity}`)
      .join('\\n')
    
    message += `🛍 *Заказ \\#${escapeMarkdownV2(order.orderNumber)}*\\n`
    message += `👤 ${escapeMarkdownV2(order.customer.name)}\\n`
    message += `💰 ${escapeMarkdownV2(formatPrice(order.totalAmount))}\\n`
    message += `📦 Статус: ${escapeMarkdownV2(order.status)}\\n`
    message += `📅 ${escapeMarkdownV2(formatDate(order.createdAt))}\\n`
    if (items) {
      message += `📋 Товары:\\n${items}\\n`
    }
    message += `\\n`
  }

  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleAddProduct(ctx: any, params: any) {
  if (!params.name || !params.price) {
    await ctx.reply('❌ Укажите название и цену товара\n\nПример: "Добавь платье за 2500"')
    return
  }

  try {
    // Поиск или создание категории
    let categoryId = 1 // По умолчанию
    if (params.category) {
      const category = await prisma.category.findFirst({
        where: { 
          name: { 
            contains: params.category, 
            mode: 'insensitive' 
          } 
        }
      })
      if (category) {
        categoryId = category.id
      }
    }

    const product = await prisma.product.create({
      data: {
        name: params.name,
        price: Number(params.price),
        description: '',
        stock: 1,
        brandName: 'VOBVOROT',
        categoryId: categoryId,
        status: 'active'
      }
    })

    await ctx.reply(
      `✅ *Товар успешно создан\\!*\\n\\n` +
      `📦 *${escapeMarkdownV2(product.name)}*\\n` +
      `💰 ${escapeMarkdownV2(formatPrice(product.price))}\\n` +
      `🏷 ID: ${escapeMarkdownV2(product.id)}\\n` +
      `📂 Категория: ${escapeMarkdownV2(categoryId)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error adding product:', error)
    await ctx.reply('❌ Ошибка при создании товара. Проверьте данные и попробуйте снова.')
  }
}

async function handleSearchCustomer(ctx: any, params: any) {
  if (!params.query) {
    await ctx.reply('❌ Укажите имя, email или телефон клиента для поиска')
    return
  }

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: params.query, mode: 'insensitive' } },
        { email: { contains: params.query, mode: 'insensitive' } },
        { phone: { contains: params.query } }
      ]
    },
    include: { 
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    },
    take: 5
  })

  if (customers.length === 0) {
    await ctx.reply('👤 Клиенты не найдены по вашему запросу')
    return
  }

  let message = `👥 *Найдено клиентов: ${customers.length}*\\n\\n`
  
  for (const customer of customers) {
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0)
    
    message += `👤 *${escapeMarkdownV2(customer.name)}*\\n`
    message += `📧 ${escapeMarkdownV2(customer.email)}\\n`
    if (customer.phone) {
      message += `📱 ${escapeMarkdownV2(customer.phone)}\\n`
    }
    message += `🛍 Заказов: ${customer.orders.length}\\n`
    message += `💰 Общая сумма: ${escapeMarkdownV2(formatPrice(totalSpent))}\\n`
    message += `📅 Регистрация: ${escapeMarkdownV2(customer.createdAt.toLocaleDateString('ru'))}\\n`
    message += `\\n`
  }

  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleStats(ctx: any, params: any) {
  const where: any = {}
  let periodText = 'за всё время'
  
  // Фильтр по периоду
  if (params.period) {
    const now = new Date()
    switch (params.period) {
      case 'today':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        where.createdAt = { gte: today }
        periodText = 'за сегодня'
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        where.createdAt = { gte: weekAgo }
        periodText = 'за неделю'
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        where.createdAt = { gte: monthAgo }
        periodText = 'за месяц'
        break
    }
  }

  const stats = await prisma.$transaction([
    // Общее количество заказов
    prisma.order.count({ where }),
    // Сумма заказов
    prisma.order.aggregate({ 
      where,
      _sum: { totalAmount: true } 
    }),
    // Количество клиентов
    prisma.customer.count(),
    // Активные товары
    prisma.product.count({ where: { status: 'active' } }),
    // Заказы по статусам
    prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true
    })
  ])

  const orderCount = stats[0]
  const totalRevenue = stats[1]._sum.totalAmount || 0
  const customerCount = stats[2]
  const productCount = stats[3]
  const ordersByStatus = stats[4]

  let message = `📊 *Статистика магазина ${escapeMarkdownV2(periodText)}*\\n\\n`
  message += `📦 Всего заказов: ${orderCount}\\n`
  message += `💰 Общая выручка: ${escapeMarkdownV2(formatPrice(totalRevenue))}\\n`
  message += `👥 Клиентов: ${customerCount}\\n`
  message += `🛍 Активных товаров: ${productCount}\\n\\n`
  
  if (ordersByStatus.length > 0) {
    message += `*Заказы по статусам:*\\n`
    for (const status of ordersByStatus) {
      message += `• ${escapeMarkdownV2(status.status)}: ${status._count}\\n`
    }
  }

  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleSearchProduct(ctx: any, params: any) {
  if (!params.query) {
    await ctx.reply('❌ Укажите название товара для поиска')
    return
  }

  const products = await prisma.product.findMany({
    where: {
      AND: [
        { status: 'active' },
        {
          OR: [
            { name: { contains: params.query, mode: 'insensitive' } },
            { description: { contains: params.query, mode: 'insensitive' } }
          ]
        }
      ]
    },
    include: { category: true },
    take: 10
  })

  if (products.length === 0) {
    await ctx.reply('🛍 Товары не найдены по вашему запросу')
    return
  }

  let message = `🛍 *Найдено товаров: ${products.length}*\\n\\n`
  
  for (const product of products) {
    message += `📦 *${escapeMarkdownV2(product.name)}*\\n`
    message += `💰 ${escapeMarkdownV2(formatPrice(product.price))}\\n`
    if (product.description) {
      const desc = product.description.substring(0, 50)
      message += `📝 ${escapeMarkdownV2(desc)}${product.description.length > 50 ? '\\.\\.\\.' : ''}\\n`
    }
    message += `📂 Категория: ${escapeMarkdownV2(product.category?.name || 'Без категории')}\\n`
    message += `📊 На складе: ${escapeMarkdownV2(product.stock)}\\n`
    message += `🆔 ID: ${escapeMarkdownV2(product.id)}\\n`
    message += `\\n`
  }

  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleUpdateOrderStatus(ctx: any, params: any) {
  if (!params.orderId || !params.status) {
    await ctx.reply('❌ Укажите номер заказа и новый статус')
    return
  }

  try {
    const order = await prisma.order.update({
      where: { orderNumber: String(params.orderId) },
      data: { status: params.status },
      include: { customer: true }
    })

    await ctx.reply(
      `✅ *Статус заказа обновлен\\!*\\n\\n` +
      `🛍 Заказ \\#${escapeMarkdownV2(order.orderNumber)}\\n` +
      `👤 Клиент: ${escapeMarkdownV2(order.customer.name)}\\n` +
      `📦 Новый статус: ${escapeMarkdownV2(order.status)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    await ctx.reply('❌ Ошибка при обновлении статуса. Проверьте номер заказа.')
  }
}

async function handleAddCategory(ctx: any, params: any) {
  if (!params.name) {
    await ctx.reply('❌ Укажите название категории')
    return
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: params.name,
        emoji: params.emoji || '📦',
        order: 999
      }
    })

    await ctx.reply(
      `✅ *Категория создана\\!*\\n\\n` +
      `${escapeMarkdownV2(category.emoji)} *${escapeMarkdownV2(category.name)}*\\n` +
      `🆔 ID: ${escapeMarkdownV2(category.id)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    await ctx.reply('❌ Ошибка при создании категории. Возможно, такая категория уже существует.')
  }
}

async function handleViewCategories(ctx: any, params: any) {
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  })

  if (categories.length === 0) {
    await ctx.reply('📂 Категории не найдены')
    return
  }

  let message = `📂 *Категории товаров:*\\n\\n`
  
  for (const category of categories) {
    message += `${escapeMarkdownV2(category.emoji)} *${escapeMarkdownV2(category.name)}*\\n`
    message += `🛍 Товаров: ${category._count.products}\\n`
    message += `🆔 ID: ${escapeMarkdownV2(category.id)}\\n\\n`
  }

  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

// Видео обработчики

async function handleUploadHomeVideo(ctx: any, params: any) {
  await ctx.reply(
    '🎬 *Загрузка видео на главную страницу*\\\\n\\\\n' +
    'Отправьте видео файл \\(рекомендуется MP4\\)\\\\n' +
    'Максимальный размер: 50MB\\\\n\\\\n' +
    '⚠️ Видео заменит текущее на главной странице\\\\n\\\\n' +
    '📱 *Команда:* Отправьте видео с подписью "главная"',
    { parse_mode: 'MarkdownV2' }
  )
}

async function handleViewHomeVideo(ctx: any, params: any) {
  const video = await getHomeVideo()
  
  if (!video) {
    await ctx.reply('❌ Видео на главной странице не установлено')
    return
  }
  
  await ctx.reply(
    `🎬 *Видео главной страницы*\\\\n\\\\n` +
    `🔗 [Просмотреть видео](${escapeMarkdownV2(video.url)})\\\\n` +
    `📅 Обновлено: ${escapeMarkdownV2(video.createdAt?.toLocaleDateString('ru') || 'Неизвестно')}\\\\n\\\\n` +
    `📍 Отображается на главной странице сайта`,
    { parse_mode: 'MarkdownV2' }
  )
}

async function handleDeleteHomeVideo(ctx: any, params: any) {
  const result = await updateHomeVideo('')
  
  if (result.success) {
    await ctx.reply('✅ Видео с главной страницы удалено')
  } else {
    await ctx.reply(`❌ Ошибка удаления: ${result.error}`)
  }
}

async function handleListSignVideos(ctx: any, params: any) {
  const videos = await getSignVideos()
  
  if (videos.length === 0) {
    await ctx.reply(
      '📹 *Видео подписей*\\\\n\\\\n' +
      'Видео пока не добавлены\\\\n\\\\n' +
      '💡 Используйте команду "добавь видео подписей" для загрузки',
      { parse_mode: 'MarkdownV2' }
    )
    return
  }
  
  const message = `📹 *Видео подписей \\(${videos.length}\\)*\\\\n\\\\n` +
    formatVideoList(videos) + '\\\\n\\\\n' +
    '📍 Отображаются на странице /your\\\\-name\\\\-my\\\\-pic'
  
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleAddSignVideo(ctx: any, params: any) {
  await ctx.reply(
    '🎬 *Добавление видео подписей*\\\\n\\\\n' +
    'Отправьте видео файл \\(рекомендуется MP4\\)\\\\n' +
    'Максимальный размер: 50MB\\\\n\\\\n' +
    '📍 Видео будет добавлено на страницу подписей\\\\n\\\\n' +
    '📱 *Команда:* Отправьте видео с подписью "подписи"',
    { parse_mode: 'MarkdownV2' }
  )
}

async function handleDeleteSignVideo(ctx: any, params: any) {
  if (!params.videoId) {
    await ctx.reply('❌ Укажите ID видео для удаления\\\\n\\\\nПример: "удали видео подписей sign\\\\_video\\\\_123"')
    return
  }
  
  const result = await deleteSignVideo(params.videoId)
  
  if (result.success) {
    await ctx.reply('✅ Видео удалено из галереи подписей')
  } else {
    await ctx.reply(`❌ Ошибка удаления: ${result.error}`)
  }
}

// Обработка загрузки видео
async function handleVideoUpload(ctx: any) {
  if (!ctx.message?.video) {
    await ctx.reply('❌ Пожалуйста, отправьте видео файл')
    return
  }
  
  // Определяем тип видео по подписи сообщения
  const caption = ctx.message.caption?.toLowerCase() || ''
  let videoType: 'home' | 'sign' | null = null
  
  if (caption.includes('главная') || caption.includes('главную') || caption.includes('home')) {
    videoType = 'home'
  } else if (caption.includes('подпис') || caption.includes('sign')) {
    videoType = 'sign'
  }
  
  if (!videoType) {
    await ctx.reply(
      '❌ Укажите тип видео в подписи:\\n\\n' +
      '• Для главной страницы: "главная"\\n' +
      '• Для страницы подписей: "подписи"\\n\\n' +
      'Пример: отправьте видео с подписью "главная"'
    )
    return
  }
  
  // Показываем индикатор загрузки
  const loadingMsg = await ctx.reply('⏳ Загружаю видео в облако...')
  
  try {
    const video = ctx.message.video
    const folder = videoType === 'home' ? 'vobvorot-home' : 'sign-page'
    
    // Загружаем видео в Cloudinary
    const uploadResult = await uploadVideoFromTelegram(video.file_id, folder)
    
    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(uploadResult.error || 'Ошибка загрузки')
    }
    
    // Сохраняем видео в зависимости от типа
    if (videoType === 'home') {
      const result = await updateHomeVideo(uploadResult.url)
      if (result.success) {
        await ctx.reply(
          '✅ *Видео успешно загружено на главную\\\\!*\\\\n\\\\n' +
          `🔗 [Просмотреть](${escapeMarkdownV2(uploadResult.url)})\\\\n` +
          '📍 Теперь отображается на главной странице',
          { parse_mode: 'MarkdownV2' }
        )
      } else {
        throw new Error(result.error)
      }
    } else if (videoType === 'sign') {
      const result = await addSignVideo(uploadResult.url)
      if (result.success) {
        await ctx.reply(
          '✅ *Видео добавлено в галерею подписей\\\\!*\\\\n\\\\n' +
          `🔗 [Просмотреть](${escapeMarkdownV2(uploadResult.url)})\\\\n` +
          '📍 Отображается на странице /your\\\\-name\\\\-my\\\\-pic',
          { parse_mode: 'MarkdownV2' }
        )
      } else {
        throw new Error(result.error)
      }
    }
    
  } catch (error: any) {
    console.error('Video upload error:', error)
    await ctx.reply(`❌ Ошибка загрузки видео: ${error.message}`)
  } finally {
    // Удаляем сообщение о загрузке
    try {
      await ctx.api.deleteMessage(loadingMsg.chat.id, loadingMsg.message_id)
    } catch (e) {}
  }
}

// Платежные обработчики

async function handleRefundPayment(ctx: any, params: any) {
  if (!params.orderId || !params.reason) {
    await ctx.reply('❌ Укажите номер заказа и причину возврата\n\nПример: "сделай возврат для заказа 123 причина брак"')
    return
  }

  const paymentInfo = await getPaymentInfo(params.orderId)
  
  if (!paymentInfo) {
    await ctx.reply(`❌ Заказ #${escapeMarkdownV2(params.orderId)} не найден`)
    return
  }
  
  if (!paymentInfo.canRefund) {
    await ctx.reply(
      `❌ Возврат для заказа \\#${escapeMarkdownV2(paymentInfo.orderNumber)} недоступен\\n\\n` +
      `Статус платежа: ${escapeMarkdownV2(paymentInfo.paymentStatus)}`
    )
    return
  }
  
  // Показываем процесс
  const processingMsg = await ctx.reply('💸 Обрабатываю возврат...')
  
  try {
    const refundResult = await refundPayment(
      paymentInfo.orderId,
      params.reason,
      params.amount
    )
    
    const resultMessage = formatRefundInfo(refundResult, paymentInfo.orderNumber)
    await ctx.reply(resultMessage, { parse_mode: 'MarkdownV2' })
    
  } catch (error: any) {
    console.error('Refund error:', error)
    await ctx.reply(`❌ Ошибка при возврате: ${error.message}`)
  } finally {
    try {
      await ctx.api.deleteMessage(processingMsg.chat.id, processingMsg.message_id)
    } catch (e) {}
  }
}

async function handleCheckPaymentStatus(ctx: any, params: any) {
  if (!params.orderId) {
    await ctx.reply('❌ Укажите номер заказа\n\nПример: "проверь статус платежа 123"')
    return
  }
  
  const statusMessage = await checkPaymentStatus(params.orderId)
  await ctx.reply(statusMessage, { parse_mode: 'MarkdownV2' })
}

async function handleRetryPayment(ctx: any, params: any) {
  if (!params.orderId) {
    await ctx.reply('❌ Укажите номер заказа для повторной оплаты\n\nПример: "повтори платеж для заказа 123"')
    return
  }
  
  const processingMsg = await ctx.reply('🔄 Создаю новую платежную сессию...')
  
  try {
    const result = await retryPayment(params.orderId)
    
    if (result.success) {
      await ctx.reply(
        `✅ *Новая платежная сессия создана\\!*\\n\\n` +
        `🆔 Заказ: \\#${escapeMarkdownV2(params.orderId)}\\n` +
        `💳 ID платежа: \\\`${escapeMarkdownV2(result.paymentId || 'н/д')}\\\`\\n\\n` +
        `🔗 Отправьте ссылку клиенту для оплаты`,
        { parse_mode: 'MarkdownV2' }
      )
    } else {
      await ctx.reply(`❌ Ошибка создания платежа: ${result.error}`)
    }
  } catch (error: any) {
    console.error('Retry payment error:', error)
    await ctx.reply(`❌ Ошибка: ${error.message}`)
  } finally {
    try {
      await ctx.api.deleteMessage(processingMsg.chat.id, processingMsg.message_id)
    } catch (e) {}
  }
}

async function handleViewPaymentInfo(ctx: any, params: any) {
  if (!params.orderId) {
    await ctx.reply('❌ Укажите номер заказа\n\nПример: "информация о платеже 123"')
    return
  }
  
  const paymentInfo = await getPaymentInfo(params.orderId)
  
  if (!paymentInfo) {
    await ctx.reply(`❌ Заказ #${escapeMarkdownV2(params.orderId)} не найден`)
    return
  }
  
  const message = formatPaymentInfo(paymentInfo)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

// Email handlers
async function handleSendTestEmail(ctx: any, params: any) {
  if (!params.email) {
    await ctx.reply('❌ Укажите email адрес\n\nПример: "отправь тестовое письмо на test@example.com"')
    return
  }

  const result = await sendTestEmail(params.email)
  const message = formatEmailResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleSendOrderNotification(ctx: any, params: any) {
  if (!params.orderId) {
    await ctx.reply('❌ Укажите номер заказа\n\nПример: "отправь уведомление о заказе 123"')
    return
  }

  const result = await sendOrderNotificationEmail(params.orderId, params.type || 'confirmation')
  const message = formatEmailResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleSendShippingNotification(ctx: any, params: any) {
  if (!params.orderId || !params.trackingNumber) {
    await ctx.reply('❌ Укажите номер заказа и трек-номер\n\nПример: "отправь трек-номер ABC123 для заказа 456"')
    return
  }

  const result = await sendShippingNotificationEmail(params.orderId, params.trackingNumber, params.carrier)
  const message = formatEmailResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleSendBulkEmails(ctx: any, params: any) {
  if (!params.type) {
    await ctx.reply('❌ Укажите тип рассылки\n\nПример: "сделай рассылку подтверждений за сегодня"')
    return
  }

  await ctx.reply('📧 Выполняю массовую рассылку...')
  const result = await sendBulkEmails(params)
  const message = formatBulkEmailResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleSendMarketingCampaign(ctx: any, params: any) {
  if (!params.subject || !params.content) {
    await ctx.reply('❌ Укажите тему и содержание письма\n\nПример: "отправь маркетинговое письмо всем: Скидка 20% на все товары"')
    return
  }

  await ctx.reply('📧 Запускаю маркетинговую кампанию...')
  const result = await sendMarketingCampaign(params)
  const message = formatBulkEmailResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleGetEmailStatistics(ctx: any, params: any) {
  const result = await getEmailStatistics(params.dateFrom, params.dateTo)
  const message = formatEmailStats(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

// Delivery handlers
async function handleCalculateShipping(ctx: any, params: any) {
  if (!params.orderId) {
    await ctx.reply('❌ Укажите номер заказа\n\nПример: "рассчитай доставку для заказа 789"')
    return
  }

  const result = await calculateOrderShipping(
    params.orderId, 
    params.packageType || 'box',
    params.currency || 'USD'
  )
  const message = formatShippingResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleCheckShipping(ctx: any, params: any) {
  if (!params.countryCode) {
    await ctx.reply('❌ Укажите код страны\n\nПример: "можно доставить в США" (код US)')
    return
  }

  const result = await checkShippingAvailability(params.countryCode, params.weight)
  const message = formatShippingResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleUpdateTracking(ctx: any, params: any) {
  if (!params.orderId || !params.trackingNumber) {
    await ctx.reply('❌ Укажите номер заказа и трек-номер\n\nПример: "обнови трек-номер для заказа 123: RU123456789CN"')
    return
  }

  const result = await updateOrderTracking(
    params.orderId,
    params.trackingNumber,
    params.carrier
  )
  const message = formatShippingResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleGetDeliveryStatus(ctx: any, params: any) {
  if (!params.orderId) {
    await ctx.reply('❌ Укажите номер заказа\n\nПример: "статус доставки заказа 456"')
    return
  }

  const result = await getDeliveryStatus(params.orderId)
  const message = formatShippingResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleGetShippingZones(ctx: any, params: any) {
  const result = await getShippingZones()
  const message = formatShippingResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleCalculateBulkShipping(ctx: any, params: any) {
  if (!params.orderIds || !Array.isArray(params.orderIds)) {
    await ctx.reply('❌ Укажите номера заказов\n\nПример: "рассчитай доставку для заказов 123 456 789"')
    return
  }

  await ctx.reply('📦 Выполняю массовый расчет доставки...')
  const result = await calculateBulkShipping(
    params.orderIds,
    params.packageType || 'box',
    params.currency || 'USD'
  )
  const message = formatBulkShippingResult(result)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

// Logging handlers
async function handleViewLogs(ctx: any, params: any) {
  const filter: any = {}
  
  if (params.filter === 'errors') {
    const logs = await getErrorLogs()
    const message = formatLogs(logs, 'Логи ошибок')
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
    return
  }
  
  if (params.filter === 'user' && params.userId) {
    filter.userId = params.userId
  }
  
  if (params.dateFrom) {
    const days = params.dateFrom === 'today' ? 1 : params.dateFrom === 'week' ? 7 : params.dateFrom === 'month' ? 30 : 0
    if (days > 0) {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
      filter.dateFrom = dateFrom
    }
  }
  
  const logs = await getActionLogs(filter)
  const message = formatLogs(logs, 'Последние логи')
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleViewStatistics(ctx: any, params: any) {
  let dateFrom: Date | undefined
  
  if (params.dateFrom) {
    const days = params.dateFrom === 'today' ? 1 : params.dateFrom === 'week' ? 7 : params.dateFrom === 'month' ? 30 : 0
    if (days > 0) {
      dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
    }
  }
  
  const stats = await getUsageStatistics(dateFrom)
  const message = formatUsageStats(stats)
  await ctx.reply(message, { parse_mode: 'MarkdownV2' })
}

async function handleExportLogs(ctx: any, params: any) {
  try {
    const filter: any = {}
    
    if (params.dateFrom) {
      const days = params.dateFrom === 'today' ? 1 : params.dateFrom === 'week' ? 7 : params.dateFrom === 'month' ? 30 : 0
      if (days > 0) {
        const dateFrom = new Date()
        dateFrom.setDate(dateFrom.getDate() - days)
        filter.dateFrom = dateFrom
      }
    }
    
    const format = params.format || 'csv'
    const content = await exportLogs(filter, format)
    
    // Отправляем файл
    const filename = `bot_logs_${new Date().toISOString().split('T')[0]}.${format}`
    const buffer = Buffer.from(content, 'utf-8')
    
    await ctx.replyWithDocument({
      source: buffer,
      filename: filename
    }, {
      caption: `📄 Экспорт логов в формате ${format.toUpperCase()}`
    })
  } catch (error) {
    await ctx.reply('❌ Ошибка при экспорте логов')
  }
}

async function handleCleanupLogs(ctx: any, params: any) {
  const daysToKeep = params.daysToKeep || 30
  
  await ctx.reply(`🧹 Начинаю очистку логов старше ${daysToKeep} дней...`)
  
  const deletedCount = await cleanupOldLogs(daysToKeep)
  
  await ctx.reply(
    `✅ Очистка завершена\\!\n\n` +
    `🗑️ Удалено записей: ${escapeMarkdownV2(deletedCount.toString())}\n` +
    `📅 Сохранены логи за последние ${escapeMarkdownV2(daysToKeep.toString())} дней`,
    { parse_mode: 'MarkdownV2' }
  )
}

// Webhook handler
export async function POST(req: NextRequest) {
  try {
    // Проверка secret token
    const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token')
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET || 'vobvorot_webhook_secret_2025'
    
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    console.log('Secret token from header:', secretToken)
    console.log('Expected token:', expectedToken)
    
    if (secretToken !== expectedToken) {
      console.error('Token mismatch - received:', secretToken, 'expected:', expectedToken)
      return new Response('Unauthorized', { status: 401 })
    }
    
    const bot = await createBot()
    const handleUpdate = webhookCallback(bot, 'std/http')
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}