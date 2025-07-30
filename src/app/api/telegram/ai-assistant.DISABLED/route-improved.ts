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

// Import utilities and managers
import { escapeMarkdownV2, formatDate, formatPrice } from './utils'
import { rateLimiter } from './rate-limiter'
import { confirmationManager } from './confirmation-manager'
import { logAIInteraction, logError, logAction } from './logging-manager'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = (process.env.TELEGRAM_OWNER_CHAT_ID || '316593422,1837334996').split(',')
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.1,
    topP: 0.8,
    maxOutputTokens: 1024,
  }
})

// Оптимизированный системный промпт - сокращенная версия для лучшей производительности
const SYSTEM_PROMPT = `Ты AI ассистент магазина VOBVOROT. Анализируй сообщения и возвращай ТОЛЬКО валидный JSON.

Формат ответа:
{
  "action": "string",
  "params": {},
  "needConfirm": boolean
}

Доступные действия (12 категорий):

ЗАКАЗЫ: view_orders, search_order, order_details, update_order_status, add_tracking, cancel_order
ТОВАРЫ: add_product, edit_product, search_product, view_products, update_product_price, delete_product
КАТЕГОРИИ: add_category, view_categories, edit_category, delete_category
ВИДЕО: upload_main_video, view_main_videos, delete_main_video, upload_sign_video, view_sign_videos
CRM: search_customer, customer_details, customer_history, top_customers, customer_segmentation
СТАТИСТИКА: general_stats, sales_report, revenue_analysis, top_products_report, customer_analytics
ОТЗЫВЫ: view_reviews, moderate_review, respond_to_review, review_analytics
ДОСТАВКА: calculate_shipping, shipping_zones, track_shipment, delivery_performance
ПЛАТЕЖИ: process_payment, refund_payment, view_payments, payment_statistics
СИСТЕМА: system_status, database_backup, system_logs, clear_cache, health_check
AI: auto_restock, price_optimization, sales_forecasting, inventory_optimization
МАРКЕТИНГ: create_promo_code, view_promo_codes, email_campaign, social_media_post

Параметры в params объекте. needConfirm=true для критичных операций (delete, refund, update_status).

Примеры:
"покажи заказы" → {"action":"view_orders","params":{},"needConfirm":false}
"добавь платье за 2500" → {"action":"add_product","params":{"name":"платье","price":2500},"needConfirm":false}
"найди клиента мария" → {"action":"search_customer","params":{"query":"мария"},"needConfirm":false}
"статистика за неделю" → {"action":"general_stats","params":{"period":"week"},"needConfirm":false}
"удали товар 123" → {"action":"delete_product","params":{"productId":"123"},"needConfirm":true}
"возврат платежа 456" → {"action":"refund_payment","params":{"paymentId":"456"},"needConfirm":true}

ВАЖНО: Возвращай ТОЛЬКО JSON, без markdown блоков!`

// Функция создания бота
async function createBot() {
  const bot = new Bot(BOT_TOKEN)
  await bot.init()

  // Проверка админа
  function isAdmin(userId: string): boolean {
    return ADMIN_IDS.includes(userId)
  }

  // Улучшенный AI анализ с retry логикой
  async function analyzeMessage(text: string, userId: string, retryCount = 0): Promise<any> {
    const startTime = Date.now()
    const maxRetries = 2
    
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nСообщение: "${text}"\n\nОтвет JSON:`
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      let responseText = response.text()
      
      // Улучшенная очистка ответа
      responseText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*({.*})[^}]*$/s, '$1')
        .trim()
      
      // Попытка парсинга JSON
      let parsedResult
      try {
        parsedResult = JSON.parse(responseText)
      } catch (parseError) {
        // Попытка исправить частые ошибки JSON
        const fixedText = responseText
          .replace(/'/g, '"')
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
          .replace(/:\s*([^",{\[\d][^",}]*)/g, ':"$1"')
        
        parsedResult = JSON.parse(fixedText)
      }
      
      // Валидация структуры ответа
      if (!parsedResult.action || typeof parsedResult.action !== 'string') {
        throw new Error('Invalid response structure: missing action')
      }
      
      if (!parsedResult.params || typeof parsedResult.params !== 'object') {
        parsedResult.params = {}
      }
      
      if (typeof parsedResult.needConfirm !== 'boolean') {
        parsedResult.needConfirm = false
      }
      
      // Логируем успешное взаимодействие
      const duration = Date.now() - startTime
      await logAIInteraction(userId, text, parsedResult.action, parsedResult.params, duration)
      
      return parsedResult
    } catch (error) {
      console.error(`AI analysis error (attempt ${retryCount + 1}):`, error)
      
      // Retry логика
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return analyzeMessage(text, userId, retryCount + 1)
      }
      
      // Логируем ошибку
      await logError(userId, 'ai_analysis', error, { userMessage: text, retryCount })
      
      // Возвращаем безопасный fallback
      return { action: 'unknown', params: { originalMessage: text }, needConfirm: false }
    }
  }

  // Команда /start с улучшенным интерфейсом
  bot.command('start', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) {
      await ctx.reply('⛔ У вас нет доступа к этому боту')
      return
    }

    const keyboard = new InlineKeyboard()
      .text('📦 Заказы', 'help_orders')
      .text('🛍 Товары', 'help_products').row()
      .text('👥 Клиенты', 'help_customers')
      .text('📊 Статистика', 'help_stats').row()
      .text('💳 Платежи', 'help_payments')
      .text('🚚 Доставка', 'help_delivery')

    await ctx.reply(
      '🤖 *AI Ассистент VOBVOROT v2\\.0*\\n\\n' +
      '✨ Теперь с **106 функциями** и улучшенной AI обработкой\\!\\n\\n' +
      '💬 Пишите естественными фразами:\\n' +
      '• "Покажи заказы за сегодня"\\n' +
      '• "Добавь товар юбка за 1500"\\n' +
      '• "Найди клиента по email"\\n' +
      '• "Статистика продаж за месяц"\\n\\n' +
      '🎯 Выберите категорию для примеров:',
      { 
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard
      }
    )
  })

  // Обработчики inline кнопок
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data
    let examples = ''

    switch (data) {
      case 'help_orders':
        examples = '📦 *Примеры команд для заказов:*\\n\\n' +
          '• Покажи заказы\\n' +
          '• Заказы за сегодня\\n' +
          '• Найди заказ 123\\n' +
          '• Обнови статус заказа 456 на отправлен\\n' +
          '• Добавь трек\\-номер для заказа 789'
        break
      case 'help_products':
        examples = '🛍 *Примеры команд для товаров:*\\n\\n' +
          '• Добавь платье за 2500\\n' +
          '• Найди товар юбка\\n' +
          '• Обнови цену товара 123 на 1800\\n' +
          '• Покажи товары с низким остатком\\n' +
          '• Популярные товары за месяц'
        break
      case 'help_customers':
        examples = '👥 *Примеры команд для клиентов:*\\n\\n' +
          '• Найди клиента Мария\\n' +
          '• История клиента по email\\n' +
          '• Лучшие клиенты за месяц\\n' +
          '• Сегментация клиентов\\n' +
          '• Неактивные клиенты'
        break
      case 'help_stats':
        examples = '📊 *Примеры команд для статистики:*\\n\\n' +
          '• Покажи статистику\\n' +
          '• Отчет по продажам за неделю\\n' +
          '• Анализ выручки по месяцам\\n' +
          '• Топ товары за год\\n' +
          '• Конверсия и воронка продаж'
        break
      case 'help_payments':
        examples = '💳 *Примеры команд для платежей:*\\n\\n' +
          '• Обработай платеж для заказа 123\\n' +
          '• Сделай возврат платежа 456\\n' +
          '• Покажи платежи за день\\n' +
          '• Статистика платежей\\n' +
          '• Неудачные платежи'
        break
      case 'help_delivery':
        examples = '🚚 *Примеры команд для доставки:*\\n\\n' +
          '• Рассчитай доставку для заказа 789\\n' +
          '• Зоны доставки\\n' +
          '• Отследи посылку ABC123\\n' +
          '• Статистика доставки\\n' +
          '• Сравнение перевозчиков'
        break
    }

    await ctx.editMessageText(examples, { parse_mode: 'MarkdownV2' })
    await ctx.answerCallbackQuery()
  })

  // Обработчик текстовых сообщений с улучшенной обработкой
  bot.on('message:text', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return

    const userId = ctx.from.id.toString()
    const messageText = ctx.message.text.toLowerCase().trim()

    // Rate limiting
    const rateCheck = rateLimiter.checkUserLimit(userId)
    if (!rateCheck.allowed) {
      await ctx.reply(
        `⏱ Слишком много запросов\\! Подождите ${rateCheck.resetIn} секунд\\.`,
        { parse_mode: 'MarkdownV2' }
      )
      return
    }

    // Обработка подтверждений
    if (['да', 'yes', 'подтверждаю', 'подтверждение'].includes(messageText)) {
      const confirmation = confirmationManager.getLastConfirmation(userId)
      if (confirmation) {
        await executeAction(ctx, confirmation.action, confirmation.params)
        return
      } else {
        await ctx.reply('❌ Нет операций для подтверждения')
        return
      }
    } 
    
    if (['нет', 'no', 'отмена', 'cancel'].includes(messageText)) {
      confirmationManager.cancelUserConfirmations(userId)
      await ctx.reply('❌ Операция отменена')
      return
    }

    // Быстрые команды без AI
    const quickCommands: Record<string, any> = {
      'статистика': { action: 'general_stats', params: {}, needConfirm: false },
      'заказы': { action: 'view_orders', params: {}, needConfirm: false },
      'товары': { action: 'view_products', params: {}, needConfirm: false },
      'категории': { action: 'view_categories', params: {}, needConfirm: false },
      'help': { action: 'help', params: {}, needConfirm: false }
    }

    if (quickCommands[messageText]) {
      await executeAction(ctx, quickCommands[messageText].action, quickCommands[messageText].params)
      return
    }

    // AI анализ для сложных запросов
    const typingAction = ctx.replyWithChatAction('typing')
    
    try {
      const result = await analyzeMessage(ctx.message.text, userId)
      console.log('AI analysis result:', result)
      
      // Проверка подтверждения для критичных операций
      if (result.needConfirm) {
        confirmationManager.createConfirmation(
          userId,
          result.action,
          result.params,
          ctx.message.message_id
        )
        
        await ctx.reply(
          `⚠️ *Требуется подтверждение\\!*\\n\\n` +
          `Действие: *${escapeMarkdownV2(result.action)}*\\n` +
          `Параметры: ${escapeMarkdownV2(JSON.stringify(result.params))}\\n\\n` +
          `Отправьте *"да"* для подтверждения или *"нет"* для отмены\\.`,
          { parse_mode: 'MarkdownV2' }
        )
        return
      }
      
      // Выполнение действия
      await executeAction(ctx, result.action, result.params)
    } catch (error) {
      console.error('Message handling error:', error)
      await logError(userId, 'message_processing', error)
      await ctx.reply('❌ Произошла ошибка обработки. Попробуйте переформулировать запрос.')
    } finally {
      typingAction.then(t => t.delete().catch(() => {}))
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

// Улучшенная функция выполнения действий
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
      
      // === СПЕЦИАЛЬНЫЕ КОМАНДЫ ===
      case 'help':
        await ctx.reply(
          '📚 *Справка по командам AI Ассистента*\\n\\n' +
          '🎯 **Всего доступно 106 функций в 12 категориях:**\\n\\n' +
          '📦 Заказы \\(15\\): управление заказами\\n' +
          '🛍 Товары \\(20\\): каталог и остатки\\n' +
          '👥 CRM \\(16\\): работа с клиентами\\n' +
          '📊 Аналитика \\(15\\): отчеты и метрики\\n' +
          '💳 Платежи \\(8\\): обработка платежей\\n' +
          '🚚 Доставка \\(10\\): логистика\\n' +
          '⭐ Отзывы \\(6\\): модерация отзывов\\n' +
          '🎬 Видео \\(10\\): контент\\-менеджмент\\n' +
          '📂 Категории \\(6\\): структура каталога\\n' +
          '🔧 Система \\(10\\): администрирование\\n' +
          '🤖 AI \\(5\\): автоматизация\\n' +
          '📢 Маркетинг \\(5\\): промо и реклама\\n\\n' +
          '💡 Просто пишите что нужно сделать естественным языком\\!',
          { parse_mode: 'MarkdownV2' }
        )
        break
      
      case 'unknown':
      default:
        await ctx.reply(
          '🤔 Не понял команду\\. Попробуйте:\\n\\n' +
          '• Используйте простые фразы\\n' +
          '• Укажите конкретные параметры\\n' +
          '• Попробуйте /start для помощи\\n\\n' +
          '📚 Доступно **106 функций** в 12 категориях\\!',
          { parse_mode: 'MarkdownV2' }
        )
        break
    }
  } catch (error) {
    console.error(`Error executing action ${action}:`, error)
    await logError(userId, action, error, params)
    await ctx.reply('❌ Ошибка выполнения команды. Попробуйте позже.')
  }
}

// Webhook handler
export async function POST(req: NextRequest) {
  try {
    console.log('Webhook request received - AI Assistant v2.0')
    
    const bot = await createBot()
    
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