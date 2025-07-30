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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.trim().split(',').map(id => id.trim()) || ['316593422', '1837334996']
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''

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

=== 📦 УПРАВЛЕНИЕ ЗАКАЗАМИ (15 функций) ===
- view_orders: показать заказы (params: {filter?: "today"|"yesterday"|"week"|"month"|"all", status?: string, search?: string})
- search_order: поиск по номеру заказа (params: {orderId: string})
- order_details: детали заказа (params: {orderId: string})
- update_order_status: изменить статус заказа (params: {orderId: string, status: "pending"|"processing"|"shipped"|"delivered"|"cancelled"})
- add_tracking: добавить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- add_order_note: добавить заметку к заказу (params: {orderId: string, note: string})
- print_invoice: печать накладной (params: {orderId: string})
- initiate_return: инициировать возврат (params: {orderId: string, reason: string})
- partial_refund: частичный возврат (params: {orderId: string, amount: number, reason: string})
- full_refund: полный возврат (params: {orderId: string, reason: string})
- send_return_notification: уведомление о возврате (params: {orderId: string})
- order_history: история изменений заказа (params: {orderId: string})
- bulk_status_update: массовое изменение статусов (params: {orderIds: string[], status: string})
- export_orders: экспорт заказов (params: {format: "csv"|"excel", filter?: string})
- cancel_order: отменить заказ (params: {orderId: string, reason?: string})

=== 🛍️ УПРАВЛЕНИЕ ТОВАРАМИ (20 функций) ===
- add_product: добавить товар (params: {name: string, description?: string, price: number, category?: string, quantity?: number, weight?: number, sizes?: string[], brand?: string})
- edit_product: редактировать товар (params: {productId: string, field: string, value: any})
- update_product_price: изменить цену (params: {productId: string, price: number})
- update_product_stock: изменить количество (params: {productId: string, quantity: number})
- update_product_status: изменить статус товара (params: {productId: string, status: "active"|"inactive"|"out_of_stock"})
- add_product_photos: добавить фото товара (params: {productId: string})
- delete_product_photo: удалить фото товара (params: {productId: string, photoId: string})
- add_product_videos: добавить видео товара (params: {productId: string})
- delete_product_video: удалить видео товара (params: {productId: string, videoId: string})
- search_product: найти товар (params: {query: string})
- view_products: все товары (params: {category?: string, status?: string})
- view_products_by_category: товары по категории (params: {categoryId: string})
- delete_product: удалить товар (params: {productId: string})
- bulk_edit_products: массовое редактирование (params: {productIds: string[], field: string, value: any})
- export_products: экспорт товаров (params: {format: "csv"|"excel"})
- import_products: импорт товаров (params: {fileUrl: string})
- product_details: детали товара (params: {productId: string})
- low_stock_products: товары с низким остатком (params: {threshold?: number})
- out_of_stock_products: товары не в наличии (params: {})
- duplicate_product: дублировать товар (params: {productId: string})

=== 🏷️ УПРАВЛЕНИЕ КАТЕГОРИЯМИ (6 функций) ===
- add_category: создать категорию (params: {name: string, emoji?: string})
- edit_category: редактировать категорию (params: {categoryId: string, name?: string, emoji?: string})
- reorder_categories: изменить порядок категорий (params: {categoryIds: string[]})
- delete_category: удалить категорию (params: {categoryId: string})
- view_categories: показать категории (params: {})
- category_products: товары в категории (params: {categoryId: string})

=== 🎬 УПРАВЛЕНИЕ ВИДЕО (10 функций) ===
- upload_home_video: загрузить видео на главную (params: {})
- view_home_video: показать видео главной (params: {})
- delete_home_video: удалить видео главной (params: {})
- reorder_home_videos: изменить порядок видео (params: {videoIds: string[]})
- list_sign_videos: показать видео подписей (params: {letter?: string})
- add_sign_video: добавить видео подписей (params: {letter?: string})
- delete_sign_video: удалить видео подписей (params: {videoId: string})
- search_sign_video: поиск видео по букве (params: {letter: string})
- bulk_upload_videos: массовая загрузка видео (params: {})
- video_statistics: статистика видео (params: {})

=== 👥 CRM ФУНКЦИИ (16 функций) ===
- search_customer: найти клиента (params: {query: string, searchBy?: "email"|"phone"|"name"})
- customer_profile: профиль клиента (params: {customerId: string})
- customer_orders: заказы клиента (params: {customerId: string})
- customer_total_spent: общая сумма покупок (params: {customerId: string})
- add_customer_tag: добавить тег клиенту (params: {customerId: string, tag: string})
- remove_customer_tag: удалить тег клиента (params: {customerId: string, tag: string})
- update_customer_status: изменить статус клиента (params: {customerId: string, status: "active"|"inactive"|"vip"|"blocked"})
- add_customer_note: добавить заметку о клиенте (params: {customerId: string, note: string})
- send_personal_message: отправить личное сообщение (params: {customerId: string, message: string})
- mass_message_all: рассылка всем клиентам (params: {message: string})
- mass_message_by_tag: рассылка по тегам (params: {tags: string[], message: string})
- mass_message_by_status: рассылка по статусу (params: {status: string, message: string})
- export_customers: экспорт базы клиентов (params: {format: "csv"|"excel"})
- customer_analytics: аналитика по клиенту (params: {customerId: string})
- segment_customers: сегментация клиентов (params: {criteria: string})
- merge_customers: объединить профили клиентов (params: {customerId1: string, customerId2: string})

=== 📊 СТАТИСТИКА И ОТЧЕТЫ (15 функций) ===
- stats: общая статистика (params: {period?: "today"|"yesterday"|"week"|"month"|"year"|"all"})
- revenue_report: отчет по доходам (params: {period?: string, groupBy?: "day"|"week"|"month"})
- average_order_value: средний чек (params: {period?: string})
- customer_count: количество клиентов (params: {period?: string, status?: string})
- product_count: количество товаров (params: {status?: string})
- top_products: топ товаров (params: {limit?: number, period?: string})
- top_customers: топ клиентов (params: {limit?: number, period?: string})
- sales_chart: график продаж (params: {period?: string, groupBy?: string})
- conversion_rate: конверсия (params: {period?: string})
- returns_analytics: аналитика возвратов (params: {period?: string})
- category_performance: эффективность категорий (params: {period?: string})
- payment_methods_stats: статистика способов оплаты (params: {period?: string})
- shipping_stats: статистика доставки (params: {period?: string})
- product_performance: эффективность товаров (params: {productId?: string, period?: string})
- customer_lifetime_value: LTV клиентов (params: {})

=== 💬 УПРАВЛЕНИЕ ОТЗЫВАМИ (6 функций) ===
- view_reviews: просмотр отзывов (params: {status?: "new"|"approved"|"rejected", rating?: number})
- moderate_review: модерация отзыва (params: {reviewId: string, action: "approve"|"reject"})
- reply_to_review: ответить на отзыв (params: {reviewId: string, reply: string})
- review_statistics: статистика отзывов (params: {})
- export_reviews: экспорт отзывов (params: {format: "csv"|"excel"})
- delete_review: удалить отзыв (params: {reviewId: string})

=== 📧 EMAIL УВЕДОМЛЕНИЯ (10 функций) ===
- send_test_email: тестовое письмо (params: {email: string})
- send_order_notification: уведомление о заказе (params: {orderId: string, type?: "confirmation"|"status-update"})
- send_shipping_notification: отправить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- send_return_notification: уведомление о возврате (params: {orderId: string})
- send_bulk_emails: массовая рассылка уведомлений (params: {type: string, orderIds?: string[], status?: string, dateFrom?: string, dateTo?: string})
- send_marketing_campaign: маркетинговая рассылка (params: {subject: string, content: string, customerIds?: string[], onlyRecentCustomers?: boolean, daysBack?: number})
- send_abandoned_cart_emails: письма о брошенных корзинах (params: {})
- send_review_request: запрос отзыва (params: {orderId: string})
- email_template_preview: предпросмотр шаблона (params: {template: string, sampleData?: any})
- get_email_statistics: статистика email (params: {dateFrom?: string, dateTo?: string})

=== 🚚 УПРАВЛЕНИЕ ДОСТАВКОЙ (10 функций) ===
- calculate_shipping: рассчитать доставку (params: {orderId: string, packageType?: "box"|"package", currency?: "UAH"|"USD"})
- check_shipping: проверить доставку в страну (params: {countryCode: string, weight?: number})
- update_tracking: обновить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- get_delivery_status: статус доставки (params: {orderId: string})
- get_shipping_zones: зоны доставки (params: {})
- calculate_bulk_shipping: массовый расчет доставки (params: {orderIds: string[], packageType?: "box"|"package", currency?: "UAH"|"USD"})
- create_shipping_label: создать этикетку доставки (params: {orderId: string})
- schedule_pickup: запланировать забор (params: {date: string, timeSlot: string})
- track_shipment: отследить посылку (params: {trackingNumber: string})
- shipping_report: отчет по доставкам (params: {period?: string})

=== 💳 УПРАВЛЕНИЕ ПЛАТЕЖАМИ (8 функций) ===
- refund_payment: возврат платежа (params: {orderId: string, reason: string, amount?: number})
- check_payment_status: проверить статус платежа (params: {orderId: string})
- retry_payment: повторить платеж (params: {orderId: string})
- view_payment_info: информация о платеже (params: {orderId: string})
- payment_history: история платежей (params: {customerId?: string, period?: string})
- pending_payments: ожидающие платежи (params: {})
- failed_payments: неудачные платежи (params: {period?: string})
- payment_reconciliation: сверка платежей (params: {period?: string})

=== 🔧 СЛУЖЕБНЫЕ ФУНКЦИИ (10 функций) ===
- view_logs: просмотр логов (params: {filter?: "errors"|"recent"|"user", userId?: string, dateFrom?: string, dateTo?: string})
- view_statistics: статистика использования (params: {dateFrom?: string, dateTo?: string})
- export_logs: экспорт логов (params: {format?: "csv"|"json", dateFrom?: string, dateTo?: string})
- cleanup_logs: очистка старых логов (params: {daysToKeep?: number})
- system_health: состояние системы (params: {})
- backup_data: резервное копирование (params: {type?: "full"|"products"|"orders"|"customers"})
- clear_cache: очистить кеш (params: {})
- regenerate_thumbnails: пересоздать миниатюры (params: {})
- database_optimization: оптимизация БД (params: {})
- send_test_notification: тестовое уведомление (params: {})

=== 🤖 AI И АВТОМАТИЗАЦИЯ (5 функций) ===
- ai_product_description: генерация описания товара (params: {productId: string})
- ai_email_template: генерация email шаблона (params: {purpose: string, tone?: string})
- ai_response_suggestion: предложение ответа на отзыв (params: {reviewId: string})
- automation_rules: правила автоматизации (params: {})
- workflow_status: статус автоматизаций (params: {})

=== 📈 МАРКЕТИНГ (5 функций) ===
- create_discount_code: создать код скидки (params: {code: string, discount: number, type: "percent"|"fixed", expiresAt?: string})
- view_discount_codes: просмотр кодов скидок (params: {active?: boolean})
- deactivate_discount: деактивировать скидку (params: {code: string})
- campaign_performance: эффективность кампаний (params: {campaignId?: string})
- social_media_integration: интеграция соцсетей (params: {platform: string, action: string})

- unknown: непонятная команда (params: {})

ВАЖНО: needConfirm должен быть true для критичных операций:
- изменение статуса заказа
- удаление товара/категории/отзыва
- массовые операции
- возвраты и отмены
- отправка массовых рассылок
- очистка данных
- изменение критичных настроек`

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
      '• Покажи заказы за сегодня\\n' +
      '• Найди заказ 12345\\n' +
      '• Измени статус заказа на отправлен\\n\\n' +
      '🛍 *Товары:*\\n' +
      '• Добавь платье за 2500\\n' +
      '• Найди товар юбка\\n' +
      '• Покажи товары не в наличии\\n\\n' +
      '👥 *Клиенты:*\\n' +
      '• Найди клиента Мария\\n' +
      '• Покажи топ клиентов\\n' +
      '• Отправь рассылку VIP клиентам\\n\\n' +
      '📊 *Статистика:*\\n' +
      '• Покажи статистику за месяц\\n' +
      '• Топ 10 товаров\\n' +
      '• График продаж\\n\\n' +
      '🎬 *Видео:*\\n' +
      '• Загрузи видео на главную\\n' +
      '• Покажи видео подписей\\n\\n' +
      '📧 *Email:*\\n' +
      '• Отправь уведомление о заказе\\n' +
      '• Сделай рассылку за сегодня\\n\\n' +
      '💡 *Всего доступно 100\\+ функций\\!*',
      { parse_mode: 'MarkdownV2' }
    )
  })

  // Обработчик видео сообщений
  bot.on('message:video', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return
    await handleVideoUpload(ctx)
  })

  // Обработчик фото сообщений
  bot.on('message:photo', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return
    await handlePhotoUpload(ctx)
  })

  // Обработчик документов
  bot.on('message:document', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return
    await handleDocumentUpload(ctx)
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
  
  try {
    switch (action) {
      // === УПРАВЛЕНИЕ ЗАКАЗАМИ ===
      case 'view_orders':
        await handleViewOrders(ctx, params)
        break
      case 'search_order':
        await handleSearchOrder(ctx, params)
        break
      case 'order_details':
        await handleOrderDetails(ctx, params)
        break
      case 'update_order_status':
        await handleUpdateOrderStatus(ctx, params)
        break
      case 'add_tracking':
        await handleAddTracking(ctx, params)
        break
      case 'add_order_note':
        await handleAddOrderNote(ctx, params)
        break
      case 'print_invoice':
        await handlePrintInvoice(ctx, params)
        break
      case 'initiate_return':
        await handleInitiateReturn(ctx, params)
        break
      case 'partial_refund':
        await handlePartialRefund(ctx, params)
        break
      case 'full_refund':
        await handleFullRefund(ctx, params)
        break
      case 'send_return_notification':
        await handleSendReturnNotification(ctx, params)
        break
      case 'order_history':
        await handleOrderHistory(ctx, params)
        break
      case 'bulk_status_update':
        await handleBulkStatusUpdate(ctx, params)
        break
      case 'export_orders':
        await handleExportOrders(ctx, params)
        break
      case 'cancel_order':
        await handleCancelOrder(ctx, params)
        break

      // === УПРАВЛЕНИЕ ТОВАРАМИ ===
      case 'add_product':
        await handleAddProduct(ctx, params)
        break
      case 'edit_product':
        await handleEditProduct(ctx, params)
        break
      case 'update_product_price':
        await handleUpdateProductPrice(ctx, params)
        break
      case 'update_product_stock':
        await handleUpdateProductStock(ctx, params)
        break
      case 'update_product_status':
        await handleUpdateProductStatus(ctx, params)
        break
      case 'add_product_photos':
        await handleAddProductPhotos(ctx, params)
        break
      case 'delete_product_photo':
        await handleDeleteProductPhoto(ctx, params)
        break
      case 'add_product_videos':
        await handleAddProductVideos(ctx, params)
        break
      case 'delete_product_video':
        await handleDeleteProductVideo(ctx, params)
        break
      case 'search_product':
        await handleSearchProduct(ctx, params)
        break
      case 'view_products':
        await handleViewProducts(ctx, params)
        break
      case 'view_products_by_category':
        await handleViewProductsByCategory(ctx, params)
        break
      case 'delete_product':
        await handleDeleteProduct(ctx, params)
        break
      case 'bulk_edit_products':
        await handleBulkEditProducts(ctx, params)
        break
      case 'export_products':
        await handleExportProducts(ctx, params)
        break
      case 'import_products':
        await handleImportProducts(ctx, params)
        break
      case 'product_details':
        await handleProductDetails(ctx, params)
        break
      case 'low_stock_products':
        await handleLowStockProducts(ctx, params)
        break
      case 'out_of_stock_products':
        await handleOutOfStockProducts(ctx, params)
        break
      case 'duplicate_product':
        await handleDuplicateProduct(ctx, params)
        break

      // === УПРАВЛЕНИЕ КАТЕГОРИЯМИ ===
      case 'add_category':
        await handleAddCategory(ctx, params)
        break
      case 'edit_category':
        await handleEditCategory(ctx, params)
        break
      case 'reorder_categories':
        await handleReorderCategories(ctx, params)
        break
      case 'delete_category':
        await handleDeleteCategory(ctx, params)
        break
      case 'view_categories':
        await handleViewCategories(ctx, params)
        break
      case 'category_products':
        await handleCategoryProducts(ctx, params)
        break

      // === УПРАВЛЕНИЕ ВИДЕО ===
      case 'upload_home_video':
        await handleUploadHomeVideo(ctx, params)
        break
      case 'view_home_video':
        await handleViewHomeVideo(ctx, params)
        break
      case 'delete_home_video':
        await handleDeleteHomeVideo(ctx, params)
        break
      case 'reorder_home_videos':
        await handleReorderHomeVideos(ctx, params)
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
      case 'search_sign_video':
        await handleSearchSignVideo(ctx, params)
        break
      case 'bulk_upload_videos':
        await handleBulkUploadVideos(ctx, params)
        break
      case 'video_statistics':
        await handleVideoStatistics(ctx, params)
        break

      // === CRM ФУНКЦИИ ===
      case 'search_customer':
        await handleSearchCustomer(ctx, params)
        break
      case 'customer_profile':
        await handleCustomerProfile(ctx, params)
        break
      case 'customer_orders':
        await handleCustomerOrders(ctx, params)
        break
      case 'customer_total_spent':
        await handleCustomerTotalSpent(ctx, params)
        break
      case 'add_customer_tag':
        await handleAddCustomerTag(ctx, params)
        break
      case 'remove_customer_tag':
        await handleRemoveCustomerTag(ctx, params)
        break
      case 'update_customer_status':
        await handleUpdateCustomerStatus(ctx, params)
        break
      case 'add_customer_note':
        await handleAddCustomerNote(ctx, params)
        break
      case 'send_personal_message':
        await handleSendPersonalMessage(ctx, params)
        break
      case 'mass_message_all':
        await handleMassMessageAll(ctx, params)
        break
      case 'mass_message_by_tag':
        await handleMassMessageByTag(ctx, params)
        break
      case 'mass_message_by_status':
        await handleMassMessageByStatus(ctx, params)
        break
      case 'export_customers':
        await handleExportCustomers(ctx, params)
        break
      case 'customer_analytics':
        await handleCustomerAnalytics(ctx, params)
        break
      case 'segment_customers':
        await handleSegmentCustomers(ctx, params)
        break
      case 'merge_customers':
        await handleMergeCustomers(ctx, params)
        break

      // === СТАТИСТИКА И ОТЧЕТЫ ===
      case 'stats':
        await handleStats(ctx, params)
        break
      case 'revenue_report':
        await handleRevenueReport(ctx, params)
        break
      case 'average_order_value':
        await handleAverageOrderValue(ctx, params)
        break
      case 'customer_count':
        await handleCustomerCount(ctx, params)
        break
      case 'product_count':
        await handleProductCount(ctx, params)
        break
      case 'top_products':
        await handleTopProducts(ctx, params)
        break
      case 'top_customers':
        await handleTopCustomers(ctx, params)
        break
      case 'sales_chart':
        await handleSalesChart(ctx, params)
        break
      case 'conversion_rate':
        await handleConversionRate(ctx, params)
        break
      case 'returns_analytics':
        await handleReturnsAnalytics(ctx, params)
        break
      case 'category_performance':
        await handleCategoryPerformance(ctx, params)
        break
      case 'payment_methods_stats':
        await handlePaymentMethodsStats(ctx, params)
        break
      case 'shipping_stats':
        await handleShippingStats(ctx, params)
        break
      case 'product_performance':
        await handleProductPerformance(ctx, params)
        break
      case 'customer_lifetime_value':
        await handleCustomerLifetimeValue(ctx, params)
        break

      // === УПРАВЛЕНИЕ ОТЗЫВАМИ ===
      case 'view_reviews':
        await handleViewReviews(ctx, params)
        break
      case 'moderate_review':
        await handleModerateReview(ctx, params)
        break
      case 'reply_to_review':
        await handleReplyToReview(ctx, params)
        break
      case 'review_statistics':
        await handleReviewStatistics(ctx, params)
        break
      case 'export_reviews':
        await handleExportReviews(ctx, params)
        break
      case 'delete_review':
        await handleDeleteReview(ctx, params)
        break

      // === EMAIL УВЕДОМЛЕНИЯ ===
      case 'send_test_email':
        await handleSendTestEmail(ctx, params)
        break
      case 'send_order_notification':
        await handleSendOrderNotification(ctx, params)
        break
      case 'send_shipping_notification':
        await handleSendShippingNotification(ctx, params)
        break
      case 'send_return_notification':
        await handleSendReturnNotification(ctx, params)
        break
      case 'send_bulk_emails':
        await handleSendBulkEmails(ctx, params)
        break
      case 'send_marketing_campaign':
        await handleSendMarketingCampaign(ctx, params)
        break
      case 'send_abandoned_cart_emails':
        await handleSendAbandonedCartEmails(ctx, params)
        break
      case 'send_review_request':
        await handleSendReviewRequest(ctx, params)
        break
      case 'email_template_preview':
        await handleEmailTemplatePreview(ctx, params)
        break
      case 'get_email_statistics':
        await handleGetEmailStatistics(ctx, params)
        break

      // === УПРАВЛЕНИЕ ДОСТАВКОЙ ===
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
      case 'create_shipping_label':
        await handleCreateShippingLabel(ctx, params)
        break
      case 'schedule_pickup':
        await handleSchedulePickup(ctx, params)
        break
      case 'track_shipment':
        await handleTrackShipment(ctx, params)
        break
      case 'shipping_report':
        await handleShippingReport(ctx, params)
        break

      // === УПРАВЛЕНИЕ ПЛАТЕЖАМИ ===
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
      case 'payment_history':
        await handlePaymentHistory(ctx, params)
        break
      case 'pending_payments':
        await handlePendingPayments(ctx, params)
        break
      case 'failed_payments':
        await handleFailedPayments(ctx, params)
        break
      case 'payment_reconciliation':
        await handlePaymentReconciliation(ctx, params)
        break

      // === СЛУЖЕБНЫЕ ФУНКЦИИ ===
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
      case 'system_health':
        await handleSystemHealth(ctx, params)
        break
      case 'backup_data':
        await handleBackupData(ctx, params)
        break
      case 'clear_cache':
        await handleClearCache(ctx, params)
        break
      case 'regenerate_thumbnails':
        await handleRegenerateThumbnails(ctx, params)
        break
      case 'database_optimization':
        await handleDatabaseOptimization(ctx, params)
        break
      case 'send_test_notification':
        await handleSendTestNotification(ctx, params)
        break

      // === AI И АВТОМАТИЗАЦИЯ ===
      case 'ai_product_description':
        await handleAIProductDescription(ctx, params)
        break
      case 'ai_email_template':
        await handleAIEmailTemplate(ctx, params)
        break
      case 'ai_response_suggestion':
        await handleAIResponseSuggestion(ctx, params)
        break
      case 'automation_rules':
        await handleAutomationRules(ctx, params)
        break
      case 'workflow_status':
        await handleWorkflowStatus(ctx, params)
        break

      // === МАРКЕТИНГ ===
      case 'create_discount_code':
        await handleCreateDiscountCode(ctx, params)
        break
      case 'view_discount_codes':
        await handleViewDiscountCodes(ctx, params)
        break
      case 'deactivate_discount':
        await handleDeactivateDiscount(ctx, params)
        break
      case 'campaign_performance':
        await handleCampaignPerformance(ctx, params)
        break
      case 'social_media_integration':
        await handleSocialMediaIntegration(ctx, params)
        break

      default:
        await ctx.reply('❓ Не понимаю вашу команду. Попробуйте переформулировать.')
    }
  } catch (error) {
    console.error(`Error in ${action}:`, error)
    await logError(userId, action, error, params)
    await ctx.reply('❌ Произошла ошибка при выполнении команды. Попробуйте позже.')
  }
}

// === НАЧАЛО РЕАЛИЗАЦИИ ВСЕХ ФУНКЦИЙ ===

// ... (здесь будут все handler функции, я продолжу в следующем сообщении из-за лимита)

// Webhook обработчик
export async function POST(req: NextRequest) {
  try {
    const bot = await createBot()
    
    // Grammy webhookCallback обрабатывает secret token автоматически
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