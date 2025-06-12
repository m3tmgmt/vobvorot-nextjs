import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cloudinaryService } from '@/lib/cloudinary'

const prisma = new PrismaClient()

const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM'
const ADMIN_IDS = ['316593422', '1837334996']
const ADMIN_API_KEY = process.env.ADMIN_API_KEY

// Простое хранилище состояний пользователей (в production лучше использовать Redis)
const userStates = new Map<string, any>()

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
      await startEditProduct(chatId)
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
    default:
      // Проверяем, не является ли это выбором категории
      if (data.startsWith('select_category_')) {
        const categoryId = data.replace('select_category_', '')
        await handleCategorySelection(chatId, userId, categoryId)
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
        { text: '➕ Добавить товар', callback_data: 'add_product' },
        { text: '📝 Редактировать', callback_data: 'edit_product' }
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
    const videoUrl = await uploadVideoToCloudinary(video)
    
    if (videoUrl) {
      await updateHomeVideo(videoUrl)
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
        ]
      }
      
      await sendTelegramMessage(chatId, '✅ Видео главной страницы обновлено!', false, keyboard)
    } else {
      await sendTelegramMessage(chatId, '❌ Ошибка загрузки видео')
    }
  } catch (error) {
    console.error('Error uploading video:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки видео')
  }
  
  userStates.delete(userId.toString())
}

async function deleteHomeVideo(chatId: number) {
  try {
    await updateHomeVideo('')
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
      ]
    }
    
    await sendTelegramMessage(chatId, '✅ Видео главной страницы удалено', false, keyboard)
  } catch (error) {
    console.error('Error deleting video:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка удаления видео')
  }
}

async function getCurrentVideoInfo(chatId: number) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://vobvorot.com'}/api/admin/site/home-video`)
    const data = await response.json()
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад к видео', callback_data: 'back_video' }]
      ]
    }
    
    if (data.videoUrl) {
      await sendTelegramMessage(
        chatId,
        `🎬 *Текущее видео:*\n\n${data.videoUrl}\n\n📅 Обновлено: ${new Date(data.updatedAt).toLocaleString('ru-RU')}`,
        true,
        keyboard
      )
    } else {
      await sendTelegramMessage(chatId, '❌ Видео не установлено', false, keyboard)
    }
  } catch (error) {
    console.error('Error getting video info:', error)
    await sendTelegramMessage(chatId, '❌ Ошибка получения информации о видео')
  }
}

async function startEditProduct(chatId: number) {
  await sendTelegramMessage(chatId, '📝 Редактирование товаров будет добавлено в следующем обновлении')
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
    const fileResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${video.file_id}`)
    const fileData = await fileResponse.json()
    
    if (!fileData.ok) return null
    
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`
    
    const result = await cloudinaryService.uploadFromUrl(fileUrl, {
      folder: 'vobvorot-videos',
      resource_type: 'video'
    })
    
    return result.secure_url
  } catch (error) {
    console.error('Error uploading video:', error)
    return null
  }
}

async function updateHomeVideo(videoUrl: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://vobvorot.com'}/api/admin/site/home-video`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoUrl })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.error('Error updating home video:', error)
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