import { Bot, webhookCallback, InlineKeyboard } from 'grammy'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Import all comprehensive handler modules
import * as OrderHandlers from './handlers/order-handlers'
import * as ProductHandlers from './handlers/product-handlers'
import * as CategoryHandlers from './handlers/category-handlers'
import * as VideoHandlers from './handlers/video-handlers'
import * as CrmHandlers from './handlers/crm-handlers'
import * as StatsHandlers from './handlers/stats-handlers'
import * as ReviewHandlers from './handlers/review-handlers'
import * as DeliveryHandlers from './handlers/delivery-handlers'
import * as PaymentHandlers from './handlers/payment-handlers'
import * as SystemHandlers from './handlers/system-handlers'
import * as AiHandlers from './handlers/ai-handlers'
import * as MarketingHandlers from './handlers/marketing-handlers'

// Import existing utilities
import { escapeMarkdownV2, formatDate, formatPrice } from './utils'
import { rateLimiter } from './rate-limiter'
import { confirmationManager } from './confirmation-manager'

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// System prompt для анализа намерений - ПОЛНЫЙ СПИСОК 100+ ФУНКЦИЙ
const SYSTEM_PROMPT = `Ты AI ассистент магазина VOBVOROT. Анализируй сообщения и возвращай JSON с действием.

ВАЖНО: Возвращай ТОЛЬКО валидный JSON без дополнительного текста!

Формат ответа:
{
  "action": "string",
  "params": {},
  "needConfirm": boolean
}

Доступные действия (106 функций):

=== ЗАКАЗЫ (15 функций) ===
- view_orders: показать заказы (params: {filter?: string, status?: string, limit?: number})
- search_order: найти заказ (params: {query: string, type?: "id"|"email"|"phone"})
- order_details: детали заказа (params: {orderId: string})
- update_order_status: изменить статус заказа (params: {orderId: string, status: string, notes?: string})
- add_tracking: добавить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- cancel_order: отменить заказ (params: {orderId: string, reason?: string})
- order_history: история заказа (params: {orderId: string})
- bulk_order_update: массовое обновление статусов (params: {status: string, orderIds: string[]})
- pending_orders: заказы в ожидании (params: {days?: number})
- today_orders: заказы за сегодня (params: {})
- urgent_orders: срочные заказы (params: {})
- problem_orders: проблемные заказы (params: {})
- export_orders: экспорт заказов (params: {format?: "csv"|"excel", dateFrom?: string, dateTo?: string})
- order_analytics: аналитика заказов (params: {period?: "week"|"month"|"quarter"})
- duplicate_orders: дублирующиеся заказы (params: {})

=== ТОВАРЫ (20 функций) ===
- add_product: добавить товар (params: {name: string, price: number, category?: string, description?: string})
- edit_product: редактировать товар (params: {productId: string, name?: string, price?: number, description?: string})
- delete_product: удалить товар (params: {productId: string})
- search_product: найти товар (params: {query: string})
- view_products: показать товары (params: {category?: string, status?: string, limit?: number})
- update_product_price: обновить цену (params: {productId: string, price: number})
- update_product_stock: обновить остатки (params: {productId: string, quantity: number})
- product_details: детали товара (params: {productId: string})
- low_stock_products: товары с низким остатком (params: {threshold?: number})
- top_products: популярные товары (params: {period?: "week"|"month", limit?: number})
- product_analytics: аналитика товаров (params: {productId?: string, period?: string})
- duplicate_products: дублирующиеся товары (params: {})
- bulk_price_update: массовое обновление цен (params: {categoryId?: string, percentage: number})
- import_products: импорт товаров (params: {source: string})
- export_products: экспорт товаров (params: {format?: "csv"|"excel", categoryId?: string})
- product_recommendations: рекомендации товаров (params: {customerId?: string})
- set_product_featured: сделать товар рекомендуемым (params: {productId: string, featured: boolean})
- product_variants: варианты товара (params: {productId: string})
- product_reviews_summary: сводка отзывов (params: {productId: string})
- archive_products: архивировать товары (params: {productIds: string[]})

=== КАТЕГОРИИ (6 функций) ===
- add_category: создать категорию (params: {name: string, emoji?: string, parentId?: string})
- view_categories: показать категории (params: {})
- edit_category: редактировать категорию (params: {categoryId: string, name?: string, emoji?: string})
- delete_category: удалить категорию (params: {categoryId: string})
- reorder_categories: изменить порядок категорий (params: {categoryIds: string[]})
- category_stats: статистика категорий (params: {categoryId?: string})

=== ВИДЕО (10 функций) ===
- upload_main_video: загрузить главное видео (params: {videoUrl?: string})
- view_main_videos: показать главные видео (params: {})
- delete_main_video: удалить главное видео (params: {videoId: string})
- upload_product_video: загрузить видео товара (params: {productId: string, videoUrl?: string})
- view_product_videos: показать видео товаров (params: {productId?: string})
- delete_product_video: удалить видео товара (params: {videoId: string})
- upload_sign_video: загрузить видео подписи (params: {})
- view_sign_videos: показать видео подписей (params: {})
- delete_sign_video: удалить видео подписи (params: {videoId: string})
- video_analytics: аналитика видео (params: {videoId?: string})

=== CRM И КЛИЕНТЫ (16 функций) ===
- search_customer: найти клиента (params: {query: string})
- customer_details: детали клиента (params: {customerId: string})
- customer_history: история клиента (params: {customerId: string})
- add_customer_note: добавить заметку о клиенте (params: {customerId: string, note: string})
- top_customers: лучшие клиенты (params: {period?: string, limit?: number})
- customer_segmentation: сегментация клиентов (params: {})
- inactive_customers: неактивные клиенты (params: {days?: number})
- new_customers: новые клиенты (params: {days?: number})
- customer_lifetime_value: LTV клиента (params: {customerId: string})
- customer_recommendations: рекомендации для клиента (params: {customerId: string})
- export_customers: экспорт клиентов (params: {format?: "csv"|"excel", segment?: string})
- merge_customers: объединить клиентов (params: {primaryId: string, duplicateId: string})
- customer_tags: теги клиентов (params: {customerId?: string})
- add_customer_tag: добавить тег клиенту (params: {customerId: string, tag: string})
- remove_customer_tag: удалить тег клиента (params: {customerId: string, tag: string})
- customer_communication_log: лог общения с клиентом (params: {customerId: string})

=== СТАТИСТИКА И АНАЛИТИКА (15 функций) ===
- general_stats: общая статистика (params: {period?: "today"|"week"|"month"|"year"})
- sales_report: отчет по продажам (params: {period?: string, format?: string})
- revenue_analysis: анализ выручки (params: {period?: string, breakdown?: "daily"|"weekly"|"monthly"})
- top_products_report: отчет по популярным товарам (params: {period?: string, limit?: number})
- customer_analytics: аналитика клиентов (params: {segment?: string, period?: string})
- conversion_analysis: анализ конверсии (params: {period?: string})
- traffic_sources: источники трафика (params: {period?: string})
- abandon_cart_analysis: анализ брошенных корзин (params: {period?: string})
- seasonal_trends: сезонные тренды (params: {period?: "year"|"quarter"})
- geo_analytics: географическая аналитика (params: {period?: string})
- profit_margins: анализ маржинальности (params: {categoryId?: string, period?: string})
- inventory_turnover: оборачиваемость товаров (params: {period?: string})
- compare_periods: сравнение периодов (params: {period1: string, period2: string})
- forecast_analysis: прогнозная аналитика (params: {type: "sales"|"inventory", period: string})
- kpi_dashboard: KPI дашборд (params: {period?: string})

=== ОТЗЫВЫ (6 функций) ===
- view_reviews: показать отзывы (params: {productId?: string, rating?: number, status?: string})
- moderate_review: модерировать отзыв (params: {reviewId: string, action: "approve"|"reject", reason?: string})
- respond_to_review: ответить на отзыв (params: {reviewId: string, response: string})
- review_analytics: аналитика отзывов (params: {period?: string, productId?: string})
- export_reviews: экспорт отзывов (params: {format?: "csv"|"excel", productId?: string})
- flag_review: пожаловаться на отзыв (params: {reviewId: string, reason: string})

=== ДОСТАВКА (10 функций) ===
- calculate_shipping: рассчитать доставку (params: {orderId: string, country?: string, weight?: number})
- shipping_zones: зоны доставки (params: {})
- update_shipping_rates: обновить тарифы доставки (params: {zone: string, rates: object})
- track_shipment: отследить отправление (params: {trackingNumber: string})
- bulk_shipping_labels: массовая печать этикеток (params: {orderIds: string[]})
- shipping_analytics: аналитика доставки (params: {period?: string, carrier?: string})
- delivery_performance: эффективность доставки (params: {period?: string})
- shipping_issues: проблемы с доставкой (params: {status?: string})
- carrier_comparison: сравнение перевозчиков (params: {period?: string})
- delivery_time_analysis: анализ времени доставки (params: {period?: string, destination?: string})

=== ПЛАТЕЖИ (8 функций) ===
- process_payment: обработать платеж (params: {orderId: string, amount: number, method: string})
- refund_payment: возврат платежа (params: {paymentId: string, amount?: number, reason?: string})
- view_payments: показать платежи (params: {status?: string, method?: string, orderId?: string})
- payment_statistics: статистика платежей (params: {period?: string})
- failed_payments: неудачные платежи (params: {period?: string})
- update_payment_status: обновить статус платежа (params: {paymentId: string, status: string})
- export_payments: экспорт платежей (params: {format?: "csv", status?: string})
- recurring_payments: регулярные платежи (params: {customerId: string, amount: number, frequency: string})

=== СИСТЕМНЫЕ ФУНКЦИИ (10 функций) ===
- system_status: статус системы (params: {})
- database_backup: резервная копия БД (params: {tables?: string})
- system_logs: системные логи (params: {level?: string, limit?: number})
- clear_cache: очистить кеш (params: {type?: string})
- system_maintenance: режим обслуживания (params: {action: "enable"|"disable"|"status"})
- health_check: проверка здоровья системы (params: {})
- system_configuration: конфигурация системы (params: {action: "get"|"set"|"list", key?: string, value?: string})
- restart_service: перезапуск сервиса (params: {service: string})
- system_analytics: системная аналитика (params: {period?: string})
- system_notifications: системные уведомления (params: {action: "send"|"list"|"configure"})

=== AI АВТОМАТИЗАЦИЯ (5 функций) ===
- auto_restock: автопополнение (params: {threshold?: number, enabled?: boolean})
- price_optimization: оптимизация цен (params: {productId?: string, mode?: string})
- sales_forecasting: прогнозирование продаж (params: {period?: string, productId?: string})
- customer_segmentation_ai: AI сегментация клиентов (params: {action?: string})
- inventory_optimization: оптимизация складских остатков (params: {category?: string})

=== МАРКЕТИНГ И ПРОМО (5 функций) ===
- create_promo_code: создать промокод (params: {code: string, discountType: string, discountValue: number})
- view_promo_codes: показать промокоды (params: {status?: string})
- email_campaign: email кампания (params: {campaignName: string, subject: string, segment?: string})
- analytics_report: маркетинговый отчет (params: {period?: string, metrics?: string})
- social_media_post: пост в соцсети (params: {platform?: string, postType?: string, productId?: string})

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

// Функция выполнения действий - ПОЛНЫЙ СПИСОК 106 ФУНКЦИЙ
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
    // === ЗАКАЗЫ (15 функций) ===
    case 'view_orders':
      await OrderHandlers.handleViewOrders(ctx, params)
      break
    case 'search_order':
      await OrderHandlers.handleSearchOrder(ctx, params)
      break
    case 'order_details':
      await OrderHandlers.handleOrderDetails(ctx, params)
      break
    case 'update_order_status':
      await OrderHandlers.handleUpdateOrderStatus(ctx, params)
      break
    case 'add_tracking':
      await OrderHandlers.handleAddTracking(ctx, params)
      break
    case 'cancel_order':
      await OrderHandlers.handleCancelOrder(ctx, params)
      break
    case 'order_history':
      await OrderHandlers.handleOrderHistory(ctx, params)
      break
    case 'bulk_order_update':
      await OrderHandlers.handleBulkOrderUpdate(ctx, params)
      break
    case 'pending_orders':
      await OrderHandlers.handlePendingOrders(ctx, params)
      break
    case 'today_orders':
      await OrderHandlers.handleTodayOrders(ctx, params)
      break
    case 'urgent_orders':
      await OrderHandlers.handleUrgentOrders(ctx, params)
      break
    case 'problem_orders':
      await OrderHandlers.handleProblemOrders(ctx, params)
      break
    case 'export_orders':
      await OrderHandlers.handleExportOrders(ctx, params)
      break
    case 'order_analytics':
      await OrderHandlers.handleOrderAnalytics(ctx, params)
      break
    case 'duplicate_orders':
      await OrderHandlers.handleDuplicateOrders(ctx, params)
      break
    
    // === ТОВАРЫ (20 функций) ===
    case 'add_product':
      await ProductHandlers.handleAddProduct(ctx, params)
      break
    case 'edit_product':
      await ProductHandlers.handleEditProduct(ctx, params)
      break
    case 'delete_product':
      await ProductHandlers.handleDeleteProduct(ctx, params)
      break
    case 'search_product':
      await ProductHandlers.handleSearchProduct(ctx, params)
      break
    case 'view_products':
      await ProductHandlers.handleViewProducts(ctx, params)
      break
    case 'update_product_price':
      await ProductHandlers.handleUpdateProductPrice(ctx, params)
      break
    case 'update_product_stock':
      await ProductHandlers.handleUpdateProductStock(ctx, params)
      break
    case 'product_details':
      await ProductHandlers.handleProductDetails(ctx, params)
      break
    case 'low_stock_products':
      await ProductHandlers.handleLowStockProducts(ctx, params)
      break
    case 'top_products':
      await ProductHandlers.handleTopProducts(ctx, params)
      break
    case 'product_analytics':
      await ProductHandlers.handleProductAnalytics(ctx, params)
      break
    case 'duplicate_products':
      await ProductHandlers.handleDuplicateProducts(ctx, params)
      break
    case 'bulk_price_update':
      await ProductHandlers.handleBulkPriceUpdate(ctx, params)
      break
    case 'import_products':
      await ProductHandlers.handleImportProducts(ctx, params)
      break
    case 'export_products':
      await ProductHandlers.handleExportProducts(ctx, params)
      break
    case 'product_recommendations':
      await ProductHandlers.handleProductRecommendations(ctx, params)
      break
    case 'set_product_featured':
      await ProductHandlers.handleSetProductFeatured(ctx, params)
      break
    case 'product_variants':
      await ProductHandlers.handleProductVariants(ctx, params)
      break
    case 'product_reviews_summary':
      await ProductHandlers.handleProductReviewsSummary(ctx, params)
      break
    case 'archive_products':
      await ProductHandlers.handleArchiveProducts(ctx, params)
      break
    
    // === КАТЕГОРИИ (6 функций) ===
    case 'add_category':
      await CategoryHandlers.handleAddCategory(ctx, params)
      break
    case 'view_categories':
      await CategoryHandlers.handleViewCategories(ctx, params)
      break
    case 'edit_category':
      await CategoryHandlers.handleEditCategory(ctx, params)
      break
    case 'delete_category':
      await CategoryHandlers.handleDeleteCategory(ctx, params)
      break
    case 'reorder_categories':
      await CategoryHandlers.handleReorderCategories(ctx, params)
      break
    case 'category_stats':
      await CategoryHandlers.handleCategoryStats(ctx, params)
      break
    
    // === ВИДЕО (10 функций) ===
    case 'upload_main_video':
      await VideoHandlers.handleUploadMainVideo(ctx, params)
      break
    case 'view_main_videos':
      await VideoHandlers.handleViewMainVideos(ctx, params)
      break
    case 'delete_main_video':
      await VideoHandlers.handleDeleteMainVideo(ctx, params)
      break
    case 'upload_product_video':
      await VideoHandlers.handleUploadProductVideo(ctx, params)
      break
    case 'view_product_videos':
      await VideoHandlers.handleViewProductVideos(ctx, params)
      break
    case 'delete_product_video':
      await VideoHandlers.handleDeleteProductVideo(ctx, params)
      break
    case 'upload_sign_video':
      await VideoHandlers.handleUploadSignVideo(ctx, params)
      break
    case 'view_sign_videos':
      await VideoHandlers.handleViewSignVideos(ctx, params)
      break
    case 'delete_sign_video':
      await VideoHandlers.handleDeleteSignVideo(ctx, params)
      break
    case 'video_analytics':
      await VideoHandlers.handleVideoAnalytics(ctx, params)
      break
    
    // === CRM И КЛИЕНТЫ (16 функций) ===
    case 'search_customer':
      await CrmHandlers.handleSearchCustomer(ctx, params)
      break
    case 'customer_details':
      await CrmHandlers.handleCustomerDetails(ctx, params)
      break
    case 'customer_history':
      await CrmHandlers.handleCustomerHistory(ctx, params)
      break
    case 'add_customer_note':
      await CrmHandlers.handleAddCustomerNote(ctx, params)
      break
    case 'top_customers':
      await CrmHandlers.handleTopCustomers(ctx, params)
      break
    case 'customer_segmentation':
      await CrmHandlers.handleCustomerSegmentation(ctx, params)
      break
    case 'inactive_customers':
      await CrmHandlers.handleInactiveCustomers(ctx, params)
      break
    case 'new_customers':
      await CrmHandlers.handleNewCustomers(ctx, params)
      break
    case 'customer_lifetime_value':
      await CrmHandlers.handleCustomerLifetimeValue(ctx, params)
      break
    case 'customer_recommendations':
      await CrmHandlers.handleCustomerRecommendations(ctx, params)
      break
    case 'export_customers':
      await CrmHandlers.handleExportCustomers(ctx, params)
      break
    case 'merge_customers':
      await CrmHandlers.handleMergeCustomers(ctx, params)
      break
    case 'customer_tags':
      await CrmHandlers.handleCustomerTags(ctx, params)
      break
    case 'add_customer_tag':
      await CrmHandlers.handleAddCustomerTag(ctx, params)
      break
    case 'remove_customer_tag':
      await CrmHandlers.handleRemoveCustomerTag(ctx, params)
      break
    case 'customer_communication_log':
      await CrmHandlers.handleCustomerCommunicationLog(ctx, params)
      break
    
    // === СТАТИСТИКА И АНАЛИТИКА (15 функций) ===
    case 'general_stats':
    case 'stats':
      await StatsHandlers.handleGeneralStats(ctx, params)
      break
    case 'sales_report':
      await StatsHandlers.handleSalesReport(ctx, params)
      break
    case 'revenue_analysis':
      await StatsHandlers.handleRevenueAnalysis(ctx, params)
      break
    case 'top_products_report':
      await StatsHandlers.handleTopProductsReport(ctx, params)
      break
    case 'customer_analytics':
      await StatsHandlers.handleCustomerAnalytics(ctx, params)
      break
    case 'conversion_analysis':
      await StatsHandlers.handleConversionAnalysis(ctx, params)
      break
    case 'traffic_sources':
      await StatsHandlers.handleTrafficSources(ctx, params)
      break
    case 'abandon_cart_analysis':
      await StatsHandlers.handleAbandonCartAnalysis(ctx, params)
      break
    case 'seasonal_trends':
      await StatsHandlers.handleSeasonalTrends(ctx, params)
      break
    case 'geo_analytics':
      await StatsHandlers.handleGeoAnalytics(ctx, params)
      break
    case 'profit_margins':
      await StatsHandlers.handleProfitMargins(ctx, params)
      break
    case 'inventory_turnover':
      await StatsHandlers.handleInventoryTurnover(ctx, params)
      break
    case 'compare_periods':
      await StatsHandlers.handleComparePeriods(ctx, params)
      break
    case 'forecast_analysis':
      await StatsHandlers.handleForecastAnalysis(ctx, params)
      break
    case 'kpi_dashboard':
      await StatsHandlers.handleKpiDashboard(ctx, params)
      break
    
    // === ОТЗЫВЫ (6 функций) ===
    case 'view_reviews':
      await ReviewHandlers.handleViewReviews(ctx, params)
      break
    case 'moderate_review':
      await ReviewHandlers.handleModerateReview(ctx, params)
      break
    case 'respond_to_review':
      await ReviewHandlers.handleRespondToReview(ctx, params)
      break
    case 'review_analytics':
      await ReviewHandlers.handleReviewAnalytics(ctx, params)
      break
    case 'export_reviews':
      await ReviewHandlers.handleExportReviews(ctx, params)
      break
    case 'flag_review':
      await ReviewHandlers.handleFlagReview(ctx, params)
      break
    
    // === ДОСТАВКА (10 функций) ===
    case 'calculate_shipping':
      await DeliveryHandlers.handleCalculateShipping(ctx, params)
      break
    case 'shipping_zones':
      await DeliveryHandlers.handleShippingZones(ctx, params)
      break
    case 'update_shipping_rates':
      await DeliveryHandlers.handleUpdateShippingRates(ctx, params)
      break
    case 'track_shipment':
      await DeliveryHandlers.handleTrackShipment(ctx, params)
      break
    case 'bulk_shipping_labels':
      await DeliveryHandlers.handleBulkShippingLabels(ctx, params)
      break
    case 'shipping_analytics':
      await DeliveryHandlers.handleShippingAnalytics(ctx, params)
      break
    case 'delivery_performance':
      await DeliveryHandlers.handleDeliveryPerformance(ctx, params)
      break
    case 'shipping_issues':
      await DeliveryHandlers.handleShippingIssues(ctx, params)
      break
    case 'carrier_comparison':
      await DeliveryHandlers.handleCarrierComparison(ctx, params)
      break
    case 'delivery_time_analysis':
      await DeliveryHandlers.handleDeliveryTimeAnalysis(ctx, params)
      break
    
    // === ПЛАТЕЖИ (8 функций) ===
    case 'process_payment':
      await PaymentHandlers.handleProcessPayment(ctx, params)
      break
    case 'refund_payment':
      await PaymentHandlers.handleRefundPayment(ctx, params)
      break
    case 'view_payments':
      await PaymentHandlers.handleViewPayments(ctx, params)
      break
    case 'payment_statistics':
      await PaymentHandlers.handlePaymentStatistics(ctx, params)
      break
    case 'failed_payments':
      await PaymentHandlers.handleFailedPayments(ctx, params)
      break
    case 'update_payment_status':
      await PaymentHandlers.handleUpdatePaymentStatus(ctx, params)
      break
    case 'export_payments':
      await PaymentHandlers.handleExportPayments(ctx, params)
      break
    case 'recurring_payments':
      await PaymentHandlers.handleRecurringPayments(ctx, params)
      break
    
    // === СИСТЕМНЫЕ ФУНКЦИИ (10 функций) ===
    case 'system_status':
      await SystemHandlers.handleSystemStatus(ctx, params)
      break
    case 'database_backup':
      await SystemHandlers.handleDatabaseBackup(ctx, params)
      break
    case 'system_logs':
      await SystemHandlers.handleSystemLogs(ctx, params)
      break
    case 'clear_cache':
      await SystemHandlers.handleClearCache(ctx, params)
      break
    case 'system_maintenance':
      await SystemHandlers.handleSystemMaintenance(ctx, params)
      break
    case 'health_check':
      await SystemHandlers.handleHealthCheck(ctx, params)
      break
    case 'system_configuration':
      await SystemHandlers.handleSystemConfiguration(ctx, params)
      break
    case 'restart_service':
      await SystemHandlers.handleRestartService(ctx, params)
      break
    case 'system_analytics':
      await SystemHandlers.handleSystemAnalytics(ctx, params)
      break
    case 'system_notifications':
      await SystemHandlers.handleSystemNotifications(ctx, params)
      break
    
    // === AI АВТОМАТИЗАЦИЯ (5 функций) ===
    case 'auto_restock':
      await AiHandlers.handleAutoRestock(ctx, params)
      break
    case 'price_optimization':
      await AiHandlers.handlePriceOptimization(ctx, params)
      break
    case 'sales_forecasting':
      await AiHandlers.handleSalesForecasting(ctx, params)
      break
    case 'customer_segmentation_ai':
      await AiHandlers.handleCustomerSegmentation(ctx, params)
      break
    case 'inventory_optimization':
      await AiHandlers.handleInventoryOptimization(ctx, params)
      break
    
    // === МАРКЕТИНГ И ПРОМО (5 функций) ===
    case 'create_promo_code':
      await MarketingHandlers.handleCreatePromoCode(ctx, params)
      break
    case 'view_promo_codes':
      await MarketingHandlers.handleViewPromoCodes(ctx, params)
      break
    case 'email_campaign':
      await MarketingHandlers.handleEmailCampaign(ctx, params)
      break
    case 'analytics_report':
      await MarketingHandlers.handleAnalyticsReport(ctx, params)
      break
    case 'social_media_post':
      await MarketingHandlers.handleSocialMediaPost(ctx, params)
      break
    
    // === LEGACY ALIASES ===
    case 'view_logs':
      await SystemHandlers.handleSystemLogs(ctx, params)
      break
    case 'view_statistics':
      await StatsHandlers.handleGeneralStats(ctx, params)
      break
    case 'export_logs':
      await SystemHandlers.handleSystemLogs(ctx, { ...params, export: true })
      break
    case 'cleanup_logs':
      await SystemHandlers.handleSystemLogs(ctx, { ...params, cleanup: true })
      break
    
    default:
      await ctx.reply(
        '🤔 Не понял вашу команду. У меня есть **106 функций**! Попробуйте:\n\n' +
        '**ЗАКАЗЫ:** показать заказы, найти заказ, детали заказа\n' +
        '**ТОВАРЫ:** добавить товар, найти товар, обновить цену\n' +
        '**КЛИЕНТЫ:** найти клиента, история клиента, сегментация\n' +
        '**СТАТИСТИКА:** общая статистика, отчет продаж, аналитика\n' +
        '**ПЛАТЕЖИ:** обработать платеж, возврат, статистика\n' +
        '**ДОСТАВКА:** рассчитать доставку, отследить, тарифы\n' +
        '**СИСТЕМА:** статус системы, резервная копия, логи\n' +
        '**AI:** автопополнение, оптимизация цен, прогнозы\n' +
        '**МАРКЕТИНГ:** промокоды, email кампании, соцсети\n\n' +
        '💡 Пишите естественными фразами, я пойму!'
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
    console.log('Webhook request received')
    
    const bot = await createBot()
    
    // Grammy webhookCallback обрабатывает secret token автоматически
    // Передаем secret token в опции webhookCallback
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || 'vobvorot_webhook_secret_2025'
    const handleUpdate = webhookCallback(bot, 'std/http', {
      secretToken: secretToken
    })
    
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}