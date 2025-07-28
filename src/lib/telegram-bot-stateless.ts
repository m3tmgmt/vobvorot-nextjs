import { Bot, Context, InlineKeyboard } from 'grammy'
import { PrismaClient } from '@prisma/client'
import { cloudinaryService } from './cloudinary'

// Типы для контекста
type MyContext = Context

// Проверка обязательных переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = (process.env.TELEGRAM_OWNER_CHAT_ID || '316593422,1837334996').split(',')

console.log('🤖 [BOT-STATELESS] Initializing stateless bot...')
console.log('🔑 [BOT-STATELESS] Token exists:', !!BOT_TOKEN)
console.log('👤 [BOT-STATELESS] Admin IDs:', ADMIN_IDS)

// Инициализация бота
const bot = new Bot<MyContext>(BOT_TOKEN)

// Инициализация Prisma
const prisma = new PrismaClient()

function isAdmin(ctx: MyContext): boolean {
  return ADMIN_IDS.includes(ctx.from?.id.toString() || '')
}

// Главное меню
function getMainMenu() {
  return new InlineKeyboard()
    .text('📦 Заказы', 'menu:orders')
    .text('🛍️ Товары', 'menu:products')
    .row()
    .text('🏷️ Категории', 'menu:categories')
    .text('📊 Статистика', 'menu:stats')
    .row()
    .text('🎬 Видео главной', 'menu:home_video')
    .text('✍️ Видео подписи', 'menu:sign_videos')
    .row()
    .text('💬 Отзывы', 'menu:reviews')
    .text('👥 Клиенты', 'menu:customers')
}

// Меню заказов
function getOrdersMenu() {
  return new InlineKeyboard()
    .text('📋 Все заказы', 'orders:all')
    .text('⏳ Ожидающие', 'orders:pending')
    .row()
    .text('✅ Выполненные', 'orders:completed')
    .text('❌ Отмененные', 'orders:cancelled')
    .row()
    .text('◀️ Назад', 'menu:main')
}

// Меню товаров
function getProductsMenu() {
  return new InlineKeyboard()
    .text('➕ Добавить товар', 'products:add')
    .text('📋 Список товаров', 'products:list')
    .row()
    .text('🔍 Поиск товара', 'products:search')
    .text('📊 Статистика товаров', 'products:stats')
    .row()
    .text('◀️ Назад', 'menu:main')
}

// Меню категорий
function getCategoriesMenu() {
  return new InlineKeyboard()
    .text('➕ Добавить категорию', 'categories:add')
    .text('📋 Список категорий', 'categories:list')
    .row()
    .text('✏️ Редактировать', 'categories:edit')
    .text('🗑️ Удалить', 'categories:delete')
    .row()
    .text('◀️ Назад', 'menu:main')
}

// Старт бота
bot.command('start', async (ctx) => {
  console.log('🎯 [BOT-STATELESS] /start command received from:', ctx.from?.id)
  
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }

  await ctx.reply(
    '🚀 *VobVorot Store Management*\n\n' +
    'Добро пожаловать в систему управления магазином!\n' +
    'Выберите раздел для работы:',
    { 
      parse_mode: 'Markdown',
      reply_markup: getMainMenu()
    }
  )
})

// Обработка главного меню
bot.callbackQuery('menu:main', async (ctx) => {
  await ctx.editMessageText(
    '🚀 *VobVorot Store Management*\n\n' +
    'Выберите раздел для работы:',
    { 
      parse_mode: 'Markdown',
      reply_markup: getMainMenu()
    }
  )
})

// Обработка меню заказов
bot.callbackQuery('menu:orders', async (ctx) => {
  await ctx.editMessageText(
    '📦 *Управление заказами*\n\nВыберите действие:',
    { 
      parse_mode: 'Markdown',
      reply_markup: getOrdersMenu()
    }
  )
})

// Обработка всех заказов
bot.callbackQuery('orders:all', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю заказы...' })
  
  try {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (orders.length === 0) {
      await ctx.editMessageText(
        '📦 *Все заказы*\n\n❌ Заказов пока нет',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:orders')
        }
      )
      return
    }
    
    let message = '📦 *Все заказы*\n\n'
    
    for (const order of orders) {
      const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const date = new Date(order.createdAt).toLocaleDateString('ru-RU')
      
      message += `🆔 *Заказ #${order.orderNumber}*\n`
      message += `📅 Дата: ${date}\n`
      message += `👤 Клиент: ${order.user?.name || order.email}\n`
      message += `💰 Сумма: $${total.toFixed(2)}\n`
      message += `📊 Статус: ${order.status}\n`
      message += `━━━━━━━━━━━━━━━\n\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'orders:all')
        .text('◀️ Назад', 'menu:orders')
    })
    
  } catch (error) {
    console.error('❌ [BOT-STATELESS] Error loading orders:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке заказов',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:orders') }
    )
  }
})

// Обработка меню товаров
bot.callbackQuery('menu:products', async (ctx) => {
  await ctx.editMessageText(
    '🛍️ *Управление товарами*\n\nВыберите действие:',
    { 
      parse_mode: 'Markdown',
      reply_markup: getProductsMenu()
    }
  )
})

// Список товаров
bot.callbackQuery('products:list', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю товары...' })
  
  try {
    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true
      }
    })
    
    if (products.length === 0) {
      await ctx.editMessageText(
        '🛍️ *Список товаров*\n\n❌ Товаров пока нет',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:products')
        }
      )
      return
    }
    
    let message = '🛍️ *Список товаров*\n\n'
    
    for (const product of products) {
      message += `📦 *${product.name}*\n`
      message += `💰 Цена: $${product.price}\n`
      message += `📊 В наличии: ${product.inStock ? 'Да' : 'Нет'}\n`
      message += `🏷️ Категория: ${product.category?.name || 'Без категории'}\n`
      message += `━━━━━━━━━━━━━━━\n\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'products:list')
        .text('◀️ Назад', 'menu:products')
    })
    
  } catch (error) {
    console.error('❌ [BOT-STATELESS] Error loading products:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке товаров',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:products') }
    )
  }
})

// Обработка меню категорий
bot.callbackQuery('menu:categories', async (ctx) => {
  await ctx.editMessageText(
    '🏷️ *Управление категориями*\n\nВыберите действие:',
    { 
      parse_mode: 'Markdown',
      reply_markup: getCategoriesMenu()
    }
  )
})

// Статистика
bot.callbackQuery('menu:stats', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю статистику...' })
  
  try {
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({
        include: { items: true }
      }).then(orders => 
        orders.reduce((sum, order) => 
          sum + order.items.reduce((orderSum, item) => 
            orderSum + (item.price * item.quantity), 0
          ), 0
        )
      )
    ])
    
    const message = `📊 *Статистика магазина*\n\n` +
      `📦 Всего заказов: ${totalOrders}\n` +
      `🛍️ Всего товаров: ${totalProducts}\n` +
      `👥 Всего клиентов: ${totalUsers}\n` +
      `💰 Общая выручка: $${totalRevenue.toFixed(2)}\n`
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'menu:stats')
        .text('◀️ Назад', 'menu:main')
    })
    
  } catch (error) {
    console.error('❌ [BOT-STATELESS] Error loading stats:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке статистики',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
    )
  }
})

// Заглушки для остальных разделов
bot.callbackQuery(['menu:home_video', 'menu:sign_videos', 'menu:reviews', 'menu:customers'], async (ctx) => {
  const sections = {
    'menu:home_video': '🎬 Видео главной',
    'menu:sign_videos': '✍️ Видео подписи',
    'menu:reviews': '💬 Отзывы',
    'menu:customers': '👥 Клиенты'
  }
  
  const section = sections[ctx.callbackQuery.data as keyof typeof sections]
  
  await ctx.editMessageText(
    `${section} - в разработке`,
    { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
  )
})

// Обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx
  console.error('❌ [BOT-STATELESS] Error while handling update', ctx.update.update_id, ':', err.error)
})

console.log('✅ [BOT-STATELESS] Stateless bot initialized successfully')

export { bot }