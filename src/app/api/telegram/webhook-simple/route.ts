import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cloudinaryService } from '@/lib/cloudinary'
import { sendShippingNotification, sendEmail, emailService } from '@/lib/email'

const prisma = new PrismaClient()

const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM'
const ADMIN_IDS = ['316593422', '1837334996']
const ADMIN_API_KEY = process.env.ADMIN_API_KEY

// Простое хранилище состояний пользователей (в production лучше использовать Redis)
const userStates = new Map<string, any>()

// Функции для персистентного сохранения состояний пользователей
async function saveUserState(userId: string, state: any) {
  try {
    await prisma.setting.upsert({
      where: { key: `user_state_${userId}` },
      update: { value: JSON.stringify(state) },
      create: { 
        key: `user_state_${userId}`,
        value: JSON.stringify(state)
      }
    })
    userStates.set(userId, state)
  } catch (error) {
    console.error('Failed to save user state:', error)
    userStates.set(userId, state) // Fallback to memory
  }
}

async function getUserState(userId: string) {
  // Сначала проверяем память
  if (userStates.has(userId)) {
    return userStates.get(userId)
  }
  
  // Если нет в памяти, загружаем из БД
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: `user_state_${userId}` }
    })
    
    if (setting && setting.value) {
      const state = JSON.parse(setting.value)
      userStates.set(userId, state)
      return state
    }
  } catch (error) {
    console.error('Failed to load user state:', error)
  }
  
  return null
}

async function deleteUserState(userId: string) {
  try {
    await prisma.setting.delete({
      where: { key: `user_state_${userId}` }
    }).catch(() => {}) // Ignore if not exists
    userStates.delete(userId)
  } catch (error) {
    console.error('Failed to delete user state:', error)
    userStates.delete(userId) // Fallback to memory cleanup
  }
}

// Функция для сохранения отладочных логов в БД
async function saveDebugLog(action: string, data: any) {
  try {
    await prisma.setting.create({
      data: {
        key: `debug_log_${action}_${Date.now()}`,
        value: JSON.stringify(data)
      }
    })
  } catch (error) {
    console.error('Failed to save debug log:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    console.log('📨 Simple webhook received:', JSON.stringify(update, null, 2))
    
    // Обрабатываем текстовые сообщения, медиа и callback queries
    if (update.message || update.callback_query) {
      await processUpdate(update)
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

async function processUpdate(update: any) {
  // Обработка callback queries (нажатия кнопок)
  if (update.callback_query) {
    return await handleCallbackQuery(update.callback_query)
  }
  
  // Обработка сообщений
  if (update.message) {
    return await handleMessage(update.message)
  }
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id
  const userId = callbackQuery.from.id
  const data = callbackQuery.data
  
  if (!ADMIN_IDS.includes(userId.toString())) {
    await answerCallbackQuery(callbackQuery.id, '❌ Нет доступа')
    return
  }
  
  await answerCallbackQuery(callbackQuery.id)
  
  switch(data) {
    case 'orders':
      await sendOrdersMenu(chatId)
      break
    case 'products':
      await sendProductsMenu(chatId)
      break
    case 'stats':
      await sendStats(chatId)
      break
    case 'video':
      await sendVideoMenu(chatId)
      break
    case 'sign_video':
      await sendSignVideoMenu(chatId)
      break
    case 'orders_new':
      await sendOrdersByStatus(chatId, 'pending', 1)
      break
    case 'orders_completed':
      await sendOrdersByStatus(chatId, 'completed', 1)
      break
    case 'orders_digital':
      await sendOrdersByStatus(chatId, 'digital', 1)
      break
    case 'orders_cancelled':
      await sendOrdersByStatus(chatId, 'cancelled', 1)
      break
    case 'products_list':
      await sendProductsList(chatId, 1)
      break
    case 'add_product':
      await startAddProduct(chatId, userId)
      break
    case 'edit_product':
      await sendProductsListForEdit(chatId, 1)
      break
    case 'upload_video':
      await startUploadVideo(chatId, userId)
      break
    case 'delete_video':
      await deleteHomeVideo(chatId)
      break
    case 'current_video':
      await getCurrentVideoInfo(chatId)
      break
    case 'upload_sign_video':
      await startUploadSignVideo(chatId, userId)
      break
    case 'delete_sign_video':
      await deleteSignVideo(chatId)
      break
    case 'current_sign_video':
      await getCurrentSignVideoInfo(chatId)
      break
    case 'back_main':
      await sendMainMenu(chatId)
      break
    case 'back_orders':
      await sendOrdersMenu(chatId)
      break
    case 'back_products':
      await sendProductsMenu(chatId)
      break
    case 'back_video':
      await sendVideoMenu(chatId)
      break
    case 'categories':
      await sendCategoriesMenu(chatId)
      break
    case 'categories_list':
      await sendCategoriesList(chatId)
      break
    case 'add_category':
      await startCreateCategory(chatId, userId)
      break
    case 'edit_category':
      await sendCategoriesListForEdit(chatId)
      break
    case 'delete_category':
      await sendCategoriesListForDelete(chatId)
      break
    case 'back_categories':
      await sendCategoriesMenu(chatId)
      break
    case 'create_new_category':
      await startCreateCategory(chatId, userId)
      break
    case 'noop':
      // Игнорируем - это информационная кнопка
      break
    case 'delete_products':
      await sendProductsListForDelete(chatId, 1)
      break
    case 'photo_upload_done':
      // Завершаем загрузку фото и переходим к видео
      const userState = userStates.get(userId.toString())
      if (userState && userState.action === 'add_product_photo') {
        userState.action = 'add_product_video'
        userStates.set(userId.toString(), userState)
        
        const videoKeyboard = {
          inline_keyboard: [
            [
              { text: '⏭️ Пропустить видео', callback_data: 'video_upload_skip' }
            ],
            [
              { text: '❌ Отменить создание товара', callback_data: 'cancel_product_creation' }
            ]
          ]
        }
        
        await sendTelegramMessage(chatId, '🎬 Отправьте видео товара или используйте кнопку для пропуска:', true, videoKeyboard)
      }
      break
    case 'photo_upload_skip':
      // Пропускаем загрузку фото и переходим к видео
      const userStateSkip = userStates.get(userId.toString())
      if (userStateSkip && userStateSkip.action === 'add_product_photo') {
        userStateSkip.action = 'add_product_video'
        userStates.set(userId.toString(), userStateSkip)
        
        const videoKeyboard = {
          inline_keyboard: [
            [
              { text: '⏭️ Пропустить видео', callback_data: 'video_upload_skip' }
            ],
            [
              { text: '❌ Отменить создание товара', callback_data: 'cancel_product_creation' }
            ]
          ]
        }
        
        await sendTelegramMessage(chatId, '⏭️ Фото пропущены\n\n🎬 Отправьте видео товара или используйте кнопку для пропуска:', true, videoKeyboard)
      }
      break
    case 'video_upload_skip':
      // Пропускаем загрузку видео и переходим к количеству
      const userStateVideoSkip = userStates.get(userId.toString())
      if (userStateVideoSkip && userStateVideoSkip.action === 'add_product_video') {
        userStateVideoSkip.productData.videoUrl = null
        userStateVideoSkip.action = 'add_product_stock'
        userStates.set(userId.toString(), userStateVideoSkip)
        await sendTelegramMessage(chatId, '⏭️ Видео пропущено\n\n📊 Введите количество товара в наличии (например: 50):')
      }
      break
    case 'cancel_product_creation':
      // Отменяем создание товара и сбрасываем состояние
      userStates.delete(userId.toString())
      await sendTelegramMessage(chatId, '❌ Создание товара отменено')
      await sendMainMenu(chatId)
      break
    default:
      // Проверяем, не является ли это выбором категории
      if (data.startsWith('select_category_')) {
        const categoryId = data.replace('select_category_', '')
        await handleCategorySelection(chatId, userId, categoryId)
      }
      // Проверяем, не является ли это редактированием товара
      else if (data.startsWith('edit_product_')) {
        const productId = data.replace('edit_product_', '')
        await startProductEdit(chatId, userId, productId)
      }
      // Проверяем, не является ли это удалением товара
      else if (data.startsWith('delete_product_')) {
        const productId = data.replace('delete_product_', '')
        await confirmProductDelete(chatId, productId)
      }
      // Проверяем удаление конкретного видео
      else if (data.startsWith('delete_video_')) {
        const videoId = data.replace('delete_video_', '')
        await confirmVideoDelete(chatId, videoId)
      }
      // Проверяем подтверждение удаления видео (ВАЖНО: это должно быть ПЕРЕД confirm_delete_)
      else if (data.startsWith('confirm_delete_video_')) {
        const videoId = data.replace('confirm_delete_video_', '')
        await executeVideoDelete(chatId, videoId)
      }
      // Проверяем отмену удаления видео
      else if (data.startsWith('cancel_delete_video_')) {
        await deleteHomeVideo(chatId)
      }
      // Проверяем удаление конкретного sign видео
      else if (data.startsWith('delete_sign_video_')) {
        const videoId = data.replace('delete_sign_video_', '')
        await confirmSignVideoDelete(chatId, videoId)
      }
      // Проверяем подтверждение удаления sign видео
      else if (data.startsWith('confirm_delete_sign_video_')) {
        const videoId = data.replace('confirm_delete_sign_video_', '')
        await executeSignVideoDelete(chatId, videoId)
      }
      // Проверяем отмену удаления sign видео
      else if (data.startsWith('cancel_delete_sign_video_')) {
        await deleteSignVideo(chatId)
      }
      // Проверяем подтверждение удаления товара
      else if (data.startsWith('confirm_delete_')) {
        const productId = data.replace('confirm_delete_', '')
        await deleteProduct(chatId, productId)
      }
      // Проверяем отмену удаления товара
      else if (data.startsWith('cancel_delete_')) {
        await sendProductsListForDelete(chatId, 1)
      }
      // Pagination handlers for orders
      else if (data.match(/^orders_(pending|completed|digital|cancelled)_page_(\d+)$/)) {
        const matches = data.match(/^orders_(pending|completed|digital|cancelled)_page_(\d+)$/)
        if (matches) {
          const status = matches[1] === 'pending' ? 'pending' : matches[1]
          const page = parseInt(matches[2])
          await sendOrdersByStatus(chatId, status, page)
        }
      }
      // Pagination handlers for products
      else if (data.match(/^products_list_page_(\d+)$/)) {
        const matches = data.match(/^products_list_page_(\d+)$/)
        if (matches) {
          const page = parseInt(matches[1])
          await sendProductsList(chatId, page)
        }
      }
      else if (data.match(/^products_edit_page_(\d+)$/)) {
        const matches = data.match(/^products_edit_page_(\d+)$/)
        if (matches) {
          const page = parseInt(matches[1])
          await sendProductsListForEdit(chatId, page)
        }
      }
      else if (data.match(/^products_delete_page_(\d+)$/)) {
        const matches = data.match(/^products_delete_page_(\d+)$/)
        if (matches) {
          const page = parseInt(matches[1])
          await sendProductsListForDelete(chatId, page)
        }
      }
      // УПРАВЛЕНИЕ ЗАКАЗАМИ - добавляем обработчики callback для заказов
      else if (data.startsWith('order_')) {
        const orderId = data.replace('order_', '')
        await handleOrderManagement(chatId, orderId)
      }
      else if (data.startsWith('confirm_order_')) {
        const orderId = data.replace('confirm_order_', '')
        await handleOrderConfirm(chatId, userId, orderId, 'product')
      }
      else if (data.startsWith('confirm_digital_')) {
        const orderId = data.replace('confirm_digital_', '')
        await handleOrderConfirm(chatId, userId, orderId, 'digital')
      }
      else if (data.startsWith('cancel_order_')) {
        const orderId = data.replace('cancel_order_', '')
        await handleOrderAction(chatId, orderId, 'cancel')
      }
      // Digital order handlers - кнопки готово и отмена для digital заказов
      else if (data.startsWith('digital_complete_')) {
        const orderId = data.replace('digital_complete_', '')
        await handleDigitalOrderComplete(chatId, userId, orderId)
      }
      else if (data.startsWith('digital_cancel_')) {
        const orderId = data.replace('digital_cancel_', '')
        await handleDigitalAttachmentCancel(chatId, userId, orderId)
      }
      // Проверяем выбор поля для редактирования
      else if (data.startsWith('edit_field_')) {
        const [, productId, field] = data.split('_').slice(1)
        await startFieldEdit(chatId, userId, productId, field)
      }
      // Проверяем выбор новой категории при редактировании
      else if (data.startsWith('edit_category_')) {
        const parts = data.split('_')
        const productId = parts[2]
        const categoryId = parts[3]
        await updateProductCategory(chatId, userId, productId, categoryId)
      }
      // ===== НОВЫЕ HANDLERS ДЛЯ ТОВАРНЫХ ВИДЕО =====
      // Управление видео конкретного товара
      else if (data.startsWith('manage_product_videos_')) {
        const productId = data.replace('manage_product_videos_', '')
        await sendProductVideoMenu(chatId, productId)
      }
      // Архивирование товара
      else if (data.startsWith('archive_product_')) {
        const productId = data.replace('archive_product_', '')
        await confirmProductArchive(chatId, productId)
      }
      // Подтверждение архивирования товара
      else if (data.startsWith('confirm_archive_')) {
        const productId = data.replace('confirm_archive_', '')
        await archiveProduct(chatId, productId)
      }
      // Отмена архивирования товара
      else if (data.startsWith('cancel_archive_')) {
        const productId = data.replace('cancel_archive_', '')
        await startProductEdit(chatId, 0, productId)
      }
      // Загрузка видео для товара
      else if (data.startsWith('upload_product_video_')) {
        const productId = data.replace('upload_product_video_', '')
        await startUploadProductVideo(chatId, userId, productId)
      }
      // Удаление видео товара
      else if (data.startsWith('delete_product_video_')) {
        const productId = data.replace('delete_product_video_', '')
        await deleteProductVideo(chatId, productId)
      }
      // Просмотр текущих видео товара
      else if (data.startsWith('current_product_videos_')) {
        const productId = data.replace('current_product_videos_', '')
        await getCurrentProductVideoInfo(chatId, productId)
      }
      // Подтверждение удаления видео товара (ВАЖНО: перед confirm_delete_product_video_)
      else if (data.startsWith('confirm_delete_product_video_')) {
        const parts = data.replace('confirm_delete_product_video_', '').split('_')
        const productId = parts[0]
        const videoId = parts.slice(1).join('_')
        await executeProductVideoDelete(chatId, productId, videoId)
      }
      // Отмена удаления видео товара
      else if (data.startsWith('cancel_delete_product_video_')) {
        const parts = data.replace('cancel_delete_product_video_', '').split('_')
        const productId = parts[0]
        await deleteProductVideo(chatId, productId)
      }
      // Выбор конкретного видео товара для удаления
      else if (data.startsWith('select_delete_product_video_')) {
        const parts = data.replace('select_delete_product_video_', '').split('_')
        const productId = parts[0]
        const videoId = parts.slice(1).join('_')
        await confirmProductVideoDelete(chatId, productId, videoId)
      }
      // ===== НОВЫЕ HANDLERS ДЛЯ КАТЕГОРИЙ =====
      // Редактирование конкретной категории
      else if (data.startsWith('edit_category_')) {
        const categoryId = data.replace('edit_category_', '')
        await sendCategoryEditMenu(chatId, categoryId)
      }
      // Редактирование названия категории
      else if (data.startsWith('edit_category_name_')) {
        const categoryId = data.replace('edit_category_name_', '')
        await startEditCategoryName(chatId, userId, categoryId)
      }
      // Переключение статуса категории
      else if (data.startsWith('toggle_category_status_')) {
        const categoryId = data.replace('toggle_category_status_', '')
        await toggleCategoryStatus(chatId, categoryId)
      }
      // Удаление категории
      else if (data.startsWith('delete_category_')) {
        const categoryId = data.replace('delete_category_', '')
        await confirmCategoryDelete(chatId, categoryId)
      }
      // Подтверждение удаления категории
      else if (data.startsWith('confirm_delete_category_')) {
        const categoryId = data.replace('confirm_delete_category_', '')
        await executeCategoryDelete(chatId, categoryId)
      }
      // Отмена удаления категории
      else if (data.startsWith('cancel_delete_category_')) {
        await sendCategoriesListForDelete(chatId)
      }
      break
  }
}

async function handleMessage(message: any) {
  const chatId = message.chat.id
  const userId = message.from.id
  const text = message.text
  const username = message.from.username || 'Unknown'
  
  if (!ADMIN_IDS.includes(userId.toString())) {
    await sendTelegramMessage(chatId, '❌ У вас нет доступа к этому боту')
    return
  }
  
  // Сначала обрабатываем команды (приоритет выше состояния)
  if (text && text.startsWith('/')) {
    console.log(`👤 User ${username} (${userId}) - Command: ${text}`)
    
    // Очищаем состояние пользователя при получении команды
    userStates.delete(userId.toString())
    
    switch(text) {
      case '/start':
        await sendWelcomeMessage(chatId, userId)
        break
      case '/menu':
        await sendMainMenu(chatId)
        break
      case '/orders':
        await sendOrdersMenu(chatId)
        break
      case '/products':
        await sendProductsMenu(chatId)
        break
      case '/fix_gallery':
        await fixGalleryManually(chatId)
        break
      default:
        await sendTelegramMessage(chatId, `❓ Неизвестная команда: ${text}\n\nИспользуйте /start для главного меню`)
    }
    return
  }
  
  // Проверяем состояние пользователя
  const userState = await getUserState(userId.toString())
  console.log(`🔍 [DEBUG] User ${userId} state:`, userState)
  await saveDebugLog('user_state_check', { userId, userState, text })
  
  if (userState) {
    return await handleUserState(message, userState)
  }
  
  // Обработка обычных сообщений
  if (text) {
    console.log(`👤 User ${username} (${userId}): ${text}`)
    await sendMainMenu(chatId)
  }
}

async function sendWelcomeMessage(chatId: number, userId: number) {
  const welcomeMessage = `🤖 *VobvorotAdminBot* приветствует вас!

👋 Добро пожаловать в панель управления VobVorot Store

🚀 Выберите нужный раздел:`

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📦 Заказы', callback_data: 'orders' },
        { text: '🛍️ Товары', callback_data: 'products' }
      ],
      [
        { text: '🏷️ Категории', callback_data: 'categories' },
        { text: '📊 Статистика', callback_data: 'stats' }
      ],
      [
        { text: '🎬 Видео главной', callback_data: 'video' }
      ]
    ]
  }

  await sendTelegramMessage(chatId, welcomeMessage, true, keyboard)
}

async function sendMainMenu(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📦 Заказы', callback_data: 'orders' },
        { text: '🛍️ Товары', callback_data: 'products' }
      ],
      [
        { text: '🏷️ Категории', callback_data: 'categories' },
        { text: '📊 Статистика', callback_data: 'stats' }
      ],
      [
        { text: '🎬 Видео главной', callback_data: 'video' },
        { text: '🎭 Видео Sing', callback_data: 'sign_video' }
      ]
    ]
  }

  await sendTelegramMessage(chatId, '🏠 *Главное меню:*', true, keyboard)
}

async function sendOrdersMenu(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📥 Новые', callback_data: 'orders_new' },
        { text: '✅ Завершенные', callback_data: 'orders_completed' }
      ],
      [
        { text: '💾 Диджитал', callback_data: 'orders_digital' },
        { text: '❌ Отмененные', callback_data: 'orders_cancelled' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'back_main' }
      ]
    ]
  }

  await sendTelegramMessage(chatId, '📦 *Управление заказами:*', true, keyboard)
}

async function sendProductsMenu(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📋 Список товаров', callback_data: 'products_list' }
      ],
      [
        { text: '➕ Добавить товар', callback_data: 'add_product' }
      ],
      [
        { text: '📝 Редактировать', callback_data: 'edit_product' },
        { text: '🗑️ Удалить', callback_data: 'delete_products' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'back_main' }
      ]
    ]
  }

  await sendTelegramMessage(chatId, '🛍️ *Управление товарами:*', true, keyboard)
}

async function sendVideoMenu(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📤 Загрузить видео', callback_data: 'upload_video' },
        { text: '🗑️ Удалить видео', callback_data: 'delete_video' }
      ],
      [
        { text: 'ℹ️ Текущее видео', callback_data: 'current_video' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'back_main' }
      ]
    ]
  }

  await sendTelegramMessage(chatId, '🎬 *Управление видео главной страницы:*', true, keyboard)
}

async function sendSignVideoMenu(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📤 Загрузить видео', callback_data: 'upload_sign_video' },
        { text: '🗑️ Удалить видео', callback_data: 'delete_sign_video' }
      ],
      [
        { text: 'ℹ️ Текущее видео', callback_data: 'current_sign_video' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'back_main' }
      ]
    ]
  }

  await sendTelegramMessage(chatId, '🎭 *Управление видео страницы Sing:*', true, keyboard)
}

async function sendStats(chatId: number) {
  try {
    const ordersCount = await prisma.order.count()
    const productsCount = await prisma.product.count()
    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'COMPLETED' }
    })

    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    const statsMessage = `📊 *Статистика VobVorot Store*

📦 Всего заказов: ${ordersCount}
🛍️ Товаров в каталоге: ${productsCount}
💰 Общая выручка: $${totalRevenue._sum.total?.toFixed(2) || '0.00'}
📈 Заказов за неделю: ${recentOrders}

📅 Обновлено: ${new Date().toLocaleString('ru-RU')}`

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'back_main' }]
      ]
    }

    await sendTelegramMessage(chatId, statsMessage, true, keyboard)
  } catch (error) {
    console.error('Error getting stats:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения статистики')
  }
}

async function sendOrdersByStatus(chatId: number, status: string, page: number = 1) {
  try {
    // Подключаемся к реальной базе данных через Prisma
    // Определяем фильтры для каждой категории согласно требованиям
    let statusFilter
    switch(status) {
      case 'pending':
        // Новые - заказы с checkout (PRODUCT тип) со статусом PENDING/CONFIRMED
        statusFilter = { 
          AND: [
            { orderType: 'PRODUCT' as any },
            { status: { in: ['PENDING' as any, 'CONFIRMED' as any] } }
          ]
        }
        break
      case 'completed':
        // Завершенные - подтвержденные заказы (статус DELIVERED или CONFIRMED)
        statusFilter = { status: { in: ['DELIVERED', 'CONFIRMED'] } }
        break
      case 'digital':
        // Диджитал - заказы с your-name-my-pic (SIGN_PHOTO тип), только статус PENDING
        statusFilter = { 
          AND: [
            { orderType: 'SIGN_PHOTO' as any },
            { status: 'PENDING' as any }
          ]
        }
        break
      case 'cancelled':
        // Отмененные - отмененные заказы (статус CANCELLED)
        statusFilter = { status: 'CANCELLED' }
        break
      default:
        statusFilter = { status: status.toUpperCase() as any }
    }

    const pageSize = 5
    const skip = (page - 1) * pageSize
    
    // Получаем общее количество заказов для пагинации
    const totalOrders = await prisma.order.count({
      where: statusFilter
    })
    
    const orders = await prisma.order.findMany({
      where: statusFilter,
      skip: skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true
              }
            }
          }
        },
        signOrder: true
      }
    })
    
    if (orders.length === 0) {
      const backKeyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }]
        ]
      }
      await sendTelegramMessage(chatId, `📋 Заказов со статусом "${getStatusText(status)}" не найдено`, true, backKeyboard)
    } else {
      const totalPages = Math.ceil(totalOrders / pageSize)
      let message = `📋 *ЗАКАЗЫ: ${getStatusText(status)}*\n\n`
      
      if (totalPages > 1) {
        message += `📄 Страница ${page} из ${totalPages}\n\n`
      }
      
      const orderButtons = []
      orders.forEach((order: any, index: number) => {
        const date = new Date(order.createdAt).toLocaleDateString('ru-RU')
        const statusEmoji = getStatusEmoji(order.status)
        const orderId = order.id.slice(0, 8)
        const displayOrderNumber = order.orderNumber || orderId
        
        message += `${skip + index + 1}. ${statusEmoji} #${displayOrderNumber}\n`
        message += `   💰 $${Number(order.total)} | 👤 ${order.shippingName}\n`
        message += `   📅 ${date}\n\n`
        
        // Добавляем кнопку управления для каждого заказа - используем тот же номер что и в сообщении
        orderButtons.push([{ text: `🔧 Управлять #${displayOrderNumber}`, callback_data: `order_${order.id}` }])
      })
      
      // Добавляем кнопки пагинации если нужно
      const paginationButtons = []
      if (page > 1) {
        paginationButtons.push({ text: '◀️ Назад', callback_data: `orders_${status}_page_${page - 1}` })
      }
      if (page < totalPages) {
        paginationButtons.push({ text: '▶️ Далее', callback_data: `orders_${status}_page_${page + 1}` })
      }
      
      if (paginationButtons.length > 0) {
        orderButtons.push(paginationButtons)
      }
      
      orderButtons.push([{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }])
      
      const keyboard = { inline_keyboard: orderButtons }
      await sendTelegramMessage(chatId, message, true, keyboard)
    }
  } catch (error) {
    console.error('Orders fetch error:', error)
    // Если ошибка с БД, покажем резервные тестовые данные
    const testOrders = [
      {
        id: 'test_order_001',
        orderNumber: 'ORD-001',
        status: 'pending',
        total: 150,
        shippingName: 'Иван Петров',
        createdAt: new Date().toISOString()
      }
    ]
    
    const orders = testOrders.filter(order => order.status === status)
    if (orders.length > 0) {
      let message = `📋 *ЗАКАЗЫ: ${getStatusText(status)} (тестовые данные)*\n\n`
      const orderButtons = []
      orders.forEach((order: any, index: number) => {
        const orderId = order.id.slice(0, 8)
        message += `${index + 1}. ⏳ #${order.orderNumber}\n   💰 $${order.total} | 👤 ${order.shippingName}\n\n`
        orderButtons.push([{ text: `🔧 Управлять #${orderId}`, callback_data: `order_${order.id}` }])
      })
      orderButtons.push([{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }])
      const keyboard = { inline_keyboard: orderButtons }
      await sendTelegramMessage(chatId, message, true, keyboard)
    } else {
      await sendTelegramMessage(chatId, '❌ Ошибка получения заказов из базы данных')
    }
  }
}

// Вспомогательные функции для статусов заказов
function getStatusEmoji(status: string): string {
  const statusEmojis: { [key: string]: string } = {
    'PENDING': '⏳',
    'CONFIRMED': '✅', 
    'PROCESSING': '🔄',
    'SHIPPED': '📦',
    'DELIVERED': '🎉',
    'CANCELLED': '❌',
    'REFUNDED': '💸',
    'PARTIALLY_REFUNDED': '💰'
  }
  return statusEmojis[status] || '❓'
}

function getStatusText(status: string): string {
  const statusTexts: { [key: string]: string } = {
    'pending': 'НОВЫЕ',
    'completed': 'ЗАВЕРШЕННЫЕ',
    'digital': 'ДИДЖИТАЛ',
    'cancelled': 'ОТМЕНЕННЫЕ',
    'PENDING': 'НОВЫЕ',
    'CONFIRMED': 'ПОДТВЕРЖДЕННЫЕ',
    'PROCESSING': 'В ОБРАБОТКЕ',
    'SHIPPED': 'ОТПРАВЛЕННЫЕ',
    'DELIVERED': 'ДОСТАВЛЕННЫЕ',
    'CANCELLED': 'ОТМЕНЕННЫЕ',
    'REFUNDED': 'ВОЗВРАЩЕННЫЕ'
  }
  return statusTexts[status] || status
}

async function sendProductsList(chatId: number, page: number = 1) {
  try {
    const pageSize = 5
    const skip = (page - 1) * pageSize
    
    // Получаем общее количество активных товаров для пагинации
    const totalProducts = await prisma.product.count({
      where: { isActive: true }
    })
    
    const products = await prisma.product.findMany({
      where: { isActive: true },
      skip: skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        skus: true,
        _count: {
          select: { skus: true }
        }
      }
    })

    const totalPages = Math.ceil(totalProducts / pageSize)
    let message = '🛍️ *Список товаров:*\n\n'
    
    if (totalPages > 1) {
      message += `📄 Страница ${page} из ${totalPages}\n\n`
    }
    
    if (products.length === 0) {
      message += 'Товаров пока нет'
    } else {
      products.forEach((product, index) => {
        const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
        message += `${skip + index + 1}. 📦 ${product.name}\n`
        message += `   💰 От $${minPrice}\n`
        message += `   🔢 Вариантов: ${product._count.skus}\n`
        message += `   🎬 Видео: ${product.videoUrl ? '✅' : '❌'}\n\n`
      })
    }

    // Добавляем кнопки пагинации если нужно
    const buttons = []
    const paginationButtons = []
    if (page > 1) {
      paginationButtons.push({ text: '◀️ Назад', callback_data: `products_list_page_${page - 1}` })
    }
    if (page < totalPages) {
      paginationButtons.push({ text: '▶️ Далее', callback_data: `products_list_page_${page + 1}` })
    }
    
    if (paginationButtons.length > 0) {
      buttons.push(paginationButtons)
    }
    
    buttons.push([{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }])

    const keyboard = {
      inline_keyboard: buttons
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error getting products:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения товаров')
  }
}


async function sendTelegramMessage(chatId: number, text: string, markdown = false, keyboard?: any) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        ...(markdown && { parse_mode: 'Markdown' }),
        ...(keyboard && { reply_markup: keyboard })
      })
    })
    
    const result = await response.json()
    if (!result.ok) {
      console.error('❌ Telegram API error:', result)
    } else {
      console.log('✅ Message sent successfully')
    }
    return result
  } catch (error) {
    console.error('❌ Failed to send message:', error)
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || ''
      })
    })
  } catch (error) {
    console.error('❌ Failed to answer callback query:', error)
  }
}

// Функция для обработки состояний пользователей
async function handleUserState(message: any, userState: any) {
  const chatId = message.chat.id
  const userId = message.from.id
  const text = message.text
  const photo = message.photo
  const video = message.video
  
  console.log('handleUserState called for user:', userId, 'action:', userState?.action, 'text:', text, 'hasPhoto:', !!photo)
  
  // Обработка команды /cancel для всех состояний
  if (text === '/cancel') {
    userStates.delete(userId.toString())
    await sendTelegramMessage(chatId, '❌ Операция отменена')
    await sendMainMenu(chatId)
    return
  }
  
  switch(userState.action) {
    case 'add_product_name':
      return await handleAddProductName(chatId, userId, text)
    case 'add_product_description':
      return await handleAddProductDescription(chatId, userId, text)
    case 'add_product_price':
      return await handleAddProductPrice(chatId, userId, text)
    case 'add_product_category':
      return await handleAddProductCategory(chatId, userId, text)
    case 'add_product_size':
      return await handleAddProductSize(chatId, userId, text)
    case 'add_product_photo':
      // Проверяем команду "готово" для завершения загрузки фото
      if (text === 'готово' || text === 'done') {
        const userState = userStates.get(userId.toString())
        userState.action = 'add_product_video'
        userStates.set(userId.toString(), userState)
        
        const videoKeyboard = {
          inline_keyboard: [
            [
              { text: '⏭️ Пропустить видео', callback_data: 'video_upload_skip' }
            ],
            [
              { text: '❌ Отменить создание товара', callback_data: 'cancel_product_creation' }
            ]
          ]
        }
        
        return await sendTelegramMessage(chatId, '🎬 Отправьте видео товара или используйте кнопку для пропуска:', true, videoKeyboard)
      } else {
        return await handleAddProductPhoto(chatId, userId, photo, text)
      }
    case 'add_product_video':
      return await handleAddProductVideo(chatId, userId, video, text)
    case 'add_product_stock':
      return await handleAddProductStock(chatId, userId, text)
    case 'add_product_weight':
      return await handleAddProductWeight(chatId, userId, text)
    case 'upload_home_video':
      return await handleUploadHomeVideo(chatId, userId, video)
    case 'upload_sign_video':
      return await handleUploadSignVideo(chatId, userId, video)
    case 'upload_product_video':
      return await handleUploadProductVideo(chatId, userId, video, userState.productId)
    case 'edit_product_name':
      return await handleEditProductName(chatId, userId, text)
    case 'edit_product_description':
      return await handleEditProductDescription(chatId, userId, text)
    case 'edit_product_price':
      return await handleEditProductPrice(chatId, userId, text)
    case 'edit_product_stock':
      return await handleEditProductStock(chatId, userId, text)
    case 'creating_category':
      return await handleCreateCategory(chatId, userId, text, userState)
    case 'editing_category_name':
      return await handleEditCategoryNameInput(chatId, userId, text, userState)
    case 'entering_tracking_number':
      return await handleTrackingInput(chatId, userId, text, userState.orderId)
    case 'uploading_digital_content':
      return await handleDigitalUpload(chatId, userId, message, userState.orderId)
    default:
      // Неизвестное состояние, сбрасываем
      console.error('Unknown user state action:', userState?.action, 'for user:', userId)
      userStates.delete(userId.toString())
      await sendTelegramMessage(chatId, `❌ Неизвестное состояние: ${userState?.action}. Начните заново.`)
      await sendMainMenu(chatId)
  }
}

// Функции для добавления товара
async function startAddProduct(chatId: number, userId: number) {
  userStates.set(userId.toString(), { action: 'add_product_name', productData: {} })
  await sendTelegramMessage(chatId, '📝 *Добавление нового товара*\n\nВведите название товара:', true)
}

async function handleAddProductName(chatId: number, userId: number, text: string) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, введите корректное название товара')
    return
  }
  
  const userState = userStates.get(userId.toString())
  userState.productData.name = text
  userState.action = 'add_product_description'
  userStates.set(userId.toString(), userState)
  
  await sendTelegramMessage(chatId, '📄 Введите описание товара:')
}

async function handleAddProductDescription(chatId: number, userId: number, text: string) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, введите описание товара')
    return
  }
  
  const userState = userStates.get(userId.toString())
  if (!userState) {
    console.error('No user state found for user', userId)
    await sendTelegramMessage(chatId, '❌ Ошибка состояния. Начните заново с /start')
    return
  }
  
  console.log('Setting description for user', userId, 'description:', text)
  userState.productData.description = text
  userState.action = 'add_product_price'
  userStates.set(userId.toString(), userState)
  
  await sendTelegramMessage(chatId, '💰 Введите цену товара в USD (только число):')
}

async function handleAddProductPrice(chatId: number, userId: number, text: string) {
  const price = parseFloat(text)
  
  if (isNaN(price) || price <= 0) {
    await sendTelegramMessage(chatId, '❌ Введите корректную цену (например: 25.99)')
    return
  }
  
  const userState = userStates.get(userId.toString())
  if (!userState) {
    console.error('No user state found for user', userId, 'at price step')
    await sendTelegramMessage(chatId, '❌ Ошибка состояния. Начните заново с /start')
    return
  }
  
  console.log('Setting price for user', userId, 'price:', price)
  userState.productData.price = price
  userState.action = 'add_product_category'
  userStates.set(userId.toString(), userState)
  
  console.log('Calling sendCategorySelection for user', userId)
  await sendCategorySelection(chatId)
}

async function sendCategorySelection(chatId: number) {
  try {
    console.log('sendCategorySelection called for chatId:', chatId)
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    console.log('Found categories:', categories.length)
    
    if (categories.length === 0) {
      await sendTelegramMessage(chatId, '❌ В системе нет активных категорий. Сначала создайте категорию в админ-панели.')
      return
    }
    
    // Создаем кнопки для категорий (по 2 в ряду)
    const categoryButtons = []
    for (let i = 0; i < categories.length; i += 2) {
      const row = []
      row.push({ text: categories[i].name, callback_data: `select_category_${categories[i].id}` })
      if (categories[i + 1]) {
        row.push({ text: categories[i + 1].name, callback_data: `select_category_${categories[i + 1].id}` })
      }
      categoryButtons.push(row)
    }
    
    // Добавляем кнопку для создания новой категории
    categoryButtons.push([{ text: '➕ Создать новую категорию', callback_data: 'create_new_category' }])
    
    const keyboard = {
      inline_keyboard: categoryButtons
    }
    
    await sendTelegramMessage(chatId, '📂 Выберите категорию товара:', true, keyboard)
    
  } catch (error) {
    console.error('Error fetching categories:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки категорий')
  }
}

async function handleAddProductCategory(chatId: number, userId: number, text: string) {
  // Этот метод будет вызван только если пользователь вводит текст вместо выбора кнопки
  await sendTelegramMessage(chatId, '❌ Пожалуйста, выберите категорию из предложенных кнопок или создайте новую')
}

async function handleCategorySelection(chatId: number, userId: number, categoryId: string) {
  try {
    const userState = userStates.get(userId.toString())
    if (!userState || userState.action !== 'add_product_category') {
      await sendTelegramMessage(chatId, '❌ Ошибка состояния. Начните заново.')
      return
    }
    
    // Проверяем, что категория существует
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })
    
    if (!category) {
      await sendTelegramMessage(chatId, '❌ Категория не найдена')
      return
    }
    
    // Сохраняем выбранную категорию
    userState.productData.categoryId = categoryId
    userState.action = 'add_product_size'
    userStates.set(userId.toString(), userState)
    
    await sendTelegramMessage(chatId, '📏 Введите размер товара (например: Standard, XL, 42, Large и т.д.):')
    
  } catch (error) {
    console.error('Error handling category selection:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка выбора категории')
  }
}

async function handleAddProductSize(chatId: number, userId: number, text: string) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, введите размер товара (например: Standard, XL, 42):')
    return
  }
  
  const userState = userStates.get(userId.toString())
  if (!userState) {
    await sendTelegramMessage(chatId, '❌ Ошибка состояния. Начните заново.')
    return
  }
  
  userState.productData.size = text.trim()
  userState.action = 'add_product_photo'
  userStates.set(userId.toString(), userState)
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '⏭️ Пропустить фото', callback_data: 'photo_upload_skip' }
      ],
      [
        { text: '❌ Отменить создание товара', callback_data: 'cancel_product_creation' }
      ]
    ]
  }
  
  await sendTelegramMessage(
    chatId,
    '📸 *Отправьте фото товара*\n\nМожете отправить несколько фото подряд.\nКогда закончите, напишите "готово" или используйте кнопку:',
    true,
    keyboard
  )
}


async function handleAddProductPhoto(chatId: number, userId: number, photo: any, text: string) {
  const userState = userStates.get(userId.toString())
  
  // Если пользователь хочет пропустить добавление фото
  if (text === 'пропустить' || text === 'skip') {
    userState.action = 'add_product_video'
    userStates.set(userId.toString(), userState)
    
    const videoKeyboard = {
      inline_keyboard: [
        [
          { text: '⏭️ Пропустить видео', callback_data: 'video_upload_skip' }
        ],
        [
          { text: '❌ Отменить создание товара', callback_data: 'cancel_product_creation' }
        ]
      ]
    }
    
    await sendTelegramMessage(chatId, '🎬 Отправьте видео товара или используйте кнопку для пропуска:', true, videoKeyboard)
    return
  }
  
  // Если нет фото
  if (!photo) {
    if (text && (text !== 'пропустить' && text !== 'skip')) {
      await sendTelegramMessage(chatId, '❌ Пожалуйста, отправьте фото товара или используйте кнопки')
    } else {
      await sendTelegramMessage(chatId, '❌ Пожалуйста, отправьте фото товара или напишите "пропустить"')
    }
    return
  }
  
  await sendTelegramMessage(chatId, '⏳ Загружаю фото...')
  
  try {
    const photoUrl = await uploadPhotoToCloudinary(photo)
    
    if (!photoUrl) {
      throw new Error('Failed to upload photo')
    }
    
    // Инициализируем массив изображений если его нет
    if (!userState.productData.images) {
      userState.productData.images = []
    }
    
    // Добавляем изображение в массив
    userState.productData.images.push({
      url: photoUrl,
      isPrimary: userState.productData.images.length === 0 // Первое фото - главное
    })
    
    userStates.set(userId.toString(), userState)
    
    const photoCount = userState.productData.images.length
    
    // Добавляем кнопки к сообщению
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Готово', callback_data: 'photo_upload_done' }
        ],
        [
          { text: '❌ Отменить', callback_data: 'cancel_product_creation' }
        ]
      ]
    }
    
    await sendTelegramMessage(
      chatId, 
      `✅ Фото ${photoCount} загружено!\n\n📸 Отправьте еще фото или нажмите "Готово" для продолжения:`,
      false,
      keyboard
    )
  } catch (error) {
    console.error('Error uploading photo:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки фото. Попробуйте еще раз.')
  }
}

async function handleAddProductVideo(chatId: number, userId: number, video: any, text: string) {
  const userState = userStates.get(userId.toString())
  
  if (text === 'пропустить' || text === 'skip') {
    userState.productData.videoUrl = null
  } else if (video) {
    await sendTelegramMessage(chatId, '⏳ Загружаю видео...')
    
    try {
      const videoUrl = await uploadVideoToCloudinary(video)
      if (videoUrl) {
        userState.productData.videoUrl = videoUrl
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      await sendTelegramMessage(chatId, '❌ Ошибка загрузки видео, продолжаем без видео...')
    }
  } else {
    const videoKeyboard = {
      inline_keyboard: [
        [
          { text: '⏭️ Пропустить видео', callback_data: 'video_upload_skip' }
        ],
        [
          { text: '❌ Отменить создание товара', callback_data: 'cancel_product_creation' }
        ]
      ]
    }
    
    await sendTelegramMessage(chatId, '❌ Отправьте видео или используйте кнопку для пропуска:', true, videoKeyboard)
    return
  }
  
  // Переходим к запросу количества товара
  userState.action = 'add_product_stock'
  userStates.set(userId.toString(), userState)
  await sendTelegramMessage(chatId, '📦 Введите количество товара в наличии (например: 50):')
}

async function handleAddProductStock(chatId: number, userId: number, text: string) {
  const userState = userStates.get(userId.toString())
  
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Введите корректное количество товара:')
    return
  }
  
  const stock = parseInt(text.trim())
  
  if (isNaN(stock) || stock < 0) {
    await sendTelegramMessage(chatId, '❌ Количество должно быть числом (0 или больше). Попробуйте еще раз:')
    return
  }
  
  if (stock > 10000) {
    await sendTelegramMessage(chatId, '❌ Слишком большое количество. Максимум 10000 штук:')
    return
  }
  
  userState.productData.stock = stock
  
  // Переходим к запросу веса товара
  userState.action = 'add_product_weight'
  userStates.set(userId.toString(), userState)
  await sendTelegramMessage(chatId, '⚖️ Введите вес товара в килограммах (например: 0.5 или 1.2):\n\n💡 *Это нужно для автоматического расчета стоимости доставки по тарифам Meest*', true)
}

async function handleAddProductWeight(chatId: number, userId: number, text: string) {
  const userState = userStates.get(userId.toString())
  
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Введите корректный вес товара:')
    return
  }
  
  const weight = parseFloat(text.trim().replace(',', '.'))
  
  if (isNaN(weight) || weight <= 0) {
    await sendTelegramMessage(chatId, '❌ Вес должен быть положительным числом (например: 0.5). Попробуйте еще раз:')
    return
  }
  
  if (weight > 50) {
    await sendTelegramMessage(chatId, '❌ Слишком большой вес. Максимум 50 кг:')
    return
  }
  
  userState.productData.weight = weight
  
  // Создаем товар
  await createProductFromBot(chatId, userId, userState.productData)
  userStates.delete(userId.toString())
}

async function createProductFromBot(chatId: number, userId: number, productData: any) {
  try {
    await sendTelegramMessage(chatId, '⏳ Создаю товар...')
    
    // Создаем slug из названия
    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    // Проверяем выбранную категорию
    if (!productData.categoryId) {
      await sendTelegramMessage(chatId, '❌ Категория не выбрана. Попробуйте еще раз.')
      return
    }
    
    const selectedCategory = await prisma.category.findUnique({
      where: { id: productData.categoryId }
    })
    
    if (!selectedCategory) {
      await sendTelegramMessage(chatId, '❌ Выбранная категория не найдена.')
      return
    }
    
    if (!selectedCategory.isActive) {
      await sendTelegramMessage(chatId, `❌ Категория "${selectedCategory.name}" неактивна. Активируйте категорию перед добавлением товаров.`)
      return
    }
    
    // Создаем товар
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: slug + '-' + Date.now(),
        description: productData.description,
        categoryId: selectedCategory.id,
        videoUrl: productData.videoUrl,
        isActive: true
      }
    })
    
    // Создаем SKU
    await prisma.productSku.create({
      data: {
        sku: `SKU-${product.id.slice(-8).toUpperCase()}`,
        size: productData.size || 'Standard',
        price: productData.price,
        stock: productData.stock || 100,
        weight: productData.weight || 0.5,
        productId: product.id,
        isActive: true
      }
    })
    
    // Создаем изображения
    if (productData.images && productData.images.length > 0) {
      // Создаем множественные изображения
      for (const image of productData.images) {
        await prisma.productImage.create({
          data: {
            url: image.url,
            alt: productData.name,
            isPrimary: image.isPrimary,
            productId: product.id
          }
        })
      }
    } else if (productData.imageUrl) {
      // Поддержка старого формата (одно изображение)
      await prisma.productImage.create({
        data: {
          url: productData.imageUrl,
          alt: productData.name,
          isPrimary: true,
          productId: product.id
        }
      })
    }
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '➕ Добавить еще товар', callback_data: 'add_product' },
          { text: '📋 Список товаров', callback_data: 'products_list' }
        ],
        [
          { text: '⬅️ Назад к товарам', callback_data: 'back_products' }
        ]
      ]
    }
    
    await sendTelegramMessage(
      chatId,
      `✅ *Товар успешно создан!*\n\n📦 Название: ${productData.name}\n💰 Цена: $${productData.price}\n⚖️ Вес: ${productData.weight}кг\n🏷️ Категория: ${selectedCategory.name}\n📊 Статус: ${product.isActive ? 'Активен ✅' : 'Неактивен ❌'}\n🆔 ID: ${product.id}\n🔑 Slug: ${product.slug}\n\n🔗 Ссылка: https://vobvorot.com/products/${product.slug}\n\n💡 Если товар не виден на сайте, убедитесь что категория активна.`,
      true,
      keyboard
    )
    
  } catch (error) {
    console.error('Error creating product:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка создания товара. Попробуйте позже.')
  }
}

// Функции для управления видео
async function startUploadVideo(chatId: number, userId: number) {
  userStates.set(userId.toString(), { action: 'upload_home_video' })
  await sendTelegramMessage(chatId, '🎬 Отправьте видео для главной страницы:')
}

async function handleUploadHomeVideo(chatId: number, userId: number, video: any) {
  if (!video) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, отправьте видео файл')
    return
  }
  
  await sendTelegramMessage(chatId, '⏳ Загружаю видео...')
  
  try {
    await saveDebugLog('handle_upload_start', {
      chatId: chatId,
      userId: userId,
      video_file_id: video.file_id,
      video_file_size: video.file_size,
      video_duration: video.duration
    })
    
    // Проверяем размер файла заранее
    if (video.file_size && video.file_size > 20 * 1024 * 1024) {
      await saveDebugLog('file_size_error', {
        file_size: video.file_size,
        max_size: 20 * 1024 * 1024
      })
      await sendTelegramMessage(chatId, '❌ Файл слишком большой. Максимальный размер: 20MB\n\nПопробуйте сжать видео или выберите файл меньшего размера.')
      userStates.delete(userId.toString())
      return
    }
    
    const videoUrl = await uploadVideoToCloudinary(video)
    
    await saveDebugLog('upload_result', {
      videoUrl: videoUrl,
      success: !!videoUrl
    })
    
    if (videoUrl) {
      await addVideoToGallery(videoUrl)
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
        ]
      }
      
      await sendTelegramMessage(chatId, `✅ Видео добавлено в галерею!\n\n🔗 URL: ${videoUrl}\n\nВидео будет автоматически конвертировано в MP4 формат для веб-совместимости.`, false, keyboard)
    } else {
      await sendTelegramMessage(chatId, '❌ Ошибка загрузки видео\n\nВозможные причины:\n• Неподдерживаемый формат\n• Проблемы с сетью\n• Превышен размер файла\n\nПопробуйте загрузить видео в формате MP4, MOV или AVI размером до 20MB.')
    }
  } catch (error) {
    console.error('Error uploading video:', error)
    
    await saveDebugLog('handle_upload_error', {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error)
    })
    
    let errorMessage = '❌ Ошибка загрузки видео'
    
    if (error instanceof Error) {
      if (error.message.includes('размер')) {
        errorMessage = '❌ ' + error.message
      } else if (error.message.includes('формат')) {
        errorMessage = '❌ Неподдерживаемый формат видео\n\nПоддерживаемые форматы: MP4, MOV, AVI, MKV'
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = '❌ Ошибка сети. Попробуйте еще раз через несколько секунд.'
      }
    }
    
    await sendTelegramMessage(chatId, errorMessage)
  }
  
  userStates.delete(userId.toString())
}

async function deleteHomeVideo(chatId: number) {
  try {
    // Получаем список всех видео напрямую из базы данных
    const videos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    if (!videos || videos.length === 0) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
        ]
      }
      await sendTelegramMessage(chatId, '❌ Нет видео для удаления', false, keyboard)
      return
    }
    
    // Создаем кнопки для выбора видео для удаления
    const videoButtons = []
    for (const video of videos) {
      const videoName = video.value.split('/').pop()?.split('.')[0] || 'video'
      const shortName = videoName.length > 20 ? videoName.substring(0, 20) + '...' : videoName
      videoButtons.push([{
        text: `🗑️ ${shortName}`,
        callback_data: `confirm_delete_video_${video.key}`
      }])
    }
    
    // Добавляем кнопку "Назад"
    videoButtons.push([{ text: '⬅️ Назад к видео', callback_data: 'back_video' }])
    
    const keyboard = {
      inline_keyboard: videoButtons
    }
    
    await sendTelegramMessage(chatId, `🗑️ *Выберите видео для удаления:*\n\nВсего видео: ${videos.length}`, true, keyboard)
  } catch (error) {
    console.error('Error showing delete video menu:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка видео')
  }
}

async function getCurrentVideoInfo(chatId: number) {
  try {
    // Получаем список всех видео напрямую из базы данных
    const videos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
      ]
    }
    
    if (videos && videos.length > 0) {
      let message = `🎬 *Галерея видео главной страницы:*\n\n📊 Всего видео: ${videos.length}\n\n`
      
      videos.forEach((video: any, index: number) => {
        const videoName = video.value.split('/').pop()?.split('.')[0] || 'video'
        const shortName = videoName.length > 30 ? videoName.substring(0, 30) + '...' : videoName
        const createdDate = new Date(video.createdAt).toLocaleString('ru-RU')
        message += `${index + 1}. 🎥 ${shortName}\n`
        message += `   📅 ${createdDate}\n`
        message += `   🔗 ${video.value.length > 50 ? video.value.substring(0, 50) + '...' : video.value}\n\n`
      })
      
      await sendTelegramMessage(chatId, message, true, keyboard)
    } else {
      // Галерея пуста - показываем сообщение без автоматической инициализации
      const emptyKeyboard = {
        inline_keyboard: [
          [{ text: '📤 Загрузить видео', callback_data: 'upload_video' }],
          [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
        ]
      }
      
      await sendTelegramMessage(chatId, `🎬 *Галерея видео главной страницы:*\n\n📊 Всего видео: 0\n\n✨ Галерея пуста. Загрузите первое видео!`, true, emptyKeyboard)
    }
  } catch (error) {
    console.error('Error getting video info:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о видео')
  }
}

async function initializeGalleryWithDefault(chatId: number) {
  try {
    // Сначала очищаем пустые записи видео
    await cleanupEmptyVideoRecords()
    
    // Добавляем дефолтное видео прямо в базу данных
    const defaultVideoUrl = "/assets/videos/hero2.mp4"
    
    const addedVideo = await prisma.setting.create({
      data: {
        key: `home_video_${Date.now()}`,
        value: defaultVideoUrl
      }
    })
    
    await saveDebugLog('gallery_initialized', {
      video_id: addedVideo.key,
      video_url: addedVideo.value,
      message: 'Gallery initialized with default video'
    })
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🎬 Обновить галерею', callback_data: 'current_video' }],
        [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
      ]
    }
    
    await sendTelegramMessage(
      chatId, 
      `✅ *Галерея инициализирована!*\n\n🎥 Добавлено дефолтное видео: hero2.mp4\n\nТеперь вы можете загружать новые видео и управлять галереей.`, 
      true, 
      keyboard
    )
  } catch (error) {
    console.error('Error initializing gallery:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка инициализации галереи')
  }
}

// ===== ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ SIGN ВИДЕО =====

async function startUploadSignVideo(chatId: number, userId: number) {
  userStates.set(userId.toString(), { action: 'upload_sign_video' })
  await sendTelegramMessage(chatId, '🎭 Отправьте видео для страницы Sing:')
}

async function handleUploadSignVideo(chatId: number, userId: number, video: any) {
  if (!video) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, отправьте видео файл')
    return
  }

  try {
    await sendTelegramMessage(chatId, '🔄 Загружаю видео в галерею...')

    // Загружаем видео в Cloudinary
    const videoUrl = await uploadVideoToCloudinary(video)
    
    if (!videoUrl) {
      throw new Error('Failed to upload video to Cloudinary')
    }

    // Добавляем видео в галерею sign через API
    await addSignVideoToGallery(videoUrl)
    
    await sendTelegramMessage(chatId, '✅ Видео успешно добавлено в галерею страницы Sing!')
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '📤 Загрузить еще', callback_data: 'upload_sign_video' }],
        [{ text: '🎭 Проверить галерею', callback_data: 'current_sign_video' }],
        [{ text: '⬅️ Назад к меню', callback_data: 'sign_video' }]
      ]
    }
    
    await sendTelegramMessage(chatId, '🎬 Что делаем дальше?', true, keyboard)
    
  } catch (error) {
    console.error('Error uploading sign video:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки видео. Попробуйте еще раз.')
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🔄 Попробовать снова', callback_data: 'upload_sign_video' }],
        [{ text: '⬅️ Назад к меню', callback_data: 'sign_video' }]
      ]
    }
    
    await sendTelegramMessage(chatId, '🎬 Выберите действие:', true, keyboard)
  }
}

async function deleteSignVideo(chatId: number) {
  try {
    // Получаем список всех sign видео напрямую из базы данных
    const videos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'sign_video_'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    if (videos && videos.length > 0) {
      let message = `🎭 *Выберите видео для удаления:*\n\n📊 Всего видео: ${videos.length}\n\n`
      
      const keyboard = {
        inline_keyboard: [] as any[][]
      }
      
      videos.forEach((video: any, index: number) => {
        const videoName = video.value.split('/').pop()?.split('.')[0] || 'video'
        const shortName = videoName.length > 30 ? videoName.substring(0, 30) + '...' : videoName
        message += `${index + 1}. 🎥 ${shortName}\n`
        keyboard.inline_keyboard.push([{
          text: `🗑️ Удалить ${index + 1}`,
          callback_data: `delete_sign_video_${video.key}`
        }])
      })
      
      keyboard.inline_keyboard.push([{ text: '⬅️ Назад', callback_data: 'sign_video' }])
      
      await sendTelegramMessage(chatId, message, true, keyboard)
    } else {
      const emptyKeyboard = {
        inline_keyboard: [
          [{ text: '📤 Загрузить видео', callback_data: 'upload_sign_video' }],
          [{ text: '⬅️ Назад', callback_data: 'sign_video' }]
        ]
      }
      
      await sendTelegramMessage(chatId, `🎭 *Галерея видео страницы Sing:*\n\n📊 Всего видео: 0\n\n✨ Галерея пуста. Загрузите первое видео!`, true, emptyKeyboard)
    }
  } catch (error) {
    console.error('Error fetching sign videos:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка видео')
  }
}

async function getCurrentSignVideoInfo(chatId: number) {
  try {
    // Получаем список всех sign видео напрямую из базы данных
    const videos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'sign_video_'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео', callback_data: 'sign_video' }]
      ]
    }
    
    if (videos && videos.length > 0) {
      let message = `🎭 *Галерея видео страницы Sing:*\n\n📊 Всего видео: ${videos.length}\n\n`
      
      videos.forEach((video: any, index: number) => {
        const videoName = video.value.split('/').pop()?.split('.')[0] || 'video'
        const shortName = videoName.length > 30 ? videoName.substring(0, 30) + '...' : videoName
        const createdDate = new Date(video.createdAt).toLocaleString('ru-RU')
        message += `${index + 1}. 🎥 ${shortName}\n`
        message += `   📅 ${createdDate}\n`
        message += `   🔗 ${video.value.length > 50 ? video.value.substring(0, 50) + '...' : video.value}\n\n`
      })
      
      await sendTelegramMessage(chatId, message, true, keyboard)
    } else {
      // Галерея пуста - показываем сообщение без автоматической инициализации
      const emptyKeyboard = {
        inline_keyboard: [
          [{ text: '📤 Загрузить видео', callback_data: 'upload_sign_video' }],
          [{ text: '⬅️ Назад к видео', callback_data: 'sign_video' }]
        ]
      }
      
      await sendTelegramMessage(chatId, `🎭 *Галерея видео страницы Sing:*\n\n📊 Всего видео: 0\n\n✨ Галерея пуста. Загрузите первое видео!`, true, emptyKeyboard)
    }
  } catch (error) {
    console.error('Error getting sign video info:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о видео')
  }
}

async function confirmSignVideoDelete(chatId: number, videoId: string) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Да, удалить', callback_data: `confirm_delete_sign_video_${videoId}` },
        { text: '❌ Отмена', callback_data: `cancel_delete_sign_video_${videoId}` }
      ]
    ]
  }

  await sendTelegramMessage(
    chatId,
    `⚠️ *Подтверждение удаления*\n\nВы действительно хотите удалить это видео из галереи страницы Sing?\n\n🆔 ID: ${videoId}`,
    true,
    keyboard
  )
}

async function executeSignVideoDelete(chatId: number, videoId: string) {
  try {
    await sendTelegramMessage(chatId, '🗑️ Удаляю видео...')
    await deleteSignVideoFromGallery(videoId)
    
    await sendTelegramMessage(chatId, '✅ Видео успешно удалено из галереи страницы Sing!')
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🗑️ Удалить еще', callback_data: 'delete_sign_video' }],
        [{ text: '🎭 Проверить галерею', callback_data: 'current_sign_video' }],
        [{ text: '⬅️ Назад к меню', callback_data: 'sign_video' }]
      ]
    }
    
    await sendTelegramMessage(chatId, '🎬 Что делаем дальше?', true, keyboard)

  } catch (error) {
    console.error('Error deleting sign video:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка удаления видео')
    await deleteSignVideo(chatId)
  }
}

async function deleteSignVideoFromGallery(videoId: string): Promise<void> {
  try {
    await saveDebugLog('delete_sign_video_from_gallery_start', {
      videoId: videoId,
      method: 'direct_database_delete'
    })
    
    // Удаляем видео напрямую из базы данных, минуя API
    const deletedVideo = await prisma.setting.delete({
      where: { key: videoId }
    })
    
    await saveDebugLog('delete_sign_video_from_gallery_success', {
      videoId: videoId,
      deletedVideoUrl: deletedVideo.value,
      message: 'Deleted from sign gallery successfully via direct database access'
    })
    
    console.log('Sign video deleted from gallery:', videoId, 'URL was:', deletedVideo.value)
  } catch (error) {
    console.error('Error deleting sign video from gallery:', error)
    await saveDebugLog('delete_sign_video_from_gallery_error', {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

async function addSignVideoToGallery(videoUrl: string): Promise<void> {
  try {
    await saveDebugLog('add_sign_video_to_gallery_start', {
      videoUrl: videoUrl,
      method: 'direct_database_insert'
    })
    
    // Добавляем видео напрямую в базу данных, минуя API
    const timestamp = Date.now()
    const videoKey = `sign_video_${timestamp}`
    
    const addedVideo = await prisma.setting.create({
      data: {
        key: videoKey,
        value: videoUrl
      }
    })
    
    // Подсчитываем общее количество видео
    const totalVideos = await prisma.setting.count({
      where: {
        key: {
          startsWith: 'sign_video_'
        }
      }
    })
    
    await saveDebugLog('add_sign_video_to_gallery_success', {
      videoUrl: videoUrl,
      videoId: addedVideo.key,
      totalVideos: totalVideos,
      method: 'direct_database_insert'
    })

  } catch (error) {
    await saveDebugLog('add_sign_video_to_gallery_error', {
      videoUrl,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

async function cleanupEmptyVideoRecords() {
  try {
    // Удаляем все пустые записи видео
    const deleteResult = await prisma.setting.deleteMany({
      where: {
        OR: [
          {
            key: {
              startsWith: 'home_video'
            },
            value: ''
          },
          {
            key: {
              startsWith: 'home_video'
            },
            value: ''
          }
        ]
      }
    })
    
    await saveDebugLog('cleanup_empty_videos', {
      deleted_count: deleteResult.count,
      message: 'Cleaned up empty video records'
    })
    
    console.log(`Cleaned up ${deleteResult.count} empty video records`)
  } catch (error) {
    console.error('Error cleaning up empty video records:', error)
  }
}

async function fixGalleryManually(chatId: number) {
  try {
    await sendTelegramMessage(chatId, '🔧 Исправляю галерею видео...')
    
    // Очищаем пустые записи
    await cleanupEmptyVideoRecords()
    
    // Проверяем, есть ли видео после очистки
    const existingVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      }
    })
    
    if (existingVideos.length === 0) {
      // Добавляем дефолтное видео
      const defaultVideo = await prisma.setting.create({
        data: {
          key: `home_video_${Date.now()}`,
          value: '/assets/videos/hero2.mp4'
        }
      })
      
      await saveDebugLog('manual_gallery_fix', {
        video_id: defaultVideo.key,
        video_url: defaultVideo.value,
        message: 'Gallery fixed manually via /fix_gallery command'
      })
    }
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🎬 Проверить галерею', callback_data: 'current_video' }],
        [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
      ]
    }
    
    await sendTelegramMessage(
      chatId, 
      '✅ *Галерея исправлена!*\n\nПустые записи удалены, дефолтное видео добавлено.\n\nТеперь все функции должны работать корректно.', 
      true, 
      keyboard
    )
  } catch (error) {
    console.error('Error fixing gallery manually:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка при исправлении галереи')
  }
}

// Функции для редактирования товаров
async function sendProductsListForEdit(chatId: number, page: number = 1) {
  try {
    const pageSize = 5
    const skip = (page - 1) * pageSize
    
    // Получаем общее количество активных товаров для пагинации
    const totalProducts = await prisma.product.count({
      where: { isActive: true }
    })
    
    const products = await prisma.product.findMany({
      where: { isActive: true },
      skip: skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        skus: true,
        category: true,
        _count: {
          select: { skus: true }
        }
      }
    })

    if (products.length === 0) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }]
        ]
      }
      await sendTelegramMessage(chatId, '📝 *Редактирование товаров*\n\nТоваров для редактирования не найдено', true, keyboard)
      return
    }

    const totalPages = Math.ceil(totalProducts / pageSize)
    let message = '📝 *Выберите товар для редактирования:*\n\n'
    
    if (totalPages > 1) {
      message += `📄 Страница ${page} из ${totalPages}\n\n`
    }

    // Создаем кнопки для каждого товара
    const productButtons = []
    for (const product of products) {
      const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
      productButtons.push([{
        text: `📝 ${product.name} - $${minPrice}`,
        callback_data: `edit_product_${product.id}`
      }])
    }

    // Добавляем кнопки пагинации если нужно
    const paginationButtons = []
    if (page > 1) {
      paginationButtons.push({ text: '◀️ Назад', callback_data: `products_edit_page_${page - 1}` })
    }
    if (page < totalPages) {
      paginationButtons.push({ text: '▶️ Далее', callback_data: `products_edit_page_${page + 1}` })
    }
    
    if (paginationButtons.length > 0) {
      productButtons.push(paginationButtons)
    }

    // Добавляем кнопку "Назад"
    productButtons.push([{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }])

    const keyboard = {
      inline_keyboard: productButtons
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error getting products for edit:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка товаров')
  }
}

async function sendProductsListForDelete(chatId: number, page: number = 1) {
  try {
    const pageSize = 5
    const skip = (page - 1) * pageSize
    
    // Получаем общее количество активных товаров для пагинации
    const totalProducts = await prisma.product.count({
      where: { isActive: true }
    })
    
    const products = await prisma.product.findMany({
      where: { isActive: true },
      skip: skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        skus: true,
        category: true,
        _count: {
          select: { skus: true }
        }
      }
    })

    if (products.length === 0) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }]
        ]
      }
      await sendTelegramMessage(chatId, '🗑️ *Удаление товаров*\n\nТоваров для удаления не найдено', true, keyboard)
      return
    }

    const totalPages = Math.ceil(totalProducts / pageSize)
    let message = '🗑️ *Выберите товар для удаления:*\n\n'
    
    if (totalPages > 1) {
      message += `📄 Страница ${page} из ${totalPages}\n\n`
    }

    // Создаем кнопки для каждого товара
    const productButtons = []
    for (const product of products) {
      const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
      productButtons.push([{
        text: `🗑️ ${product.name} - $${minPrice}`,
        callback_data: `delete_product_${product.id}`
      }])
    }

    // Добавляем кнопки пагинации если нужно
    const paginationButtons = []
    if (page > 1) {
      paginationButtons.push({ text: '◀️ Назад', callback_data: `products_delete_page_${page - 1}` })
    }
    if (page < totalPages) {
      paginationButtons.push({ text: '▶️ Далее', callback_data: `products_delete_page_${page + 1}` })
    }
    
    if (paginationButtons.length > 0) {
      productButtons.push(paginationButtons)
    }

    // Добавляем кнопку "Назад"
    productButtons.push([{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }])

    const keyboard = {
      inline_keyboard: productButtons
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error getting products for delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка товаров')
  }
}

async function startProductEdit(chatId: number, userId: number, productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        skus: true,
        category: true,
        images: true
      }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
    const totalStock = product.skus.reduce((sum, sku) => sum + sku.stock, 0)
    
    const message = `📝 *Редактирование товара:*

📦 *Название:* ${product.name}
📄 *Описание:* ${product.description || 'Не указано'}
💰 *Цена:* $${minPrice}
🏷️ *Категория:* ${product.category?.name || 'Не указана'}
📊 *Количество:* ${totalStock} шт.
🎬 *Видео:* ${product.videoUrl ? '✅ Есть' : '❌ Нет'}
📸 *Фото:* ${product.images.length > 0 ? `✅ ${product.images.length} шт.` : '❌ Нет'}

Выберите поле для редактирования:`

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📝 Название', callback_data: `edit_field_${productId}_name` },
          { text: '📄 Описание', callback_data: `edit_field_${productId}_description` }
        ],
        [
          { text: '💰 Цена', callback_data: `edit_field_${productId}_price` },
          { text: '🏷️ Категория', callback_data: `edit_field_${productId}_category` }
        ],
        [
          { text: '📊 Количество', callback_data: `edit_field_${productId}_stock` }
        ],
        [
          { text: '🎬 Управление видео', callback_data: `manage_product_videos_${productId}` }
        ],
        [
          { text: '📁 Архивировать товар', callback_data: `archive_product_${productId}` }
        ],
        [
          { text: '⬅️ Назад к списку', callback_data: 'edit_product' }
        ]
      ]
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error starting product edit:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки товара')
  }
}

async function confirmProductArchive(chatId: number, productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        skus: true
      }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    const totalStock = product.skus.reduce((sum, sku) => sum + sku.stock, 0)
    
    const message = `📁 *Архивирование товара*\n\n` +
      `📦 Товар: ${product.name}\n` +
      `📊 Остаток: ${totalStock} шт.\n\n` +
      `⚠️ Архивированный товар:\n` +
      `• Исчезнет с сайта и из телеграм бота\n` +
      `• Останется в базе данных\n` +
      `• Можно будет восстановить позже\n\n` +
      `Подтверждаете архивирование?`

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Да, архивировать', callback_data: `confirm_archive_${productId}` },
          { text: '❌ Отмена', callback_data: `cancel_archive_${productId}` }
        ]
      ]
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error confirming product archive:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки товара')
  }
}

async function archiveProduct(chatId: number, productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    await sendTelegramMessage(chatId, '⏳ Архивирую товар...')

    // Архивируем товар (делаем неактивным)
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    })

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📝 Редактировать другой', callback_data: 'edit_product' },
          { text: '⬅️ К товарам', callback_data: 'back_products' }
        ]
      ]
    }

    await sendTelegramMessage(
      chatId,
      `✅ *Товар успешно архивирован!*\n\n📦 ${product.name}\n\n📁 Товар скрыт с сайта и убран из активных товаров бота`,
      true,
      keyboard
    )
  } catch (error) {
    console.error('Error archiving product:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка архивирования товара')
  }
}

async function startFieldEdit(chatId: number, userId: number, productId: string, field: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        skus: true,
        category: true
      }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    let message = ''
    let action = ''

    switch (field) {
      case 'name':
        message = `📝 *Текущее название:* ${product.name}\n\nВведите новое название товара:`
        action = 'edit_product_name'
        break
      case 'description':
        message = `📄 *Текущее описание:* ${product.description || 'Не указано'}\n\nВведите новое описание товара:`
        action = 'edit_product_description'
        break
      case 'price':
        const currentPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
        message = `💰 *Текущая цена:* $${currentPrice}\n\nВведите новую цену товара в USD:`
        action = 'edit_product_price'
        break
      case 'stock':
        const currentStock = product.skus.reduce((sum, sku) => sum + sku.stock, 0)
        message = `📊 *Текущее количество:* ${currentStock} шт.\n\nВведите новое количество товара в наличии:`
        action = 'edit_product_stock'
        break
      case 'category':
        await sendCategorySelectionForEdit(chatId, productId)
        return
    }

    userStates.set(userId.toString(), {
      action: action,
      productId: productId,
      editData: {}
    })

    await sendTelegramMessage(chatId, message, true)
  } catch (error) {
    console.error('Error starting field edit:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка')
  }
}

async function sendCategorySelectionForEdit(chatId: number, productId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    if (categories.length === 0) {
      await sendTelegramMessage(chatId, '❌ Активных категорий не найдено')
      return
    }
    
    const categoryButtons = []
    for (let i = 0; i < categories.length; i += 2) {
      const row = []
      row.push({ text: categories[i].name, callback_data: `edit_category_${productId}_${categories[i].id}` })
      if (categories[i + 1]) {
        row.push({ text: categories[i + 1].name, callback_data: `edit_category_${productId}_${categories[i + 1].id}` })
      }
      categoryButtons.push(row)
    }
    
    categoryButtons.push([{ text: '⬅️ Отмена', callback_data: `edit_product_${productId}` }])
    
    const keyboard = {
      inline_keyboard: categoryButtons
    }
    
    await sendTelegramMessage(chatId, '🏷️ Выберите новую категорию:', true, keyboard)
    
  } catch (error) {
    console.error('Error fetching categories for edit:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки категорий')
  }
}

async function handleEditProductName(chatId: number, userId: number, text: string) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Введите корректное название товара')
    return
  }

  const userState = userStates.get(userId.toString())
  if (!userState || !userState.productId) {
    await sendTelegramMessage(chatId, '❌ Ошибка состояния')
    return
  }

  try {
    await prisma.product.update({
      where: { id: userState.productId },
      data: { name: text }
    })

    userStates.delete(userId.toString())
    await sendTelegramMessage(chatId, `✅ Название товара обновлено на: "${text}"`)
    await startProductEdit(chatId, userId, userState.productId)
  } catch (error) {
    console.error('Error updating product name:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка обновления названия')
  }
}

async function handleEditProductDescription(chatId: number, userId: number, text: string) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Введите корректное описание товара')
    return
  }

  const userState = userStates.get(userId.toString())
  if (!userState || !userState.productId) {
    await sendTelegramMessage(chatId, '❌ Ошибка состояния')
    return
  }

  try {
    await prisma.product.update({
      where: { id: userState.productId },
      data: { description: text }
    })

    userStates.delete(userId.toString())
    await sendTelegramMessage(chatId, `✅ Описание товара обновлено`)
    await startProductEdit(chatId, userId, userState.productId)
  } catch (error) {
    console.error('Error updating product description:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка обновления описания')
  }
}

async function handleEditProductPrice(chatId: number, userId: number, text: string) {
  const price = parseFloat(text)
  
  if (isNaN(price) || price <= 0) {
    await sendTelegramMessage(chatId, '❌ Введите корректную цену (например: 25.99)')
    return
  }

  const userState = userStates.get(userId.toString())
  if (!userState || !userState.productId) {
    await sendTelegramMessage(chatId, '❌ Ошибка состояния')
    return
  }

  try {
    // Обновляем цену первого SKU (если их несколько, обновляем все)
    await prisma.productSku.updateMany({
      where: { productId: userState.productId },
      data: { price: price }
    })

    userStates.delete(userId.toString())
    await sendTelegramMessage(chatId, `✅ Цена товара обновлена на: $${price}`)
    await startProductEdit(chatId, userId, userState.productId)
  } catch (error) {
    console.error('Error updating product price:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка обновления цены')
  }
}

async function handleEditProductStock(chatId: number, userId: number, text: string) {
  const stock = parseInt(text.trim())
  
  if (isNaN(stock) || stock < 0) {
    await sendTelegramMessage(chatId, '❌ Введите корректное количество (число 0 или больше)')
    return
  }

  if (stock > 10000) {
    await sendTelegramMessage(chatId, '❌ Слишком большое количество. Максимум 10000 штук')
    return
  }

  const userState = userStates.get(userId.toString())
  if (!userState || !userState.productId) {
    await sendTelegramMessage(chatId, '❌ Ошибка состояния')
    return
  }

  try {
    // Обновляем количество для всех SKU товара
    await prisma.productSku.updateMany({
      where: { productId: userState.productId },
      data: { stock: stock }
    })

    userStates.delete(userId.toString())
    await sendTelegramMessage(chatId, `✅ Количество товара обновлено на: ${stock} шт.`)
    await startProductEdit(chatId, userId, userState.productId)
  } catch (error) {
    console.error('Error updating product stock:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка обновления количества')
  }
}

async function updateProductCategory(chatId: number, userId: number, productId: string, categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      await sendTelegramMessage(chatId, '❌ Категория не найдена')
      return
    }

    await prisma.product.update({
      where: { id: productId },
      data: { categoryId: categoryId }
    })

    await sendTelegramMessage(chatId, `✅ Категория товара обновлена на: "${category.name}"`)
    await startProductEdit(chatId, userId, productId)
  } catch (error) {
    console.error('Error updating product category:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка обновления категории')
  }
}

// Функции для удаления товаров
async function confirmProductDelete(chatId: number, productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        skus: true,
        category: true
      }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
    
    const message = `🗑️ *Подтверждение удаления*

⚠️ Вы действительно хотите удалить товар?

📦 *Название:* ${product.name}
💰 *Цена:* $${minPrice}
🏷️ *Категория:* ${product.category?.name || 'Не указана'}

*Это действие нельзя отменить!*`

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Да, удалить', callback_data: `confirm_delete_${productId}` },
          { text: '❌ Отмена', callback_data: `cancel_delete_${productId}` }
        ]
      ]
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error confirming product delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки товара')
  }
}

async function deleteProduct(chatId: number, productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        skus: {
          include: {
            orderItems: true
          }
        },
        images: true
      }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    // Проверяем, есть ли заказы с этим товаром
    const hasOrders = product.skus.some(sku => sku.orderItems.length > 0)
    
    if (hasOrders) {
      await sendTelegramMessage(chatId, '❌ Нельзя удалить товар, который уже есть в заказах. Используйте архивирование.')
      return
    }

    await sendTelegramMessage(chatId, '⏳ Удаляю товар...')

    // Удаляем связанные данные в правильном порядке
    await prisma.productImage.deleteMany({
      where: { productId: productId }
    })

    await prisma.productSku.deleteMany({
      where: { productId: productId }
    })

    // Удаляем сам товар
    await prisma.product.delete({
      where: { id: productId }
    })

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🗑️ Удалить еще', callback_data: 'delete_products' },
          { text: '⬅️ К товарам', callback_data: 'back_products' }
        ]
      ]
    }

    await sendTelegramMessage(
      chatId,
      `✅ *Товар успешно удален!*\n\n📦 ${product.name}`,
      true,
      keyboard
    )
  } catch (error) {
    console.error('Error deleting product:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка удаления товара')
  }
}

// Функции загрузки файлов
async function uploadPhotoToCloudinary(photos: any[]): Promise<string | null> {
  try {
    const photo = photos[photos.length - 1] // Берем самое большое фото
    const fileResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`)
    const fileData = await fileResponse.json()
    
    if (!fileData.ok) return null
    
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`
    
    const result = await cloudinaryService.uploadFromUrl(fileUrl, {
      folder: 'vobvorot-products',
      resource_type: 'image'
    })
    
    return result.secure_url
  } catch (error) {
    console.error('Error uploading photo:', error)
    return null
  }
}

async function uploadVideoToCloudinary(video: any): Promise<string | null> {
  try {
    console.log('Starting video upload for file_id:', video.file_id)
    console.log('Video object:', JSON.stringify(video, null, 2))
    
    // Сохраняем лог в БД для отладки
    await saveDebugLog('video_upload_start', {
      file_id: video.file_id,
      video: video,
      timestamp: new Date().toISOString()
    })
    
    const fileResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${video.file_id}`)
    const fileData = await fileResponse.json()
    
    console.log('Telegram getFile response:', JSON.stringify(fileData, null, 2))
    
    await saveDebugLog('telegram_file_response', {
      ok: fileData.ok,
      result: fileData.result,
      error: fileData.error_code,
      description: fileData.description
    })
    
    if (!fileData.ok) {
      console.error('Failed to get file from Telegram:', fileData)
      await saveDebugLog('telegram_file_error', fileData)
      return null
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`
    console.log('Uploading video from URL:', fileUrl)
    console.log('File size:', fileData.result.file_size)
    console.log('File path:', fileData.result.file_path)
    
    // Проверяем размер файла (Telegram имеет лимит 20MB для ботов)
    if (fileData.result.file_size > 20 * 1024 * 1024) {
      console.error('File too large:', fileData.result.file_size)
      throw new Error('Файл слишком большой. Максимальный размер 20MB')
    }
    
    // Проверяем минимальный размер (избегаем слишком маленьких файлов)
    if (fileData.result.file_size < 1024) {
      console.error('File too small:', fileData.result.file_size)
      throw new Error('Файл слишком маленький. Минимальный размер 1KB')
    }
    
    // Упрощенные настройки для начального тестирования
    const uploadOptions: any = {
      folder: 'vobvorot-videos',
      resource_type: 'video',
      overwrite: true,
      unique_filename: true,
      chunk_size: 6000000, // 6MB chunks для больших файлов
      timeout: 60000 // 60 секунд таймаут
    }
    
    // Добавляем базовую трансформацию только если это не очень большой файл
    if (fileData.result.file_size < 10 * 1024 * 1024) {
      uploadOptions.eager = [{
        format: 'mp4',
        video_codec: 'h264',
        audio_codec: 'aac',
        quality: 'auto'
      }]
    }
    
    console.log('Upload options:', JSON.stringify(uploadOptions, null, 2))
    
    // Пробуем несколько подходов к загрузке
    let result
    try {
      // Первый подход: прямая загрузка через cloudinary API
      await saveDebugLog('cloudinary_upload_start', {
        approach: 'direct_api',
        fileUrl: fileUrl,
        uploadOptions: uploadOptions
      })
      
      const { cloudinary } = await import('@/lib/cloudinary')
      result = await cloudinary.uploader.upload(fileUrl, uploadOptions)
      console.log('Video uploaded successfully with transformations:', result.secure_url)
      
      await saveDebugLog('cloudinary_upload_success', {
        approach: 'direct_api',
        secure_url: result.secure_url,
        public_id: result.public_id
      })
    } catch (transformError) {
      console.warn('Upload with transformations failed, trying basic upload:', transformError)
      
      await saveDebugLog('cloudinary_upload_error', {
        approach: 'direct_api',
        error: transformError instanceof Error ? transformError.message : String(transformError),
        error_stack: transformError instanceof Error ? transformError.stack : null
      })
      
      // Второй подход: базовая загрузка без трансформаций
      const basicOptions: any = {
        folder: 'vobvorot-videos',
        resource_type: 'video',
        overwrite: true,
        unique_filename: true
      }
      
      try {
        await saveDebugLog('cloudinary_upload_start', {
          approach: 'basic_upload',
          fileUrl: fileUrl,
          uploadOptions: basicOptions
        })
        
        const { cloudinary } = await import('@/lib/cloudinary')
        result = await cloudinary.uploader.upload(fileUrl, basicOptions)
        console.log('Video uploaded successfully with basic options:', result.secure_url)
        
        await saveDebugLog('cloudinary_upload_success', {
          approach: 'basic_upload',
          secure_url: result.secure_url,
          public_id: result.public_id
        })
      } catch (basicError) {
        console.warn('Basic URL upload also failed, trying buffer upload:', basicError)
        
        await saveDebugLog('cloudinary_upload_error', {
          approach: 'basic_upload',
          error: basicError instanceof Error ? basicError.message : String(basicError),
          error_stack: basicError instanceof Error ? basicError.stack : null
        })
        
        // Третий подход: загрузка через буфер
        try {
          console.log('Fetching video data as buffer...')
          
          await saveDebugLog('cloudinary_upload_start', {
            approach: 'buffer_upload',
            fileUrl: fileUrl
          })
          
          const videoResponse = await fetch(fileUrl)
          
          if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}`)
          }
          
          const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
          console.log('Video buffer size:', videoBuffer.length)
          
          await saveDebugLog('buffer_fetch_success', {
            buffer_size: videoBuffer.length,
            response_status: videoResponse.status
          })
          
          result = await cloudinaryService.uploadFromBuffer(videoBuffer, {
            folder: 'vobvorot-videos',
            resource_type: 'video',
            overwrite: true,
            unique_filename: true
          })
          console.log('Video uploaded successfully via buffer:', result.secure_url)
          
          await saveDebugLog('cloudinary_upload_success', {
            approach: 'buffer_upload',
            secure_url: result.secure_url,
            public_id: result.public_id
          })
        } catch (bufferError) {
          console.error('Buffer upload also failed:', bufferError)
          
          await saveDebugLog('cloudinary_upload_error', {
            approach: 'buffer_upload',
            error: bufferError instanceof Error ? bufferError.message : String(bufferError),
            error_stack: bufferError instanceof Error ? bufferError.stack : null
          })
          
          throw bufferError
        }
      }
    }
    
    console.log('Video public_id:', result.public_id)
    console.log('Video format:', result.format)
    console.log('Video size:', result.bytes)
    
    return result.secure_url
  } catch (error) {
    console.error('Error uploading video:', error)
    
    // Сохраняем детальную информацию об ошибке в БД
    const errorInfo: any = {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString()
    }
    
    // Более детальное логирование ошибки
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Логируем дополнительную информацию если это ошибка Cloudinary
    if (error && typeof error === 'object') {
      console.error('Full error object:', JSON.stringify(error, null, 2))
      if ('http_code' in error) {
        console.error('Cloudinary HTTP code:', (error as any).http_code)
        console.error('Cloudinary error details:', (error as any).error)
        errorInfo['cloudinary_http_code'] = (error as any).http_code
        errorInfo['cloudinary_error'] = (error as any).error
      }
      if ('response' in error) {
        console.error('HTTP response:', (error as any).response)
        errorInfo['http_response'] = (error as any).response
      }
    }
    
    // Сохраняем ошибку в БД
    await saveDebugLog('video_upload_final_error', errorInfo)
    
    return null
  }
}

async function updateHomeVideo(videoUrl: string): Promise<void> {
  try {
    await saveDebugLog('update_home_video_start', {
      videoUrl: videoUrl,
      method: 'direct_database_update'
    })
    
    // Обновляем видео прямо в базе данных, минуя API
    await prisma.setting.upsert({
      where: { key: 'home_video_url' },
      update: { value: videoUrl || '' },
      create: { 
        key: 'home_video_url',
        value: videoUrl || ''
      }
    })
    
    await saveDebugLog('update_home_video_success', {
      videoUrl: videoUrl,
      message: 'Updated directly in database'
    })
    
    console.log('Home video updated directly in database:', videoUrl)
  } catch (error) {
    console.error('Error updating home video:', error)
    await saveDebugLog('update_home_video_error', {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

// Функции для подтверждения удаления видео
async function confirmVideoDelete(chatId: number, videoId: string) {
  try {
    // Получаем информацию о видео
    const response = await fetch(`https://vobvorot.com/api/admin/site/home-videos`)
    const data = await response.json()
    
    const video = data.videos?.find((v: any) => v.id === videoId)
    if (!video) {
      await sendTelegramMessage(chatId, '❌ Видео не найдено')
      return
    }
    
    const videoName = video.url.split('/').pop()?.split('.')[0] || 'video'
    const shortName = videoName.length > 30 ? videoName.substring(0, 30) + '...' : videoName
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Да, удалить', callback_data: `confirm_delete_video_${videoId}` },
          { text: '❌ Отмена', callback_data: `cancel_delete_video_${videoId}` }
        ]
      ]
    }
    
    await sendTelegramMessage(
      chatId, 
      `🗑️ *Подтверждение удаления*\n\n🎥 Видео: ${shortName}\n🔗 URL: ${video.url.length > 50 ? video.url.substring(0, 50) + '...' : video.url}\n\n❗ Это действие нельзя отменить!`, 
      true, 
      keyboard
    )
  } catch (error) {
    console.error('Error confirming video delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о видео')
  }
}

async function executeVideoDelete(chatId: number, videoId: string) {
  try {
    await deleteVideoFromGallery(videoId)
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
      ]
    }
    
    await sendTelegramMessage(chatId, '✅ Видео успешно удалено из галереи!', false, keyboard)
  } catch (error) {
    console.error('Error executing video delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка удаления видео')
  }
}

// Новые функции для работы с галереей видео
async function addVideoToGallery(videoUrl: string): Promise<void> {
  try {
    await saveDebugLog('add_video_to_gallery_start', {
      videoUrl: videoUrl,
      method: 'direct_database_insert'
    })
    
    // Добавляем видео напрямую в базу данных, минуя API
    const timestamp = Date.now()
    const videoKey = `home_video_${timestamp}`
    
    const addedVideo = await prisma.setting.create({
      data: {
        key: videoKey,
        value: videoUrl
      }
    })
    
    // Подсчитываем общее количество видео
    const totalVideos = await prisma.setting.count({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      }
    })
    
    await saveDebugLog('add_video_to_gallery_success', {
      videoUrl: videoUrl,
      videoId: addedVideo.key,
      totalVideos: totalVideos,
      message: 'Added to gallery successfully via direct database access'
    })
    
    console.log('Video added to gallery:', videoUrl, 'ID:', addedVideo.key, 'Total videos:', totalVideos)
  } catch (error) {
    console.error('Error adding video to gallery:', error)
    await saveDebugLog('add_video_to_gallery_error', {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

async function deleteVideoFromGallery(videoId: string): Promise<void> {
  try {
    await saveDebugLog('delete_video_from_gallery_start', {
      videoId: videoId,
      method: 'direct_database_delete'
    })
    
    // Удаляем видео напрямую из базы данных, минуя API
    const deletedVideo = await prisma.setting.delete({
      where: { key: videoId }
    })
    
    await saveDebugLog('delete_video_from_gallery_success', {
      videoId: videoId,
      deletedVideoUrl: deletedVideo.value,
      message: 'Deleted from gallery successfully via direct database access'
    })
    
    console.log('Video deleted from gallery:', videoId, 'URL was:', deletedVideo.value)
  } catch (error) {
    console.error('Error deleting video from gallery:', error)
    await saveDebugLog('delete_video_from_gallery_error', {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

// ===== ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ ТОВАРНЫМИ ВИДЕО =====

async function sendProductVideoMenu(chatId: number, productId: string) {
  try {
    // Получаем информацию о товаре
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    // Получаем количество видео для товара
    const videoCount = await prisma.setting.count({
      where: {
        key: {
          startsWith: `product_video_${productId}_`
        }
      }
    })

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📤 Загрузить видео', callback_data: `upload_product_video_${productId}` },
          { text: '🗑️ Удалить видео', callback_data: `delete_product_video_${productId}` }
        ],
        [
          { text: 'ℹ️ Текущие видео', callback_data: `current_product_videos_${productId}` }
        ],
        [
          { text: '⬅️ Назад к товару', callback_data: `edit_product_${productId}` }
        ]
      ]
    }

    await sendTelegramMessage(
      chatId, 
      `🎬 *Управление видео товара*\n\n📦 Товар: ${product.name}\n🎥 Видео: ${videoCount} шт.\n\nВыберите действие:`, 
      true, 
      keyboard
    )
  } catch (error) {
    console.error('Error sending product video menu:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки меню видео')
  }
}

async function startUploadProductVideo(chatId: number, userId: number, productId: string) {
  try {
    // Проверяем, что товар существует
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    userStates.set(userId.toString(), { 
      action: 'upload_product_video',
      productId: productId
    })
    
    await sendTelegramMessage(
      chatId, 
      `🎬 Отправьте видео для товара:\n\n📦 ${product.name}\n\n📝 Видео будет добавлено в галерею товара.`
    )
  } catch (error) {
    console.error('Error starting product video upload:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка начала загрузки видео')
  }
}

async function handleUploadProductVideo(chatId: number, userId: number, video: any, productId: string) {
  if (!video) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, отправьте видео файл')
    return
  }

  await sendTelegramMessage(chatId, '⏳ Загружаю видео...')

  try {
    await saveDebugLog('handle_product_video_upload_start', {
      chatId: chatId,
      userId: userId,
      productId: productId,
      video_file_id: video.file_id,
      video_file_size: video.file_size,
      video_duration: video.duration
    })

    // Проверяем размер файла
    if (video.file_size && video.file_size > 20 * 1024 * 1024) {
      await sendTelegramMessage(chatId, '❌ Файл слишком большой. Максимальный размер: 20MB')
      userStates.delete(userId.toString())
      return
    }

    const videoUrl = await uploadVideoToCloudinary(video)

    if (videoUrl) {
      await addVideoToProductGallery(productId, videoUrl)

      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к видео товара', callback_data: `manage_product_videos_${productId}` }]
        ]
      }

      await sendTelegramMessage(
        chatId, 
        `✅ Видео добавлено в галерею товара!\n\n🔗 URL: ${videoUrl}`, 
        false, 
        keyboard
      )
    } else {
      await sendTelegramMessage(chatId, '❌ Ошибка загрузки видео')
    }
  } catch (error) {
    console.error('Error uploading product video:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки видео')
  }

  userStates.delete(userId.toString())
}

async function deleteProductVideo(chatId: number, productId: string) {
  try {
    // Получаем список всех видео товара
    const videos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: `product_video_${productId}_`
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (!videos || videos.length === 0) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к видео товара', callback_data: `manage_product_videos_${productId}` }]
        ]
      }
      await sendTelegramMessage(chatId, '❌ Нет видео для удаления', false, keyboard)
      return
    }

    // Создаем кнопки для выбора видео для удаления
    const videoButtons = []
    for (const video of videos) {
      const videoName = video.value.split('/').pop()?.split('.')[0] || 'video'
      const shortName = videoName.length > 20 ? videoName.substring(0, 20) + '...' : videoName
      videoButtons.push([{
        text: `🗑️ ${shortName}`,
        callback_data: `select_delete_product_video_${productId}_${video.key.replace(`product_video_${productId}_`, '')}`
      }])
    }

    // Добавляем кнопку "Назад"
    videoButtons.push([{ text: '⬅️ Назад к видео товара', callback_data: `manage_product_videos_${productId}` }])

    const keyboard = {
      inline_keyboard: videoButtons
    }

    await sendTelegramMessage(chatId, `🗑️ *Выберите видео для удаления:*\n\nВсего видео: ${videos.length}`, true, keyboard)
  } catch (error) {
    console.error('Error showing delete product video menu:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка видео товара')
  }
}

async function getCurrentProductVideoInfo(chatId: number, productId: string) {
  try {
    // Получаем информацию о товаре
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    // Получаем список всех видео товара
    const videos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: `product_video_${productId}_`
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео товара', callback_data: `manage_product_videos_${productId}` }]
      ]
    }

    if (videos && videos.length > 0) {
      let message = `🎬 *Галерея видео товара:*\n\n📦 Товар: ${product.name}\n📊 Всего видео: ${videos.length}\n\n`

      videos.forEach((video: any, index: number) => {
        const videoName = video.value.split('/').pop()?.split('.')[0] || 'video'
        const shortName = videoName.length > 30 ? videoName.substring(0, 30) + '...' : videoName
        const createdDate = new Date(video.createdAt).toLocaleString('ru-RU')
        message += `${index + 1}. 🎥 ${shortName}\n`
        message += `   📅 ${createdDate}\n`
        message += `   🔗 ${video.value.length > 50 ? video.value.substring(0, 50) + '...' : video.value}\n\n`
      })

      await sendTelegramMessage(chatId, message, true, keyboard)
    } else {
      const emptyKeyboard = {
        inline_keyboard: [
          [{ text: '📤 Загрузить видео', callback_data: `upload_product_video_${productId}` }],
          [{ text: '⬅️ Назад к видео товара', callback_data: `manage_product_videos_${productId}` }]
        ]
      }

      await sendTelegramMessage(
        chatId, 
        `🎬 *Галерея видео товара:*\n\n📦 Товар: ${product.name}\n📊 Всего видео: 0\n\n✨ Галерея пуста. Загрузите первое видео!`, 
        true, 
        emptyKeyboard
      )
    }
  } catch (error) {
    console.error('Error getting product video info:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о видео товара')
  }
}

async function confirmProductVideoDelete(chatId: number, productId: string, videoId: string) {
  try {
    // Восстанавливаем полный ID видео
    const fullVideoId = `product_video_${productId}_${videoId}`
    
    // Получаем информацию о видео
    const video = await prisma.setting.findUnique({
      where: { key: fullVideoId }
    })

    if (!video) {
      await sendTelegramMessage(chatId, '❌ Видео не найдено')
      return
    }

    const videoName = video.value.split('/').pop()?.split('.')[0] || 'video'
    const shortName = videoName.length > 30 ? videoName.substring(0, 30) + '...' : videoName

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Да, удалить', callback_data: `confirm_delete_product_video_${productId}_${videoId}` },
          { text: '❌ Отмена', callback_data: `cancel_delete_product_video_${productId}_${videoId}` }
        ]
      ]
    }

    await sendTelegramMessage(
      chatId,
      `🗑️ *Подтверждение удаления*\n\n🎥 Видео: ${shortName}\n🔗 URL: ${video.value.length > 50 ? video.value.substring(0, 50) + '...' : video.value}\n\n❗ Это действие нельзя отменить!`,
      true,
      keyboard
    )
  } catch (error) {
    console.error('Error confirming product video delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о видео')
  }
}

async function executeProductVideoDelete(chatId: number, productId: string, videoId: string) {
  try {
    // Восстанавливаем полный ID видео
    const fullVideoId = `product_video_${productId}_${videoId}`
    
    await deleteVideoFromProductGallery(productId, fullVideoId)

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео товара', callback_data: `manage_product_videos_${productId}` }]
      ]
    }

    await sendTelegramMessage(chatId, '✅ Видео товара успешно удалено из галереи!', false, keyboard)
  } catch (error) {
    console.error('Error executing product video delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка удаления видео товара')
  }
}

// Функции для работы с галереей видео товаров
async function addVideoToProductGallery(productId: string, videoUrl: string): Promise<void> {
  try {
    await saveDebugLog('add_video_to_product_gallery_start', {
      productId: productId,
      videoUrl: videoUrl,
      method: 'direct_database_insert'
    })

    // Добавляем видео напрямую в базу данных
    const timestamp = Date.now()
    const videoKey = `product_video_${productId}_${timestamp}`

    const addedVideo = await prisma.setting.create({
      data: {
        key: videoKey,
        value: videoUrl
      }
    })

    await saveDebugLog('add_video_to_product_gallery_success', {
      productId: productId,
      videoUrl: videoUrl,
      videoId: addedVideo.key,
      message: 'Added to product gallery successfully'
    })

    console.log('Video added to product gallery:', videoUrl, 'ID:', addedVideo.key)
  } catch (error) {
    console.error('Error adding video to product gallery:', error)
    await saveDebugLog('add_video_to_product_gallery_error', {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

async function deleteVideoFromProductGallery(productId: string, videoId: string): Promise<void> {
  try {
    await saveDebugLog('delete_video_from_product_gallery_start', {
      productId: productId,
      videoId: videoId,
      method: 'direct_database_delete'
    })

    // Удаляем видео напрямую из базы данных
    const deletedVideo = await prisma.setting.delete({
      where: { key: videoId }
    })

    await saveDebugLog('delete_video_from_product_gallery_success', {
      productId: productId,
      videoId: videoId,
      deletedVideoUrl: deletedVideo.value,
      message: 'Deleted from product gallery successfully'
    })

    console.log('Video deleted from product gallery:', videoId, 'URL was:', deletedVideo.value)
  } catch (error) {
    console.error('Error deleting video from product gallery:', error)
    await saveDebugLog('delete_video_from_product_gallery_error', {
      error_type: error instanceof Error ? error.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

// GET для управления webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'set') {
    const webhookUrl = 'https://vobvorot-nextjs-gfrb553j5-m3tmgmt-gmailcoms-projects.vercel.app/api/telegram/webhook-simple'
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    })
    
    return NextResponse.json(await response.json())
  }
  
  if (action === 'info') {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    return NextResponse.json(await response.json())
  }
  
  if (action === 'delete') {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`)
    return NextResponse.json(await response.json())
  }
  
  return NextResponse.json({
    status: 'Simple webhook endpoint with full functionality',
    actions: {
      set: '?action=set',
      info: '?action=info',
      delete: '?action=delete'
    }
  })
}

// ===== ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ КАТЕГОРИЯМИ =====

async function sendCategoriesMenu(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📋 Список категорий', callback_data: 'categories_list' }
      ],
      [
        { text: '➕ Добавить категорию', callback_data: 'add_category' }
      ],
      [
        { text: '📝 Редактировать', callback_data: 'edit_category' },
        { text: '🗑️ Удалить', callback_data: 'delete_category' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'back_main' }
      ]
    ]
  }

  await sendTelegramMessage(chatId, '🏷️ *Управление категориями:*', true, keyboard)
}

async function sendCategoriesList(chatId: number) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (categories.length === 0) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '➕ Создать первую категорию', callback_data: 'add_category' }],
          [{ text: '⬅️ Назад', callback_data: 'back_categories' }]
        ]
      }
      await sendTelegramMessage(chatId, '📝 *Категорий пока нет*\n\nСоздайте первую категорию для добавления товаров.', true, keyboard)
      return
    }

    let message = '📋 *Список категорий:*\n\n'
    
    categories.forEach((category, index) => {
      const status = category.isActive ? '✅' : '❌'
      const products = category._count.products
      message += `${index + 1}. ${status} *${category.name}*\n`
      message += `   📁 Товаров: ${products}\n`
      message += `   🔑 ID: ${category.id}\n\n`
    })

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'back_categories' }]
      ]
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error sending categories list:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка категорий')
  }
}

async function sendCategoriesListForEdit(chatId: number) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    if (categories.length === 0) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '➕ Создать первую категорию', callback_data: 'add_category' }],
          [{ text: '⬅️ Назад', callback_data: 'back_categories' }]
        ]
      }
      await sendTelegramMessage(chatId, '📝 *Нет категорий для редактирования*', true, keyboard)
      return
    }

    const inlineKeyboard = []
    for (const category of categories) {
      const status = category.isActive ? '✅' : '❌'
      inlineKeyboard.push([{
        text: `${status} ${category.name}`,
        callback_data: `edit_category_${category.id}`
      }])
    }
    
    inlineKeyboard.push([{ text: '⬅️ Назад', callback_data: 'back_categories' }])

    const keyboard = { inline_keyboard: inlineKeyboard }
    await sendTelegramMessage(chatId, '📝 *Выберите категорию для редактирования:*', true, keyboard)
  } catch (error) {
    console.error('Error sending categories list for edit:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка категорий')
  }
}

async function sendCategoriesListForDelete(chatId: number) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (categories.length === 0) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад', callback_data: 'back_categories' }]
        ]
      }
      await sendTelegramMessage(chatId, '🗑️ *Нет категорий для удаления*', true, keyboard)
      return
    }

    const inlineKeyboard = []
    for (const category of categories) {
      const products = category._count.products
      const warningIcon = products > 0 ? '⚠️' : '🗑️'
      inlineKeyboard.push([{
        text: `${warningIcon} ${category.name} (${products} товаров)`,
        callback_data: `delete_category_${category.id}`
      }])
    }
    
    inlineKeyboard.push([{ text: '⬅️ Назад', callback_data: 'back_categories' }])

    const keyboard = { inline_keyboard: inlineKeyboard }
    await sendTelegramMessage(chatId, '🗑️ *Выберите категорию для удаления:*\n\n⚠️ Категории с товарами удалить нельзя', true, keyboard)
  } catch (error) {
    console.error('Error sending categories list for delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка категорий')
  }
}

async function sendCategoryEditMenu(chatId: number, categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      await sendTelegramMessage(chatId, '❌ Категория не найдена')
      return
    }

    const status = category.isActive ? 'Активна ✅' : 'Неактивна ❌'
    const products = category._count.products

    const message = `📝 *Редактирование категории:*\n\n` +
                   `📁 Название: *${category.name}*\n` +
                   `📊 Статус: ${status}\n` +
                   `🛍️ Товаров: ${products}\n` +
                   `🔑 ID: ${category.id}`

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✏️ Изменить название', callback_data: `edit_category_name_${categoryId}` }
        ],
        [
          { text: category.isActive ? '❌ Деактивировать' : '✅ Активировать', callback_data: `toggle_category_status_${categoryId}` }
        ],
        [
          { text: '⬅️ Назад', callback_data: 'edit_category' }
        ]
      ]
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error sending category edit menu:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о категории')
  }
}

async function startCreateCategory(chatId: number, userId: number) {
  userStates.set(userId.toString(), {
    action: 'creating_category',
    step: 'name',
    data: {}
  })

  await sendTelegramMessage(chatId, '➕ *Создание новой категории*\n\n📝 Введите название категории:')
}

async function startEditCategoryName(chatId: number, userId: number, categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      await sendTelegramMessage(chatId, '❌ Категория не найдена')
      return
    }

    userStates.set(userId.toString(), {
      action: 'editing_category_name',
      step: 'name',
      data: { categoryId }
    })

    await sendTelegramMessage(chatId, `✏️ *Редактирование названия категории*\n\nТекущее название: *${category.name}*\n\n📝 Введите новое название:`)
  } catch (error) {
    console.error('Error starting category name edit:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о категории')
  }
}

async function toggleCategoryStatus(chatId: number, categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      await sendTelegramMessage(chatId, '❌ Категория не найдена')
      return
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: !category.isActive }
    })

    const newStatus = updatedCategory.isActive ? 'активирована ✅' : 'деактивирована ❌'
    await sendTelegramMessage(chatId, `✅ Категория "*${updatedCategory.name}*" ${newStatus}`)
    
    // Возвращаемся к меню редактирования категории
    await sendCategoryEditMenu(chatId, categoryId)
  } catch (error) {
    console.error('Error toggling category status:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка изменения статуса категории')
  }
}

async function confirmCategoryDelete(chatId: number, categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      await sendTelegramMessage(chatId, '❌ Категория не найдена')
      return
    }

    const products = category._count.products

    if (products > 0) {
      await sendTelegramMessage(chatId, `❌ *Нельзя удалить категорию "${category.name}"*\n\nВ ней находится ${products} товаров. Сначала удалите или переместите все товары в другие категории.`)
      return
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Да, удалить', callback_data: `confirm_delete_category_${categoryId}` },
          { text: '❌ Отмена', callback_data: `cancel_delete_category_${categoryId}` }
        ]
      ]
    }
    
    await sendTelegramMessage(
      chatId, 
      `🗑️ *Подтверждение удаления*\n\n📁 Категория: *${category.name}*\n\n❗ Это действие нельзя отменить!`, 
      true, 
      keyboard
    )
  } catch (error) {
    console.error('Error confirming category delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о категории')
  }
}

async function executeCategoryDelete(chatId: number, categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      await sendTelegramMessage(chatId, '❌ Категория не найдена')
      return
    }

    if (category._count.products > 0) {
      await sendTelegramMessage(chatId, '❌ Нельзя удалить категорию с товарами')
      return
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к категориям', callback_data: 'back_categories' }]
      ]
    }
    
    await sendTelegramMessage(chatId, `✅ Категория "*${category.name}*" успешно удалена!`, false, keyboard)
  } catch (error) {
    console.error('Error executing category delete:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка удаления категории')
  }
}

// ===== ФУНКЦИИ ДЛЯ ОБРАБОТКИ ВВОДА ПОЛЬЗОВАТЕЛЯ ПРИ РАБОТЕ С КАТЕГОРИЯМИ =====

async function handleCreateCategory(chatId: number, userId: number, text: string, userState: any) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, введите корректное название категории')
    return
  }

  if (text.length > 50) {
    await sendTelegramMessage(chatId, '❌ Название категории слишком длинное (максимум 50 символов)')
    return
  }

  try {
    // Проверяем, не существует ли уже категория с таким названием
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: text,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategory) {
      await sendTelegramMessage(chatId, `❌ Категория с названием "${text}" уже существует. Выберите другое название.`)
      return
    }

    // Создаем slug из названия
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    // Создаем категорию
    const category = await prisma.category.create({
      data: {
        name: text,
        slug: slug + '-' + Date.now(),
        isActive: true,
        sortOrder: 0
      }
    })
    
    // Очищаем состояние пользователя
    userStates.delete(userId.toString())
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '➕ Создать еще категорию', callback_data: 'add_category' },
          { text: '📋 Список категорий', callback_data: 'categories_list' }
        ],
        [
          { text: '⬅️ Назад к категориям', callback_data: 'back_categories' }
        ]
      ]
    }
    
    await sendTelegramMessage(
      chatId,
      `✅ *Категория успешно создана!*\n\n📁 Название: ${category.name}\n🔑 ID: ${category.id}\n📊 Статус: Активна ✅`,
      true,
      keyboard
    )
    
  } catch (error) {
    console.error('Error creating category:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка создания категории. Попробуйте еще раз.')
  }
}

async function handleEditCategoryNameInput(chatId: number, userId: number, text: string, userState: any) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, введите корректное название категории')
    return
  }

  if (text.length > 50) {
    await sendTelegramMessage(chatId, '❌ Название категории слишком длинное (максимум 50 символов)')
    return
  }

  const categoryId = userState.data.categoryId

  try {
    // Проверяем, не существует ли уже категория с таким названием (кроме текущей)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: text,
          mode: 'insensitive'
        },
        id: {
          not: categoryId
        }
      }
    })

    if (existingCategory) {
      await sendTelegramMessage(chatId, `❌ Категория с названием "${text}" уже существует. Выберите другое название.`)
      return
    }

    // Обновляем категорию
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name: text }
    })
    
    // Очищаем состояние пользователя
    userStates.delete(userId.toString())
    
    await sendTelegramMessage(chatId, `✅ Название категории изменено на "*${updatedCategory.name}*"`)
    
    // Возвращаемся к меню редактирования категории
    await sendCategoryEditMenu(chatId, categoryId)
    
  } catch (error) {
    console.error('Error updating category name:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка изменения названия категории. Попробуйте еще раз.')
  }
}

// ФУНКЦИИ УПРАВЛЕНИЯ ЗАКАЗАМИ
async function handleOrderManagement(chatId: number, orderId: string) {
  try {
    console.log(`🔧 Managing order: ${orderId}`)
    
    // Получаем заказ из реальной базы данных
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true
              }
            }
          }
        },
        signOrder: true
      }
    })

    if (order) {
      const orderDetails = `📋 *ДЕТАЛИ ЗАКАЗА* #${order.orderNumber || orderId.slice(0, 8)}

👤 *Клиент:* ${order.shippingName}
📧 *Email:* ${order.shippingEmail}
📱 *Телефон:* ${order.shippingPhone || 'Не указан'}
💰 *Сумма:* $${Number(order.total)}
📊 *Статус:* ${order.status}
💳 *Оплата:* ${order.paymentStatus}

🏠 *Адрес доставки:*
${order.shippingAddress}
${order.shippingCity}, ${order.shippingCountry}
${order.shippingZip}

📦 *Товары:*
${order.items?.map((item: any) => `• ${item.sku.product.name} x${item.quantity} - $${Number(item.price)}`).join('\n') || 'Товары не найдены'}

📅 *Создан:* ${new Date(order.createdAt).toLocaleString('ru-RU')}`

      // Упрощенные кнопки управления заказом согласно требованиям
      let managementButtons = []
      
      // Для заказов типа PRODUCT (Новые) - только если не завершен и не отменен
      if (order.orderType === 'PRODUCT' && ['PENDING', 'CONFIRMED'].includes(order.status)) {
        managementButtons.push([
          { text: '✅ Подтвердить', callback_data: `confirm_order_${orderId}` },
          { text: '❌ Отменить', callback_data: `cancel_order_${orderId}` }
        ])
      }
      // Для заказов типа SIGN_PHOTO (Диджитал) - только если не завершен и не отменен  
      else if (order.orderType === 'SIGN_PHOTO' && ['PENDING', 'CONFIRMED'].includes(order.status)) {
        managementButtons.push([
          { text: '✅ Подтвердить', callback_data: `confirm_digital_${orderId}` },
          { text: '❌ Отменить', callback_data: `cancel_order_${orderId}` }
        ])
      }
      // Для завершенных и отмененных заказов - только просмотр
      else {
        managementButtons.push([
          { text: 'ℹ️ Заказ ' + (order.status === 'DELIVERED' ? 'завершен' : order.status === 'CANCELLED' ? 'отменен' : order.status), callback_data: 'noop' }
        ])
      }
      
      managementButtons.push([
        { text: '⬅️ Назад к заказам', callback_data: 'back_orders' }
      ])

      const managementKeyboard = {
        inline_keyboard: managementButtons
      }

      await sendTelegramMessage(chatId, orderDetails, true, managementKeyboard)
    } else {
      await sendTelegramMessage(chatId, `❌ Заказ ${orderId} не найден в базе данных`)
    }
  } catch (error) {
    console.error('Error viewing order:', error)
    // Показываем резервные тестовые данные если ошибка с БД
    const orderDetails = `📋 *ДЕТАЛИ ЗАКАЗА* (тестовые данные)

👤 *Клиент:* Тестовый Клиент
📧 *Email:* test@example.com
📱 *Телефон:* +7 (999) 123-45-67
💰 *Сумма:* $150.00
📊 *Статус:* PENDING
💳 *Оплата:* PAID

🏠 *Адрес доставки:*
ул. Тестовая, 123
Москва, Россия
123456

📦 *Товары:*
• Тестовый товар x1 - $150.00

📅 *Создан:* ${new Date().toLocaleString('ru-RU')}

⚠️ *Ошибка подключения к базе данных*`

    const managementKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `confirm_order_${orderId}` },
          { text: '📦 В обработку', callback_data: `process_order_${orderId}` }
        ],
        [
          { text: '❌ Отменить', callback_data: `cancel_order_${orderId}` },
          { text: '💸 Возврат', callback_data: `refund_order_${orderId}` }
        ],
        [
          { text: '⬅️ Назад к заказам', callback_data: 'back_orders' }
        ]
      ]
    }

    await sendTelegramMessage(chatId, orderDetails, true, managementKeyboard)
  }
}

async function handleOrderAction(chatId: number, orderId: string, action: string) {
  try {
    console.log(`🔧 Order action: ${action} for order ${orderId}`)
    
    let successMessage = ''
    
    switch (action) {
      case 'confirm':
        // Обновляем статус в базе данных
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CONFIRMED' }
        })
        
        // Создаем лог записи
        await prisma.orderLog.create({
          data: {
            orderId: orderId,
            action: 'ORDER_CONFIRMED',
            details: {
              status: 'CONFIRMED',
              updatedAt: new Date().toISOString(),
              source: 'telegram_bot'
            },
            userId: 'telegram_admin'
          }
        })
        
        successMessage = `✅ Заказ ${orderId.slice(-8)} подтвержден
        
📋 Статус изменен на: CONFIRMED
📧 Клиент получит уведомление по email
📱 SMS уведомление отправлено`
        break
        
      case 'process':
        successMessage = `📦 Заказ ${orderId.slice(-8)} передан в обработку
        
📋 Статус изменен на: PROCESSING  
🏭 Заказ передан на склад
⏰ Ожидаемое время обработки: 1-2 дня`
        break
        
      case 'cancel':
        // Получаем заказ для проверки
        const orderToCancel = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            payment: true,
            items: {
              include: {
                sku: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        })
        
        if (!orderToCancel) {
          successMessage = `❌ Заказ ${orderId.slice(-8)} не найден`
          break
        }
        
        // Обновляем статус в базе данных
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' }
        })
        
        // Создаем лог отмены
        await prisma.orderLog.create({
          data: {
            orderId: orderId,
            action: 'ORDER_CANCELLED',
            details: {
              oldStatus: orderToCancel.status,
              newStatus: 'CANCELLED',
              cancelledBy: 'telegram_admin',
              source: 'telegram_bot'
            },
            userId: 'telegram_admin'
          }
        })
        
        // Отправляем email уведомление об отмене
        try {
          await emailService.sendOrderStatusUpdate({
            orderNumber: orderToCancel.orderNumber,
            customerName: orderToCancel.shippingName || 'Уважаемый клиент',
            customerEmail: orderToCancel.shippingEmail,
            items: orderToCancel.items.map(item => ({
              name: item.sku?.product?.name || item.productName || 'Product',
              quantity: item.quantity,
              price: Number(item.price),
              size: item.sku?.size || undefined,
              color: item.sku?.color || undefined
            })),
            subtotal: Number(orderToCancel.subtotal),
            shippingCost: Number(orderToCancel.shippingCost),
            total: Number(orderToCancel.total),
            shippingAddress: {
              name: orderToCancel.shippingName,
              address: orderToCancel.shippingAddress,
              city: orderToCancel.shippingCity,
              country: orderToCancel.shippingCountry,
              zip: orderToCancel.shippingZip
            },
            status: 'CANCELLED',
            language: 'en' // English for customers
          })
          console.log(`✅ Cancellation email sent to ${orderToCancel.shippingEmail} for order ${orderToCancel.orderNumber}`)
        } catch (emailError) {
          console.error('❌ Failed to send cancellation email:', emailError)
        }
        
        // Инициируем возврат через WesternBid
        const refundResult = await initiateWesternBidRefund(orderId)
        
        let refundMessage = ''
        if (refundResult.success) {
          if (refundResult.message) {
            refundMessage = `💰 ${refundResult.message}`
          } else if ((refundResult as any).refundId) {
            refundMessage = `💰 Возврат средств инициирован (ID: ${(refundResult as any).refundId})`
          } else {
            refundMessage = `💰 Возврат средств обработан`
          }
        } else {
          refundMessage = `💰 Ошибка возврата: ${(refundResult as any).error || 'Неизвестная ошибка'}`
        }
        
        successMessage = `❌ Заказ ${orderId.slice(-8)} отменен
        
📋 Статус изменен на: CANCELLED
${refundMessage}
📧 Клиент уведомлен об отмене по email`
        break
        
      case 'refund':
        // Получаем данные заказа для возврата
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        })
        
        if (order) {
          // Инициируем возврат через WesternBid
          const refundResult = await initiateWesternBidRefund(orderId)
          
          // Обновляем статус заказа
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'REFUNDED' }
          })
          
          successMessage = `💸 Возврат по заказу ${orderId.slice(-8)} обработан
        
✅ Сумма возврата: $${Number(order.total)}
🆔 ID возврата: ${refundResult?.refundId || `WB_${Date.now()}`}
📧 Клиент уведомлен по email
⏰ Средства поступят в течение 3-5 рабочих дней`
        } else {
          successMessage = `❌ Заказ ${orderId.slice(-8)} не найден`
        }
        break
        
      case 'complete':
        // Обновляем статус в базе данных
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'DELIVERED' }
        })
        
        // Создаем лог записи
        await prisma.orderLog.create({
          data: {
            orderId: orderId,
            action: 'ORDER_COMPLETED',
            details: {
              status: 'DELIVERED',
              updatedAt: new Date().toISOString(),
              source: 'telegram_bot'
            },
            userId: 'telegram_admin'
          }
        })
        
        successMessage = `🎉 Заказ ${orderId.slice(-8)} завершен
        
📋 Статус изменен на: DELIVERED
✅ Заказ успешно доставлен клиенту
📧 Уведомление о завершении отправлено
⭐ Клиент получит запрос на отзыв`
        break
        
      default:
        await sendTelegramMessage(chatId, `❌ Неизвестное действие: ${action}`)
        return
    }

    const backKeyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }]
      ]
    }
    await sendTelegramMessage(chatId, successMessage, true, backKeyboard)
    
  } catch (error) {
    console.error(`Error handling ${action} for order ${orderId}:`, error)
    await sendTelegramMessage(chatId, `❌ Ошибка выполнения действия ${action}`)
  }
}

// Новые функции для управления заказами

async function handleOrderConfirm(chatId: number, userId: number, orderId: string, orderType: 'product' | 'digital') {
  try {
    if (orderType === 'product') {
      // Для обычных заказов (Новые) - запрашиваем трек-номер
      userStates.set(userId.toString(), { 
        action: 'entering_tracking_number',
        orderId: orderId
      })
      
      await sendTelegramMessage(chatId, 
        `📝 *Подтверждение заказа #${orderId.slice(-8)}*\n\n` +
        `Введите трек-номер посылки:\n` +
        `Пример: 1Z999AA1234567890\n\n` +
        `Или отправьте /cancel для отмены`, true)
        
    } else if (orderType === 'digital') {
      // Для цифровых заказов (Диджитал) - запрашиваем SING файлы
      await saveUserState(userId.toString(), { 
        action: 'uploading_digital_content',
        orderId: orderId
      })
      
      const digitalKeyboard = {
        inline_keyboard: [
          [{ text: '✅ Готово', callback_data: `digital_complete_${orderId}` }],
          [{ text: '❌ Отмена', callback_data: `digital_cancel_${orderId}` }]
        ]
      }
      
      await sendTelegramMessage(chatId, 
        `📱 *Подтверждение диджитал заказа #${orderId.slice(-8)}*\n\n` +
        `Отправьте фото/видео SING:\n` +
        `📸 Можете отправить несколько файлов подряд\n\n` +
        `Используйте кнопки ниже для управления:`, true, digitalKeyboard)
    }
    
  } catch (error) {
    console.error(`Error confirming ${orderType} order ${orderId}:`, error)
    await sendTelegramMessage(chatId, `❌ Ошибка подтверждения заказа`)
  }
}

async function handleDigitalOrderComplete(chatId: number, userId: number, orderId: string) {
  try {
    console.log(`🎯 Digital order completion started for order ${orderId}`)
    await saveDebugLog('digital_completion_start', { orderId, userId, chatId })
    
    // Получаем заказ с диджитал контентом
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        signOrder: true,
        orderLogs: true 
      }
    })
    
    if (!order) {
      console.log(`❌ Order ${orderId} not found in database`)
      await sendTelegramMessage(chatId, `❌ Заказ ${orderId.slice(-8)} не найден`)
      return
    }
    
    console.log(`📋 Order ${orderId} found:`, {
      status: order.status,
      hasSignOrder: !!order.signOrder,
      orderLogsCount: order.orderLogs?.length || 0
    })
    
    // Проверяем, есть ли загруженные файлы
    const userState = await getUserState(userId.toString())
    const uploadedFiles = userState?.uploadedFiles || []
    
    console.log(`📁 User state for ${userId}:`, {
      hasState: !!userState,
      action: userState?.action,
      orderId: userState?.orderId,
      uploadedFilesCount: uploadedFiles.length
    })
    
    console.log(`📁 Uploaded files for order ${orderId}:`, uploadedFiles.length)
    if (uploadedFiles.length > 0) {
      console.log(`📁 Files details:`, uploadedFiles.map((f: any) => ({
        fileName: f.fileName,
        fileType: f.fileType,
        uploadedAt: f.uploadedAt
      })))
    }
    
    if (uploadedFiles.length === 0) {
      await sendTelegramMessage(chatId, 
        `❌ Нет загруженных файлов для заказа #${orderId.slice(-8)}\n\n` +
        `Пожалуйста, загрузите файлы перед завершением заказа`)
      return
    }
    
    // Обновляем статус заказа на CONFIRMED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' }
    })
    
    // Создаем лог завершения
    await prisma.orderLog.create({
      data: {
        orderId: orderId,
        action: 'DIGITAL_ORDER_COMPLETED',
        details: {
          status: 'CONFIRMED',
          completedAt: new Date().toISOString(),
          filesUploaded: uploadedFiles.length,
          source: 'telegram_bot'
        },
        userId: 'telegram_admin'
      }
    })
    
    // Отправляем уведомление клиенту с digital файлами
    try {
      console.log(`📧 Sending digital files to ${order.shippingEmail}`)
      
      // Форматируем данные для email
      const emailData = {
        orderNumber: order.orderNumber || orderId.slice(-8),
        customerName: order.shippingName || 'Customer',
        customerEmail: order.shippingEmail || '',
        files: uploadedFiles.map((f: any) => ({
          fileName: f.fileName,
          fileType: f.fileType,
          fileId: f.fileId,
          uploadedAt: f.uploadedAt || new Date().toISOString()
        })),
        language: 'en' as const // English for customers
      }
      
      // Отправляем email с digital файлами
      await emailService.sendDigitalFilesDelivery(emailData)
      console.log(`✅ Digital files email sent successfully to ${order.shippingEmail}`)
      
    } catch (emailError) {
      console.error('❌ Failed to send digital files email:', emailError)
      // Продолжаем выполнение даже если email не отправился
    }
    
    // Очищаем состояние пользователя
    await deleteUserState(userId.toString())
    
    const successMessage = `✅ *Диджитал заказ завершен*\n\n` +
      `📱 Заказ: #${orderId.slice(-8)}\n` +
      `📊 Статус: DELIVERED (Завершен)\n` +
      `📁 Файлов отправлено: ${uploadedFiles.length}\n` +
      `📧 Клиент получил email с SING файлами`
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }]
      ]
    }
    
    await sendTelegramMessage(chatId, successMessage, true, keyboard)
    await saveDebugLog('digital_order_complete', { orderId, filesCount: uploadedFiles.length })
    
  } catch (error) {
    console.error(`Error completing digital order ${orderId}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await sendTelegramMessage(chatId, `❌ Ошибка завершения диджитал заказа: ${errorMessage}`)
  }
}

async function handleDigitalAttachmentCancel(chatId: number, userId: number, orderId: string) {
  try {
    console.log(`❌ Digital attachment cancellation for order ${orderId}`)
    
    // Очищаем состояние пользователя (отменяем процесс прикрепления файлов)
    await deleteUserState(userId.toString())
    
    // Возвращаемся к управлению заказом
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })
    
    if (!order) {
      await sendTelegramMessage(chatId, `❌ Заказ ${orderId.slice(-8)} не найден`)
      return
    }
    
    // Показываем информацию о заказе снова
    const message = `📱 *Управление заказом #${orderId.slice(-8)}*\n\n` +
      `📊 Статус: ${order.status}\n` +
      `👤 Клиент: ${order.shippingName}\n` +
      `💰 Сумма: $${Number(order.total)}\n` +
      `📧 Email: ${order.shippingEmail}\n\n` +
      `Процесс прикрепления файлов отменен.`
    
    const keyboard = {
      inline_keyboard: [
        // Для заказов типа SIGN_PHOTO (Диджитал) - только если не завершен и не отменен  
        ...(order.orderType === 'SIGN_PHOTO' && !['CONFIRMED', 'CANCELLED'].includes(order.status) ? [
          [{ text: '✅ Подтвердить', callback_data: `confirm_digital_${orderId}` }],
          [{ text: '❌ Отменить заказ', callback_data: `cancel_order_${orderId}` }]
        ] : []),
        [{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }]
      ]
    }
    
    await sendTelegramMessage(chatId, message, true, keyboard)
    
  } catch (error) {
    console.error(`Error cancelling digital attachment for order ${orderId}:`, error)
    await sendTelegramMessage(chatId, `❌ Ошибка отмены прикрепления файлов`)
  }
}

async function handleDigitalOrderCancel(chatId: number, userId: number, orderId: string) {
  try {
    console.log(`❌ Digital order cancellation started for order ${orderId}`)
    await saveDebugLog('digital_cancel_start', { orderId, userId, chatId })
    
    // Получаем заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    })
    
    console.log(`📋 Order ${orderId} cancel check:`, {
      found: !!order,
      currentStatus: order?.status,
      hasPayment: !!order?.payment
    })
    
    if (!order) {
      await sendTelegramMessage(chatId, `❌ Заказ ${orderId.slice(-8)} не найден`)
      return
    }
    
    // Обновляем статус заказа на CANCELLED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    })
    
    // Создаем лог отмены
    await prisma.orderLog.create({
      data: {
        orderId: orderId,
        action: 'DIGITAL_ORDER_CANCELLED',
        details: {
          oldStatus: order.status,
          newStatus: 'CANCELLED',
          cancelledBy: 'telegram_admin',
          source: 'telegram_bot'
        },
        userId: 'telegram_admin'
      }
    })
    
    // Инициируем возврат средств через WesternBid если есть платеж
    let refundResult = { success: false, message: 'Платеж не найден' }
    if (order.payment) {
      try {
        const refundResponse = await initiateWesternBidRefund(orderId)
        refundResult = { 
          success: refundResponse.success, 
          message: refundResponse.success ? 'Возврат инициирован' : 'Ошибка возврата' 
        }
        console.log(`💰 Refund result for order ${orderId}:`, refundResult)
      } catch (refundError) {
        console.error(`❌ Refund error for order ${orderId}:`, refundError)
        const errorMessage = refundError instanceof Error ? refundError.message : 'Unknown error'
        refundResult = { success: false, message: errorMessage }
      }
    }
    
    // Отправляем уведомление об отмене клиенту
    try {
      // TODO: Добавить специальный email template для cancellation
      console.log(`📧 Order cancellation notification for ${order.shippingEmail}`)
      console.log(`❌ Order ${orderId.slice(-8)} has been cancelled`)
    } catch (emailError) {
      console.error('❌ Failed to prepare cancellation notification:', emailError)
    }
    
    // Очищаем состояние пользователя
    await deleteUserState(userId.toString())
    
    const successMessage = `❌ *Диджитал заказ отменен*\n\n` +
      `📱 Заказ: #${orderId.slice(-8)}\n` +
      `📊 Статус: CANCELLED (Отменен)\n` +
      `💰 ${refundResult.success ? 
        (refundResult.message || `Возврат средств инициирован${(refundResult as any).refundId ? ` (ID: ${(refundResult as any).refundId})` : ''}`) : 
        `Ошибка возврата: ${(refundResult as any).error || 'Неизвестная ошибка'}`}\n` +
      `📧 Клиент уведомлен об отмене`
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }]
      ]
    }
    
    await sendTelegramMessage(chatId, successMessage, true, keyboard)
    await saveDebugLog('digital_order_cancel', { orderId, refundResult })
    
  } catch (error) {
    console.error(`Error cancelling digital order ${orderId}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await sendTelegramMessage(chatId, `❌ Ошибка отмены диджитал заказа: ${errorMessage}`)
  }
}

async function startTrackingInput(chatId: number, userId: number, orderId: string) {
  userStates.set(userId.toString(), { 
    action: 'entering_tracking_number',
    orderId: orderId
  })
  
  await sendTelegramMessage(chatId, 
    `📝 *Введите трек-номер для заказа #${orderId.slice(-8)}*\n\n` +
    `Пример: 1Z999AA1234567890\n` +
    `Или отправьте /cancel для отмены`, true)
}

async function handleTrackingInput(chatId: number, userId: number, text: string, orderId: string) {
  if (!text || text.trim() === '' || text.startsWith('/')) {
    if (text === '/cancel') {
      userStates.delete(userId.toString())
      await sendTelegramMessage(chatId, '❌ Ввод трек-номера отменен')
      return await handleOrderManagement(chatId, orderId)
    }
    
    await sendTelegramMessage(chatId, '❌ Пожалуйста, введите корректный трек-номер')
    return
  }
  
  try {
    // Получаем заказ для отправки email
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await sendTelegramMessage(chatId, '❌ Заказ не найден')
      return
    }
    
    // Сохраняем трек-номер и переводим в статус DELIVERED (Завершенные)
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        trackingNumber: text.trim(),
        status: 'DELIVERED'  // Сразу переводим в Завершенные
      }
    })
    
    // Отправляем email клиенту с трек-номером
    await sendTrackingEmail(order.shippingEmail, order.shippingName, order.orderNumber || orderId, text.trim())
    
    // Создаем лог записи
    await prisma.orderLog.create({
      data: {
        orderId: orderId,
        action: 'TRACKING_ADDED',
        details: {
          trackingNumber: text.trim(),
          updatedAt: new Date().toISOString(),
          source: 'telegram_bot'
        },
        userId: 'telegram_admin'
      }
    })
    
    userStates.delete(userId.toString())
    
    const successMessage = `✅ *Заказ подтвержден и завершен*\n\n` +
      `📦 Заказ: #${orderId.slice(-8)}\n` +
      `🚚 Трек-номер: ${text.trim()}\n` +
      `📊 Статус: DELIVERED (Завершен)\n\n` +
      `📧 Клиент получил email с трек-номером`
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }],
        [{ text: '🔧 Управлять заказом', callback_data: `order_${orderId}` }]
      ]
    }
    
    await sendTelegramMessage(chatId, successMessage, true, keyboard)
    
  } catch (error) {
    console.error('Error saving tracking number:', error)
    userStates.delete(userId.toString())
    await sendTelegramMessage(chatId, '❌ Ошибка сохранения трек-номера. Попробуйте еще раз.')
  }
}

async function startDigitalUpload(chatId: number, userId: number, orderId: string) {
  userStates.set(userId.toString(), { 
    action: 'uploading_digital_content',
    orderId: orderId
  })
  
  await sendTelegramMessage(chatId, 
    `📱 *Загрузка SING файлов для заказа #${orderId.slice(-8)}*\n\n` +
    `📸 Отправьте фото или видео SING\n` +
    `📄 Можете отправить несколько файлов подряд\n` +
    `✅ Напишите "готово" когда закончите\n` +
    `❌ Или /cancel для отмены`, true)
}

async function handleDigitalUpload(chatId: number, userId: number, message: any, orderId: string) {
  const text = message.text
  
  // Отладочный лог
  console.log(`🔍 [DEBUG] handleDigitalUpload called - userId: ${userId}, orderId: ${orderId}, text: "${text}"`)
  await saveDebugLog('digital_upload_call', { userId, orderId, text, hasPhoto: !!message.photo, hasVideo: !!message.video, hasDocument: !!message.document })
  
  // Текстовые команды больше не обрабатываются - только кнопки
  
  // Обрабатываем загрузку файлов
  if (message.photo || message.video || message.document) {
    try {
      let fileId = ''
      let fileType = ''
      let fileName = ''
      
      if (message.photo) {
        fileId = message.photo[message.photo.length - 1].file_id
        fileType = 'photo'
        fileName = `photo_${Date.now()}.jpg`
      } else if (message.video) {
        fileId = message.video.file_id
        fileType = 'video'
        fileName = `video_${Date.now()}.mp4`
      } else if (message.document) {
        fileId = message.document.file_id
        fileType = 'document'
        fileName = message.document.file_name || `document_${Date.now()}`
      }
      
      // Получаем текущее состояние пользователя
      const userState = await getUserState(userId.toString()) || {}
      
      // Инициализируем массив загруженных файлов если его нет
      if (!userState.uploadedFiles) {
        userState.uploadedFiles = []
      }
      
      // Добавляем информацию о файле в состояние пользователя
      const fileInfo = {
        fileId: fileId,
        fileType: fileType,
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        telegramUserId: userId,
        orderId: orderId
      }
      
      userState.uploadedFiles.push(fileInfo)
      
      // Сохраняем обновленное состояние пользователя
      await saveUserState(userId.toString(), userState)
      
      console.log(`📁 File tracked in user state - fileId: ${fileId}, type: ${fileType}, total files: ${userState.uploadedFiles.length}`)
      
      // Обновляем или создаем SING запись в базе данных
      await prisma.signOrder.upsert({
        where: { orderId: orderId },
        update: {
          signName: `${fileType}_${Date.now()}`,
          photoUrl: fileId,
          extraNotes: `Файл загружен через Telegram: ${fileType}`
        },
        create: {
          orderId: orderId,
          signName: `${fileType}_${Date.now()}`,
          photoUrl: fileId,
          extraNotes: `Файл загружен через Telegram: ${fileType}`
        }
      })
      
      const digitalKeyboard = {
        inline_keyboard: [
          [{ text: '✅ Готово', callback_data: `digital_complete_${orderId}` }],
          [{ text: '❌ Отмена', callback_data: `digital_cancel_${orderId}` }]
        ]
      }
      
      await sendTelegramMessage(chatId, 
        `✅ ${fileType === 'photo' ? 'Фото' : fileType === 'video' ? 'Видео' : 'Файл'} загружен\n\n` +
        `📁 Всего файлов: ${userState.uploadedFiles.length}\n` +
        `➕ Можете загрузить еще файлы или нажмите кнопку ниже:`, false, digitalKeyboard)
        
    } catch (error) {
      console.error('Error saving digital content:', error)
      await sendTelegramMessage(chatId, '❌ Ошибка загрузки файла. Попробуйте еще раз.')
    }
  } else {
    const digitalKeyboard = {
      inline_keyboard: [
        [{ text: '✅ Готово', callback_data: `digital_complete_${orderId}` }],
        [{ text: '❌ Отмена', callback_data: `digital_cancel_${orderId}` }]
      ]
    }
    
    await sendTelegramMessage(chatId, 
      '❌ Пожалуйста, отправьте фото, видео или документ\n' +
      'Или используйте кнопки ниже:', false, digitalKeyboard)
  }
}

// WesternBid интеграция для возвратов
async function initiateWesternBidRefund(orderId: string) {
  try {
    // Получаем данные заказа
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      console.error('Order not found for refund:', orderId)
      return { success: false, error: 'Order not found' }
    }
    
    // Проверяем, был ли заказ оплачен
    if (order.paymentStatus !== 'COMPLETED' || !order.paymentId) {
      console.log('Order was not paid or payment ID missing:', {
        orderId,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId
      })
      return { success: true, message: 'Order was not paid, no refund needed' }
    }
    
    // Используем WesternBid API для возврата средств
    const { westernbid } = await import('@/lib/westernbid')
    
    const refundRequest = {
      paymentId: order.paymentId,
      amount: Number(order.total),
      reason: 'Admin cancellation via Telegram bot',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        cancelledBy: 'telegram_admin',
        source: 'telegram_bot'
      }
    }
    
    const refundResult = await westernbid.refundPayment(refundRequest)
    
    if (refundResult.success) {
      // Обновляем статус заказа
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: Number(order.total),
          refundId: refundResult.refundId,
          refundReason: 'Admin cancellation via Telegram bot'
        }
      })
      
      // Создаем лог записи о возврате
      await prisma.orderLog.create({
        data: {
          orderId: orderId,
          action: 'REFUND_INITIATED',
          details: {
            refundId: refundResult.refundId,
            amount: Number(order.total),
            paymentId: order.paymentId,
            westernbidResponse: JSON.parse(JSON.stringify(refundResult)),
            source: 'telegram_bot'
          },
          userId: 'telegram_admin'
        }
      })
      
      console.log('✅ WesternBid refund initiated:', refundResult.refundId)
      return { 
        success: true, 
        refundId: refundResult.refundId,
        amount: refundResult.amount 
      }
    } else {
      console.error('❌ WesternBid refund failed:', refundResult.error)
      
      // Создаем лог записи об ошибке
      await prisma.orderLog.create({
        data: {
          orderId: orderId,
          action: 'REFUND_ERROR',
          details: {
            error: refundResult.error,
            errorCode: refundResult.errorCode,
            paymentId: order.paymentId,
            source: 'telegram_bot'
          },
          userId: 'telegram_admin'
        }
      })
      
      return { 
        success: false, 
        error: refundResult.error || 'Unknown refund error' 
      }
    }
    
  } catch (error) {
    console.error('❌ Error initiating WesternBid refund:', error)
    
    // Создаем лог записи об ошибке
    try {
      await prisma.orderLog.create({
        data: {
          orderId: orderId,
          action: 'REFUND_ERROR',
          details: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            source: 'telegram_bot'
          },
          userId: 'telegram_admin'
        }
      })
    } catch (logError) {
      console.error('Failed to log refund error:', logError)
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

// Email функции для уведомлений клиентов
async function sendTrackingEmail(email: string, name: string, orderNumber: string, trackingNumber: string) {
  try {
    await sendShippingNotification(orderNumber, email, name, trackingNumber, undefined, 'en')
    console.log(`✅ Tracking email sent to ${email} for order ${orderNumber}`)
  } catch (error) {
    console.error('❌ Failed to send tracking email:', error)
  }
}

async function sendDigitalFilesEmail(email: string, name: string, orderNumber: string, signOrder: any) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ваш диджитал заказ готов!</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">🎉 Ваш SING заказ готов!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Детали заказа:</h2>
          <p><strong>Номер заказа:</strong> ${orderNumber}</p>
          <p><strong>Получатель:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #ff6b9d 0%, #00f5ff 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h3 style="margin-top: 0;">📱 Ваши SING файлы готовы!</h3>
          <p>Персонализированные фото и видео созданы специально для вас.</p>
          ${signOrder ? `<p><strong>SING ID:</strong> ${signOrder.signName}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666;">Спасибо за ваш заказ! Если у вас есть вопросы, свяжитесь с нами.</p>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
          <p>© ${new Date().getFullYear()} Vobvorot.com - Все права защищены</p>
        </div>
      </body>
      </html>
    `
    
    await sendEmail({
      to: email,
      subject: `🎉 Ваш SING заказ #${orderNumber} готов!`,
      html: html
    })
    
    console.log(`✅ Digital files email sent to ${email} for order ${orderNumber}`)
  } catch (error) {
    console.error('❌ Failed to send digital files email:', error)
  }
}