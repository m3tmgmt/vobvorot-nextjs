import { NextRequest, NextResponse } from 'next/server'
import { Bot, Context, InlineKeyboard } from 'grammy'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

// Типы для контекста
type MyContext = Context

// Конфигурация
const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']
const OWNER_EMAIL = 'thelordpetrus@gmail.com'
const TELEGRAM_BOT_USERNAME = 'VobvorotAdminBot'

// Инициализация Prisma
const prisma = new PrismaClient()

// Инициализация бота
const bot = new Bot<MyContext>(BOT_TOKEN)

function isAdmin(userId: string): boolean {
  return ADMIN_IDS.includes(userId)
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
    .text('✏️ Редактировать', 'products:edit')
    .text('🗑️ Удалить', 'products:delete')
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

// Команда /start
bot.command('start', async (ctx) => {
  console.log('🎯 /start command from:', ctx.from?.id)
  
  if (!isAdmin(ctx.from?.id.toString() || '')) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }

  await ctx.reply(
    '🚀 *VobVorot Store Management*\\n\\n' +
    'Добро пожаловать в систему управления магазином!\\n' +
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
    '🚀 *VobVorot Store Management*\\n\\n' +
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
    '📦 *Управление заказами*\\n\\nВыберите действие:',
    { 
      parse_mode: 'Markdown',
      reply_markup: getOrdersMenu()
    }
  )
})

// Все заказы
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
        '📦 *Все заказы*\\n\\n❌ Заказов пока нет',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:orders')
        }
      )
      return
    }
    
    let message = '📦 *Все заказы*\\n\\n'
    
    for (const order of orders) {
      const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const date = new Date(order.createdAt).toLocaleDateString('ru-RU')
      
      message += `🆔 *Заказ #${order.orderNumber}*\\n`
      message += `📅 Дата: ${date}\\n`
      message += `👤 Клиент: ${order.user?.name || order.email}\\n`
      message += `💰 Сумма: $${total.toFixed(2)}\\n`
      message += `📊 Статус: ${order.status}\\n`
      message += `━━━━━━━━━━━━━━━\\n\\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'orders:all')
        .text('◀️ Назад', 'menu:orders')
    })
    
  } catch (error) {
    console.error('❌ Error loading orders:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке заказов',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:orders') }
    )
  }
})

// Ожидающие заказы
bot.callbackQuery('orders:pending', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю ожидающие заказы...' })
  
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'pending' },
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
        '⏳ *Ожидающие заказы*\\n\\n✅ Нет ожидающих заказов',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:orders')
        }
      )
      return
    }
    
    let message = '⏳ *Ожидающие заказы*\\n\\n'
    
    for (const order of orders) {
      const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const date = new Date(order.createdAt).toLocaleDateString('ru-RU')
      
      message += `🆔 *Заказ #${order.orderNumber}*\\n`
      message += `📅 Дата: ${date}\\n`
      message += `👤 Клиент: ${order.user?.name || order.email}\\n`
      message += `💰 Сумма: $${total.toFixed(2)}\\n`
      message += `━━━━━━━━━━━━━━━\\n\\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'orders:pending')
        .text('◀️ Назад', 'menu:orders')
    })
    
  } catch (error) {
    console.error('❌ Error loading pending orders:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке ожидающих заказов',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:orders') }
    )
  }
})

// Обработка меню товаров
bot.callbackQuery('menu:products', async (ctx) => {
  await ctx.editMessageText(
    '🛍️ *Управление товарами*\\n\\nВыберите действие:',
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
        '🛍️ *Список товаров*\\n\\n❌ Товаров пока нет',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:products')
        }
      )
      return
    }
    
    let message = '🛍️ *Список товаров*\\n\\n'
    
    for (const product of products) {
      message += `📦 *${product.name}*\\n`
      message += `💰 Цена: $${product.price}\\n`
      message += `📊 В наличии: ${product.inStock ? 'Да' : 'Нет'}\\n`
      message += `🏷️ Категория: ${product.category?.name || 'Без категории'}\\n`
      message += `━━━━━━━━━━━━━━━\\n\\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'products:list')
        .text('◀️ Назад', 'menu:products')
    })
    
  } catch (error) {
    console.error('❌ Error loading products:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке товаров',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:products') }
    )
  }
})

// Обработка меню категорий
bot.callbackQuery('menu:categories', async (ctx) => {
  await ctx.editMessageText(
    '🏷️ *Управление категориями*\\n\\nВыберите действие:',
    { 
      parse_mode: 'Markdown',
      reply_markup: getCategoriesMenu()
    }
  )
})

// Список категорий
bot.callbackQuery('categories:list', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю категории...' })
  
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
    
    if (categories.length === 0) {
      await ctx.editMessageText(
        '🏷️ *Список категорий*\\n\\n❌ Категорий пока нет',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:categories')
        }
      )
      return
    }
    
    let message = '🏷️ *Список категорий*\\n\\n'
    
    for (const category of categories) {
      message += `📁 *${category.name}*\\n`
      message += `📦 Товаров: ${category._count.products}\\n`
      message += `🔗 URL: ${category.slug}\\n`
      message += `━━━━━━━━━━━━━━━\\n\\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'categories:list')
        .text('◀️ Назад', 'menu:categories')
    })
    
  } catch (error) {
    console.error('❌ Error loading categories:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке категорий',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:categories') }
    )
  }
})

// Статистика
bot.callbackQuery('menu:stats', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю статистику...' })
  
  try {
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalCategories,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.category.count(),
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
    
    const message = `📊 *Статистика магазина*\\n\\n` +
      `📦 Всего заказов: ${totalOrders}\\n` +
      `🛍️ Всего товаров: ${totalProducts}\\n` +
      `🏷️ Всего категорий: ${totalCategories}\\n` +
      `👥 Всего клиентов: ${totalUsers}\\n` +
      `💰 Общая выручка: $${totalRevenue.toFixed(2)}\\n`
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'menu:stats')
        .text('◀️ Назад', 'menu:main')
    })
    
  } catch (error) {
    console.error('❌ Error loading stats:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке статистики',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
    )
  }
})

// Обработка отзывов
bot.callbackQuery('menu:reviews', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю отзывы...' })
  
  try {
    const reviews = await prisma.review.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        product: true
      }
    })
    
    if (reviews.length === 0) {
      await ctx.editMessageText(
        '💬 *Отзывы*\\n\\n❌ Отзывов пока нет',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main')
        }
      )
      return
    }
    
    let message = '💬 *Последние отзывы*\\n\\n'
    
    for (const review of reviews) {
      const date = new Date(review.createdAt).toLocaleDateString('ru-RU')
      message += `⭐ ${review.rating}/5 - *${review.product.name}*\\n`
      message += `👤 ${review.user?.name || 'Аноним'}\\n`
      message += `📅 ${date}\\n`
      message += `💭 ${review.comment || 'Без комментария'}\\n`
      message += `━━━━━━━━━━━━━━━\\n\\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'menu:reviews')
        .text('◀️ Назад', 'menu:main')
    })
    
  } catch (error) {
    console.error('❌ Error loading reviews:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке отзывов',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
    )
  }
})

// Обработка клиентов
bot.callbackQuery('menu:customers', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '🔄 Загружаю клиентов...' })
  
  try {
    const customers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    })
    
    if (customers.length === 0) {
      await ctx.editMessageText(
        '👥 *Клиенты*\\n\\n❌ Клиентов пока нет',
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main')
        }
      )
      return
    }
    
    let message = '👥 *Последние клиенты*\\n\\n'
    
    for (const customer of customers) {
      const date = new Date(customer.createdAt).toLocaleDateString('ru-RU')
      message += `👤 *${customer.name || 'Без имени'}*\\n`
      message += `📧 ${customer.email}\\n`
      message += `📦 Заказов: ${customer._count.orders}\\n`
      message += `📅 Регистрация: ${date}\\n`
      message += `━━━━━━━━━━━━━━━\\n\\n`
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'menu:customers')
        .text('◀️ Назад', 'menu:main')
    })
    
  } catch (error) {
    console.error('❌ Error loading customers:', error)
    await ctx.editMessageText(
      '❌ Ошибка при загрузке клиентов',
      { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
    )
  }
})

// Обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx
  console.error('❌ Bot error:', err.error)
})

// Webhook handler
export async function POST(request: NextRequest) {
  console.log('🚀 [DIRECT-CRM] POST request received')
  
  try {
    const update = await request.json()
    console.log('📨 [DIRECT-CRM] Update:', JSON.stringify(update, null, 2))
    
    // Проверяем, что это от админа
    if (update.message?.from?.id || update.callback_query?.from?.id) {
      const userId = update.message?.from?.id || update.callback_query?.from?.id
      if (!isAdmin(userId.toString())) {
        console.log('❌ [DIRECT-CRM] Unauthorized user:', userId)
        return NextResponse.json({ ok: true })
      }
    }
    
    await bot.handleUpdate(update)
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('💥 [DIRECT-CRM] Error:', error)
    logger.error('Direct CRM webhook error', error)
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// GET endpoint для управления webhook
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'set') {
      // Устанавливаем webhook
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://vobvorot.com'}/api/telegram/direct-crm`
      const secretToken = 'vobvorot_webhook_secret_2025'
      
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: secretToken,
          allowed_updates: ['message', 'callback_query', 'inline_query']
        })
      })
      
      const result = await response.json()
      console.log('🎯 [DIRECT-CRM] Webhook set result:', result)
      
      return NextResponse.json(result)
      
    } else if (action === 'info') {
      // Получаем информацию о webhook
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
      const result = await response.json()
      
      return NextResponse.json(result)
      
    } else if (action === 'delete') {
      // Удаляем webhook
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`)
      const result = await response.json()
      
      return NextResponse.json(result)
      
    } else {
      return NextResponse.json({ 
        status: 'Direct CRM webhook ready',
        bot_token: BOT_TOKEN.substring(0, 10) + '...',
        admin_ids: ADMIN_IDS,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    logger.error('Direct CRM webhook error', error)
    return NextResponse.json(
      { error: 'Failed to manage webhook' }, 
      { status: 500 }
    )
  }
}