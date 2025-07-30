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

// Hardcoded values для отладки (чтобы избежать проблем с env vars)
const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAYSLsD4XW40XJm5uv6w71bYoZkTAeoU7Y'
const WEBHOOK_SECRET = 'vobvorot_webhook_secret_2025' // Hardcoded для тестирования

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

ВАЖНО: needConfirm должен быть true для критичных операций.`

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
      '💡 *Подсказка:* Пишите простыми фразами\\!',
      { parse_mode: 'MarkdownV2' }
    )
  })

  // Обработчик текстовых сообщений
  bot.on('message:text', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return

    await ctx.reply('🤖 Функция временно недоступна из-за технических работ')
  })

  return bot
}

// Webhook handler с детальным логированием
export async function POST(req: NextRequest) {
  try {
    console.log('=== WEBHOOK DEBUG START ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('URL:', req.url)
    console.log('Method:', req.method)
    
    // Логируем все заголовки
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log('Headers:', JSON.stringify(headers, null, 2))
    
    // Проверяем наличие secret token
    const receivedToken = req.headers.get('x-telegram-bot-api-secret-token')
    console.log('Received Secret Token:', receivedToken)
    console.log('Expected Secret Token:', WEBHOOK_SECRET)
    console.log('Tokens Match:', receivedToken === WEBHOOK_SECRET)
    
    // Получаем тело запроса
    const body = await req.text()
    console.log('Body Length:', body.length)
    console.log('Body Preview:', body.substring(0, 200))
    
    // Пробуем распарсить JSON
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
      console.log('Parsed Body:', JSON.stringify(parsedBody, null, 2))
    } catch (e) {
      console.error('Failed to parse body as JSON:', e)
    }
    
    console.log('=== WEBHOOK DEBUG END ===')
    
    // Проверяем secret token вручную
    if (receivedToken !== WEBHOOK_SECRET) {
      console.error('SECRET TOKEN MISMATCH!')
      console.error('Expected:', WEBHOOK_SECRET)
      console.error('Received:', receivedToken)
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Создаем новый Request с восстановленным body
    const newReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: body
    })
    
    const bot = await createBot()
    
    // Используем Grammy webhookCallback без secret token (проверяем вручную)
    const handleUpdate = webhookCallback(bot, 'std/http')
    
    return handleUpdate(newReq)
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===')
    console.error('Error Type:', error.constructor.name)
    console.error('Error Message:', error.message)
    console.error('Error Stack:', error.stack)
    console.error('=== END ERROR ===')
    return new Response('Error', { status: 500 })
  }
}