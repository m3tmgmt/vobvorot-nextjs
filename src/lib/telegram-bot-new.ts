import { Bot, Context, session } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { Menu } from '@grammyjs/menu'
import { cloudinaryService } from './cloudinary'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Проверяем переменные окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.split(',') || []
const ADMIN_API_KEY = process.env.ADMIN_API_KEY

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required')
}

console.log('🤖 Initializing VobvorotAdminBot...')
console.log(`📋 Admin IDs: ${ADMIN_IDS.join(', ')}`)

// Типы для сессии
interface SessionData {
  conversationStep?: string
  productData?: any
  messageId?: number
}

type MyContext = Context & {
  session: SessionData
  conversation: any
}

// Создаем бота
export const bot = new Bot<MyContext>(BOT_TOKEN)

// Настраиваем сессии
bot.use(session({
  initial(): SessionData {
    return {}
  },
}))

// Подключаем conversations
bot.use(conversations())

// Проверка прав администратора
function isAdmin(ctx: MyContext): boolean {
  const userId = ctx.from?.id.toString()
  const isAdminUser = userId && ADMIN_IDS.includes(userId)
  console.log(`🔐 Checking admin rights for user ${userId}: ${isAdminUser}`)
  return Boolean(isAdminUser)
}

// Функция для отправки уведомлений админам
async function notifyAdmins(message: string, options?: any) {
  for (const adminId of ADMIN_IDS) {
    try {
      await bot.api.sendMessage(adminId, message, options)
      console.log(`✅ Notification sent to admin ${adminId}`)
    } catch (error) {
      console.error(`❌ Failed to send notification to admin ${adminId}:`, error)
    }
  }
}

// Главное меню
const mainMenu = new Menu<MyContext>('main-menu')
  .text('📦 Заказы', async (ctx) => {
    await ctx.reply('📦 Управление заказами:', { reply_markup: ordersMenu })
  }).row()
  .text('🛍️ Товары', async (ctx) => {
    await ctx.reply('🛍️ Управление товарами:', { reply_markup: productsMenu })
  }).row()
  .text('📊 Статистика', async (ctx) => {
    try {
      const stats = await getStats()
      await ctx.reply(stats)
    } catch (error) {
      await ctx.reply('❌ Ошибка получения статистики')
    }
  }).row()
  .text('🎬 Видео главной', async (ctx) => {
    await ctx.reply('🎬 Управление видео главной страницы:', { reply_markup: videoMenu })
  }).row()
  .text('💬 Отзывы', async (ctx) => {
    await ctx.reply('💬 Управление отзывами (в разработке)')
  })
  .text('👥 Клиенты', async (ctx) => {
    await ctx.reply('👥 Управление клиентами (в разработке)')
  })

// Меню заказов
const ordersMenu = new Menu<MyContext>('orders-menu')
  .text('📥 Новые', async (ctx) => {
    const orders = await getOrdersByStatus('PENDING')
    await ctx.reply(orders || 'Нет новых заказов')
  })
  .text('⏳ В обработке', async (ctx) => {
    const orders = await getOrdersByStatus('PROCESSING')
    await ctx.reply(orders || 'Нет заказов в обработке')
  }).row()
  .text('📦 Отправленные', async (ctx) => {
    const orders = await getOrdersByStatus('SHIPPED')
    await ctx.reply(orders || 'Нет отправленных заказов')
  })
  .text('✅ Завершенные', async (ctx) => {
    const orders = await getOrdersByStatus('DELIVERED')
    await ctx.reply(orders || 'Нет завершенных заказов')
  }).row()
  .back('⬅️ Назад')

// Меню товаров
const productsMenu = new Menu<MyContext>('products-menu')
  .text('➕ Добавить товар', async (ctx) => {
    await ctx.conversation.enter('addProductConversation')
  }).row()
  .text('📝 Редактировать товар', async (ctx) => {
    await ctx.reply('📝 Редактирование товаров (в разработке)')
  }).row()
  .text('📋 Список товаров', async (ctx) => {
    const products = await getProductsList()
    await ctx.reply(products)
  }).row()
  .back('⬅️ Назад')

// Меню видео
const videoMenu = new Menu<MyContext>('video-menu')
  .text('📤 Загрузить видео', async (ctx) => {
    await ctx.conversation.enter('uploadHomeVideoConversation')
  })
  .text('🗑️ Удалить видео', async (ctx) => {
    await deleteHomeVideo()
    await ctx.reply('✅ Видео главной страницы удалено')
  }).row()
  .text('ℹ️ Текущее видео', async (ctx) => {
    const videoInfo = await getCurrentHomeVideo()
    await ctx.reply(videoInfo)
  }).row()
  .back('⬅️ Назад')

// Подключаем меню
bot.use(mainMenu)
bot.use(ordersMenu)
bot.use(productsMenu)
bot.use(videoMenu)

// Диалог добавления товара
async function addProductConversation(conversation: any, ctx: MyContext) {
  try {
    const productData: any = {}

    // Название товара
    await ctx.reply('📝 Введите название товара:')
    const nameCtx = await conversation.wait()
    productData.name = nameCtx.message?.text
    if (!productData.name) {
      await ctx.reply('❌ Название товара обязательно')
      return
    }

    // Описание товара
    await ctx.reply('📄 Введите описание товара:')
    const descCtx = await conversation.wait()
    productData.description = descCtx.message?.text || ''

    // Цена товара
    await ctx.reply('💰 Введите цену товара (USD):')
    const priceCtx = await conversation.wait()
    const price = parseFloat(priceCtx.message?.text || '0')
    if (price <= 0) {
      await ctx.reply('❌ Введите корректную цену')
      return
    }
    productData.price = price

    // Фото товара
    await ctx.reply('📸 Отправьте фото товара:')
    const photoCtx = await conversation.wait()
    if (photoCtx.message?.photo) {
      const photoUrl = await uploadPhotoToCloudinary(photoCtx.message.photo)
      productData.imageUrl = photoUrl
    }

    // Видео товара (опционально)
    await ctx.reply('🎬 Отправьте видео для товара (или напишите "пропустить"):')
    const videoCtx = await conversation.wait()
    if (videoCtx.message?.video) {
      const videoUrl = await uploadVideoToCloudinary(videoCtx.message.video)
      productData.videoUrl = videoUrl
    } else if (videoCtx.message?.text !== 'пропустить') {
      productData.videoUrl = null
    }

    // Создаем товар
    await ctx.reply('⏳ Создаю товар...')
    const result = await createProduct(productData)
    if (result.success) {
      await ctx.reply(`✅ Товар "${productData.name}" успешно создан!\n\n${result.message}`)
    } else {
      await ctx.reply(`❌ Ошибка создания товара: ${result.error}`)
    }

  } catch (error) {
    console.error('Error in addProductConversation:', error)
    await ctx.reply('❌ Произошла ошибка при создании товара')
  }
}

// Диалог загрузки видео главной страницы
async function uploadHomeVideoConversation(conversation: any, ctx: MyContext) {
  try {
    await ctx.reply('🎬 Отправьте видео для главной страницы:')
    const videoCtx = await conversation.wait()
    
    if (videoCtx.message?.video) {
      await ctx.reply('⏳ Загружаю видео...')
      const videoUrl = await uploadVideoToCloudinary(videoCtx.message.video)
      
      if (videoUrl) {
        await updateHomeVideo(videoUrl)
        await ctx.reply('✅ Видео главной страницы обновлено!')
      } else {
        await ctx.reply('❌ Ошибка загрузки видео')
      }
    } else {
      await ctx.reply('❌ Пожалуйста, отправьте видео файл')
    }
  } catch (error) {
    console.error('Error in uploadHomeVideoConversation:', error)
    await ctx.reply('❌ Произошла ошибка при загрузке видео')
  }
}

// Регистрируем диалоги
bot.use(createConversation(addProductConversation))
bot.use(createConversation(uploadHomeVideoConversation))

// Команды бота
bot.command('start', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту')
    return
  }

  const welcomeMessage = `
🤖 *VobvorotAdminBot* приветствует вас!

👋 Добро пожаловать в панель управления VobVorot Store

📱 Используйте меню ниже для управления:
• 📦 Заказы - обработка заказов
• 🛍️ Товары - управление каталогом
• 📊 Статистика - аналитика продаж
• 🎬 Видео главной - контент главной страницы
• 💬 Отзывы - модерация отзывов
• 👥 Клиенты - управление клиентами

🚀 Выберите нужный раздел:
  `

  await ctx.reply(welcomeMessage, { 
    reply_markup: mainMenu,
    parse_mode: 'Markdown'
  })
})

bot.command('menu', async (ctx) => {
  if (!isAdmin(ctx)) return
  await ctx.reply('🏠 Главное меню:', { reply_markup: mainMenu })
})

bot.command('help', async (ctx) => {
  if (!isAdmin(ctx)) return
  const helpMessage = `
🆘 *Помощь по VobvorotAdminBot*

📋 *Доступные команды:*
/start - Запуск бота и главное меню
/menu - Показать главное меню
/help - Эта справка

📱 *Основные функции:*
• 📦 Управление заказами
• 🛍️ Добавление товаров с фото и видео
• 📊 Просмотр статистики
• 🎬 Загрузка видео для главной страницы

🔒 Доступ ограничен администраторами
  `
  await ctx.reply(helpMessage, { parse_mode: 'Markdown' })
})

// Обработка сообщений
bot.on('message', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту')
    return
  }

  // Если сообщение не является командой, показываем меню
  if (ctx.message.text && !ctx.message.text.startsWith('/')) {
    await ctx.reply('🏠 Используйте меню для навигации:', { reply_markup: mainMenu })
  }
})

// === ФУНКЦИИ РАБОТЫ С ДАННЫМИ ===

async function getStats(): Promise<string> {
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
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
        }
      }
    })

    return `
📊 *Статистика VobVorot Store*

📦 Всего заказов: ${ordersCount}
🛍️ Товаров в каталоге: ${productsCount}
💰 Общая выручка: $${totalRevenue._sum.total?.toFixed(2) || '0.00'}
📈 Заказов за неделю: ${recentOrders}

📅 Обновлено: ${new Date().toLocaleString('ru-RU')}
    `
  } catch (error) {
    console.error('Error getting stats:', error)
    return '❌ Ошибка получения статистики'
  }
}

async function getOrdersByStatus(status: string): Promise<string | null> {
  try {
    const orders = await prisma.order.findMany({
      where: { status: status as any },
      take: 10,
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

    if (orders.length === 0) {
      return null
    }

    let message = `📦 Заказы со статусом "${status}":\n\n`
    
    for (const order of orders) {
      const itemsText = order.items.map(item => 
        `• ${item.sku.product.name} x${item.quantity} - $${item.price}`
      ).join('\n')
      
      message += `🆔 ${order.orderNumber}\n`
      message += `💰 $${order.total}\n`
      message += `📅 ${order.createdAt.toLocaleDateString('ru-RU')}\n`
      message += `${itemsText}\n\n`
    }

    return message
  } catch (error) {
    console.error('Error getting orders:', error)
    return '❌ Ошибка получения заказов'
  }
}

async function getProductsList(): Promise<string> {
  try {
    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        skus: true,
        _count: {
          select: { skus: true }
        }
      }
    })

    if (products.length === 0) {
      return '📦 Товаров пока нет'
    }

    let message = '🛍️ Список товаров:\n\n'
    
    for (const product of products) {
      const minPrice = Math.min(...product.skus.map(sku => Number(sku.price)))
      message += `📦 ${product.name}\n`
      message += `💰 От $${minPrice}\n`
      message += `🔢 Вариантов: ${product._count.skus}\n`
      message += `🎬 Видео: ${product.videoUrl ? '✅' : '❌'}\n\n`
    }

    return message
  } catch (error) {
    console.error('Error getting products:', error)
    return '❌ Ошибка получения товаров'
  }
}

async function createProduct(productData: any): Promise<{ success: boolean, message?: string, error?: string }> {
  try {
    // Создаем slug из названия
    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Получаем первую категорию для демо
    const firstCategory = await prisma.category.findFirst()
    if (!firstCategory) {
      return { success: false, error: 'Нет доступных категорий' }
    }

    // Создаем товар
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: slug + '-' + Date.now(), // Уникальный slug
        description: productData.description,
        categoryId: firstCategory.id,
        videoUrl: productData.videoUrl,
        isActive: true
      }
    })

    // Создаем SKU
    await prisma.productSku.create({
      data: {
        sku: `SKU-${product.id.slice(-8).toUpperCase()}`,
        price: productData.price,
        stock: 100, // Значение по умолчанию
        productId: product.id,
        isActive: true
      }
    })

    // Создаем изображение если есть
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

    return {
      success: true,
      message: `Товар создан с ID: ${product.id}\nСсылка: https://vobvorot.com/products/${product.slug}`
    }

  } catch (error) {
    console.error('Error creating product:', error)
    return { success: false, error: 'Ошибка создания товара в базе данных' }
  }
}

async function uploadPhotoToCloudinary(photos: any[]): Promise<string | null> {
  try {
    const photo = photos[photos.length - 1] // Берем самое большое фото
    const fileResponse = await bot.api.getFile(photo.file_id)
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileResponse.file_path}`
    
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
    const fileResponse = await bot.api.getFile(video.file_id)
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileResponse.file_path}`
    
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
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/home-video`, {
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

async function deleteHomeVideo(): Promise<void> {
  try {
    await updateHomeVideo('')
  } catch (error) {
    console.error('Error deleting home video:', error)
  }
}

async function getCurrentHomeVideo(): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/home-video`)
    const data = await response.json()
    
    if (data.videoUrl) {
      return `🎬 Текущее видео: ${data.videoUrl}\n📅 Обновлено: ${new Date(data.updatedAt).toLocaleString('ru-RU')}`
    } else {
      return '❌ Видео не установлено'
    }
  } catch (error) {
    console.error('Error getting home video:', error)
    return '❌ Ошибка получения информации о видео'
  }
}

// Экспорт функции для уведомлений о заказах
export { notifyAdmins }

console.log('✅ VobvorotAdminBot initialized successfully')