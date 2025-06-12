import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cloudinaryService } from '@/lib/cloudinary'

const prisma = new PrismaClient()

const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM'
const ADMIN_IDS = ['316593422', '1837334996']
const ADMIN_API_KEY = process.env.ADMIN_API_KEY

// Простое хранилище состояний пользователей (в production лучше использовать Redis)
const userStates = new Map<string, any>()

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
    console.log('📨 Full webhook received:', JSON.stringify(update, null, 2))
    
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
    case 'orders_new':
      await sendOrdersByStatus(chatId, 'PENDING')
      break
    case 'orders_processing':
      await sendOrdersByStatus(chatId, 'PROCESSING')
      break
    case 'orders_shipped':
      await sendOrdersByStatus(chatId, 'SHIPPED')
      break
    case 'orders_delivered':
      await sendOrdersByStatus(chatId, 'DELIVERED')
      break
    case 'products_list':
      await sendProductsList(chatId)
      break
    case 'add_product':
      await startAddProduct(chatId, userId)
      break
    case 'edit_product':
      await sendProductsListForEdit(chatId)
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
    case 'create_new_category':
      await startCreateCategory(chatId, userId)
      break
    case 'delete_products':
      await sendProductsListForDelete(chatId)
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
      // Проверяем подтверждение удаления
      else if (data.startsWith('confirm_delete_')) {
        const productId = data.replace('confirm_delete_', '')
        await deleteProduct(chatId, productId)
      }
      // Проверяем отмену удаления
      else if (data.startsWith('cancel_delete_')) {
        await sendProductsListForDelete(chatId)
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
      // Проверяем удаление конкретного видео
      else if (data.startsWith('delete_video_')) {
        const videoId = data.replace('delete_video_', '')
        await confirmVideoDelete(chatId, videoId)
      }
      // Проверяем подтверждение удаления видео
      else if (data.startsWith('confirm_delete_video_')) {
        const videoId = data.replace('confirm_delete_video_', '')
        await executeVideoDelete(chatId, videoId)
      }
      // Проверяем отмену удаления видео
      else if (data.startsWith('cancel_delete_video_')) {
        await deleteHomeVideo(chatId)
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
  
  // Проверяем состояние пользователя
  const userState = userStates.get(userId.toString())
  
  if (userState) {
    return await handleUserState(message, userState)
  }
  
  // Обработка обычных команд
  if (text) {
    console.log(`👤 User ${username} (${userId}): ${text}`)
    
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
      default:
        if (text.startsWith('/')) {
          await sendTelegramMessage(chatId, `❓ Неизвестная команда: ${text}\n\nИспользуйте /start для главного меню`)
        } else {
          await sendMainMenu(chatId)
        }
    }
  }
}

async function sendWelcomeMessage(chatId: number, userId: number) {
  const welcomeMessage = `🤖 *VobvorotAdminBot* приветствует вас!

👋 Добро пожаловать в панель управления VobVorot Store

✅ Ваш ID: ${userId}
✅ Доступ подтвержден
✅ Новый бот активен

🚀 Выберите нужный раздел:`

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📦 Заказы', callback_data: 'orders' },
        { text: '🛍️ Товары', callback_data: 'products' }
      ],
      [
        { text: '📊 Статистика', callback_data: 'stats' },
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
        { text: '📊 Статистика', callback_data: 'stats' },
        { text: '🎬 Видео главной', callback_data: 'video' }
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
        { text: '⏳ В обработке', callback_data: 'orders_processing' }
      ],
      [
        { text: '📦 Отправленные', callback_data: 'orders_shipped' },
        { text: '✅ Завершенные', callback_data: 'orders_delivered' }
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

async function sendOrdersByStatus(chatId: number, status: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { status: status as any },
      take: 5,
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
        }
      }
    })

    let message = `📦 *Заказы со статусом "${status}":*\n\n`
    
    if (orders.length === 0) {
      message += 'Заказов не найдено'
    } else {
      for (const order of orders) {
        const itemsText = order.items.map(item => 
          `• ${item.sku.product.name} x${item.quantity} - $${item.price}`
        ).join('\n')
        
        message += `🆔 ${order.orderNumber}\n`
        message += `💰 $${order.total}\n`
        message += `📅 ${order.createdAt.toLocaleDateString('ru-RU')}\n`
        message += `${itemsText}\n\n`
      }
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к заказам', callback_data: 'back_orders' }]
      ]
    }

    await sendTelegramMessage(chatId, message, true, keyboard)
  } catch (error) {
    console.error('Error getting orders:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения заказов')
  }
}

async function sendProductsList(chatId: number) {
  try {
    const products = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        skus: true,
        _count: {
          select: { skus: true }
        }
      }
    })

    let message = '🛍️ *Список товаров:*\n\n'
    
    if (products.length === 0) {
      message += 'Товаров пока нет'
    } else {
      for (const product of products) {
        const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
        message += `📦 ${product.name}\n`
        message += `💰 От $${minPrice}\n`
        message += `🔢 Вариантов: ${product._count.skus}\n`
        message += `🎬 Видео: ${product.videoUrl ? '✅' : '❌'}\n\n`
      }
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }]
      ]
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
  
  switch(userState.action) {
    case 'add_product_name':
      return await handleAddProductName(chatId, userId, text)
    case 'add_product_description':
      return await handleAddProductDescription(chatId, userId, text)
    case 'add_product_price':
      return await handleAddProductPrice(chatId, userId, text)
    case 'add_product_category':
      return await handleAddProductCategory(chatId, userId, text)
    case 'add_product_photo':
      return await handleAddProductPhoto(chatId, userId, photo)
    case 'add_product_video':
      return await handleAddProductVideo(chatId, userId, video, text)
    case 'create_category_name':
      return await handleCreateCategoryName(chatId, userId, text)
    case 'upload_home_video':
      return await handleUploadHomeVideo(chatId, userId, video)
    case 'edit_product_name':
      return await handleEditProductName(chatId, userId, text)
    case 'edit_product_description':
      return await handleEditProductDescription(chatId, userId, text)
    case 'edit_product_price':
      return await handleEditProductPrice(chatId, userId, text)
    default:
      // Неизвестное состояние, сбрасываем
      userStates.delete(userId.toString())
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
  userState.productData.price = price
  userState.action = 'add_product_category'
  userStates.set(userId.toString(), userState)
  
  await sendCategorySelection(chatId)
}

async function sendCategorySelection(chatId: number) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
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
    userState.action = 'add_product_photo'
    userStates.set(userId.toString(), userState)
    
    await sendTelegramMessage(chatId, `✅ Выбрана категория: ${category.name}\n\n📸 Отправьте фото товара:`)
    
  } catch (error) {
    console.error('Error handling category selection:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка выбора категории')
  }
}

async function startCreateCategory(chatId: number, userId: number) {
  const userState = userStates.get(userId.toString())
  if (!userState || userState.action !== 'add_product_category') {
    await sendTelegramMessage(chatId, '❌ Ошибка состояния. Начните заново.')
    return
  }
  
  userState.action = 'create_category_name'
  userStates.set(userId.toString(), userState)
  
  await sendTelegramMessage(chatId, '📝 Введите название новой категории:')
}

async function handleCreateCategoryName(chatId: number, userId: number, text: string) {
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, '❌ Введите корректное название категории')
    return
  }
  
  try {
    await sendTelegramMessage(chatId, '⏳ Создаю новую категорию...')
    
    // Создаем slug из названия
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    // Создаем новую категорию
    const newCategory = await prisma.category.create({
      data: {
        name: text,
        slug: slug + '-' + Date.now(),
        isActive: true
      }
    })
    
    // Обновляем состояние пользователя
    const userState = userStates.get(userId.toString())
    userState.productData.categoryId = newCategory.id
    userState.action = 'add_product_photo'
    userStates.set(userId.toString(), userState)
    
    await sendTelegramMessage(chatId, `✅ Создана новая категория: ${newCategory.name}\n\n📸 Отправьте фото товара:`)
    
  } catch (error) {
    console.error('Error creating category:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка создания категории. Попробуйте еще раз.')
  }
}

async function handleAddProductPhoto(chatId: number, userId: number, photo: any) {
  if (!photo) {
    await sendTelegramMessage(chatId, '❌ Пожалуйста, отправьте фото товара')
    return
  }
  
  await sendTelegramMessage(chatId, '⏳ Загружаю фото...')
  
  try {
    const photoUrl = await uploadPhotoToCloudinary(photo)
    
    if (!photoUrl) {
      throw new Error('Failed to upload photo')
    }
    
    const userState = userStates.get(userId.toString())
    userState.productData.imageUrl = photoUrl
    userState.action = 'add_product_video'
    userStates.set(userId.toString(), userState)
    
    await sendTelegramMessage(chatId, '🎬 Отправьте видео товара или напишите "пропустить":')
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
    await sendTelegramMessage(chatId, '❌ Отправьте видео или напишите "пропустить"')
    return
  }
  
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
        price: productData.price,
        stock: 100,
        productId: product.id,
        isActive: true
      }
    })
    
    // Создаем изображение
    if (productData.imageUrl) {
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
      `✅ *Товар успешно создан!*\n\n📦 Название: ${productData.name}\n💰 Цена: $${productData.price}\n🆔 ID: ${product.id}\n\n🔗 Ссылка: https://vobvorot.com/products/${product.slug}`,
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
    // Получаем список всех видео
    const response = await fetch(`https://vobvorot.com/api/admin/site/home-videos`)
    const data = await response.json()
    
    if (!data.videos || data.videos.length === 0) {
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
    for (const video of data.videos) {
      const videoName = video.url.split('/').pop()?.split('.')[0] || 'video'
      const shortName = videoName.length > 20 ? videoName.substring(0, 20) + '...' : videoName
      videoButtons.push([{
        text: `🗑️ ${shortName}`,
        callback_data: `delete_video_${video.id}`
      }])
    }
    
    // Добавляем кнопку "Назад"
    videoButtons.push([{ text: '⬅️ Назад к видео', callback_data: 'back_video' }])
    
    const keyboard = {
      inline_keyboard: videoButtons
    }
    
    await sendTelegramMessage(chatId, `🗑️ *Выберите видео для удаления:*\n\nВсего видео: ${data.videos.length}`, true, keyboard)
  } catch (error) {
    console.error('Error showing delete video menu:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка видео')
  }
}

async function getCurrentVideoInfo(chatId: number) {
  try {
    const response = await fetch(`https://vobvorot.com/api/admin/site/home-videos`)
    const data = await response.json()
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
      ]
    }
    
    if (data.videos && data.videos.length > 0) {
      let message = `🎬 *Галерея видео главной страницы:*\n\n📊 Всего видео: ${data.videos.length}\n\n`
      
      data.videos.forEach((video: any, index: number) => {
        const videoName = video.url.split('/').pop()?.split('.')[0] || 'video'
        const shortName = videoName.length > 30 ? videoName.substring(0, 30) + '...' : videoName
        const createdDate = new Date(video.createdAt).toLocaleString('ru-RU')
        message += `${index + 1}. 🎥 ${shortName}\n`
        message += `   📅 ${createdDate}\n`
        message += `   🔗 ${video.url.length > 50 ? video.url.substring(0, 50) + '...' : video.url}\n\n`
      })
      
      await sendTelegramMessage(chatId, message, true, keyboard)
    } else {
      await sendTelegramMessage(chatId, '❌ Видео не установлены\n\nГалерея пуста. Загрузите первое видео!', false, keyboard)
    }
  } catch (error) {
    console.error('Error getting video info:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о видео')
  }
}

// Функции для редактирования товаров
async function sendProductsListForEdit(chatId: number) {
  try {
    const products = await prisma.product.findMany({
      take: 10,
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

    // Создаем кнопки для каждого товара
    const productButtons = []
    for (const product of products) {
      const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
      productButtons.push([{
        text: `📝 ${product.name} - $${minPrice}`,
        callback_data: `edit_product_${product.id}`
      }])
    }

    // Добавляем кнопку "Назад"
    productButtons.push([{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }])

    const keyboard = {
      inline_keyboard: productButtons
    }

    await sendTelegramMessage(chatId, '📝 *Выберите товар для редактирования:*', true, keyboard)
  } catch (error) {
    console.error('Error getting products for edit:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения списка товаров')
  }
}

async function sendProductsListForDelete(chatId: number) {
  try {
    const products = await prisma.product.findMany({
      take: 10,
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

    // Создаем кнопки для каждого товара
    const productButtons = []
    for (const product of products) {
      const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
      productButtons.push([{
        text: `🗑️ ${product.name} - $${minPrice}`,
        callback_data: `delete_product_${product.id}`
      }])
    }

    // Добавляем кнопку "Назад"
    productButtons.push([{ text: '⬅️ Назад к товарам', callback_data: 'back_products' }])

    const keyboard = {
      inline_keyboard: productButtons
    }

    await sendTelegramMessage(chatId, '🗑️ *Выберите товар для удаления:*', true, keyboard)
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
    
    const message = `📝 *Редактирование товара:*

📦 *Название:* ${product.name}
📄 *Описание:* ${product.description || 'Не указано'}
💰 *Цена:* $${minPrice}
🏷️ *Категория:* ${product.category?.name || 'Не указана'}
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
        skus: true,
        images: true
      }
    })

    if (!product) {
      await sendTelegramMessage(chatId, '❌ Товар не найден')
      return
    }

    await sendTelegramMessage(chatId, '⏳ Удаляю товар...')

    // Удаляем связанные данные
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
      method: 'new_gallery_api'
    })
    
    const response = await fetch(`https://vobvorot.com/api/admin/site/home-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoUrl })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    await saveDebugLog('add_video_to_gallery_success', {
      videoUrl: videoUrl,
      totalVideos: data.count,
      message: 'Added to gallery successfully'
    })
    
    console.log('Video added to gallery:', videoUrl, 'Total videos:', data.count)
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
      method: 'new_gallery_api'
    })
    
    const response = await fetch(`https://vobvorot.com/api/admin/site/home-videos`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoId })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    await saveDebugLog('delete_video_from_gallery_success', {
      videoId: videoId,
      remainingVideos: data.count,
      message: 'Deleted from gallery successfully'
    })
    
    console.log('Video deleted from gallery:', videoId, 'Remaining videos:', data.count)
  } catch (error) {
    console.error('Error deleting video from gallery:', error)
    await saveDebugLog('delete_video_from_gallery_error', {
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
    const webhookUrl = 'https://vobvorot.com/api/telegram/webhook-full'
    
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
    status: 'Full webhook endpoint with menus and database integration',
    actions: {
      set: '?action=set',
      info: '?action=info',
      delete: '?action=delete'
    }
  })
}