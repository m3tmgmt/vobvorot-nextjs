import { NextRequest, NextResponse } from 'next/server'
import { Bot, Context, InlineKeyboard } from 'grammy'
import { PrismaClient } from '@prisma/client'

// Типы для контекста
type MyContext = Context

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = (process.env.TELEGRAM_OWNER_CHAT_ID || '316593422,1837334996').split(',')
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'development-key'
const API_URL = process.env.NEXTAUTH_URL || 'https://vobvorot.com'

// Глобальная переменная для Prisma (для переиспользования в serverless)
let prisma: PrismaClient

// Функция для получения Prisma клиента
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

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
    .text('🎬 Видео главной', 'menu:home_videos')
    .text('✍️ Видео подписи', 'menu:sign_videos')
    .row()
    .text('💬 Отзывы', 'menu:reviews')
    .text('👥 Клиенты', 'menu:customers')
    .row()
    .text('📧 Email рассылки', 'menu:emails')
    .text('⚙️ Настройки', 'menu:settings')
}

// Меню заказов
function getOrdersMenu() {
  return new InlineKeyboard()
    .text('📋 Все заказы', 'orders:all')
    .text('🆕 Новые', 'orders:new')
    .row()
    .text('⏳ В обработке', 'orders:processing')
    .text('🚚 Отправленные', 'orders:shipped')
    .row()
    .text('✅ Выполненные', 'orders:completed')
    .text('❌ Отмененные', 'orders:cancelled')
    .row()
    .text('🔍 Поиск заказа', 'orders:search')
    .text('📊 Статистика', 'orders:stats')
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
    .text('📸 Управление фото', 'products:photos')
    .text('🎬 Управление видео', 'products:videos')
    .row()
    .text('📦 Склад', 'products:stock')
    .text('💰 Цены', 'products:prices')
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
    .text('🔄 Изменить порядок', 'categories:reorder')
    .text('📊 Статистика', 'categories:stats')
    .row()
    .text('◀️ Назад', 'menu:main')
}

// Меню видео главной страницы
function getHomeVideosMenu() {
  return new InlineKeyboard()
    .text('📋 Список видео', 'home_videos:list')
    .text('➕ Добавить видео', 'home_videos:add')
    .row()
    .text('🗑️ Удалить видео', 'home_videos:delete')
    .text('🔄 Обновить', 'home_videos:refresh')
    .row()
    .text('◀️ Назад', 'menu:main')
}

// Меню видео страницы подписи
function getSignVideosMenu() {
  return new InlineKeyboard()
    .text('📋 Список видео', 'sign_videos:list')
    .text('➕ Добавить видео', 'sign_videos:add')
    .row()
    .text('🗑️ Удалить видео', 'sign_videos:delete')
    .text('🔄 Изменить порядок', 'sign_videos:reorder')
    .row()
    .text('◀️ Назад', 'menu:main')
}

// Функция создания бота с обработчиками
async function createBot() {
  const bot = new Bot<MyContext>(BOT_TOKEN)
  await bot.init()  // Инициализация бота
  const prisma = getPrismaClient()

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

  // Команда /menu
  bot.command('menu', async (ctx) => {
    if (!isAdmin(ctx.from?.id.toString() || '')) {
      await ctx.reply('❌ У вас нет доступа к этому боту.')
      return
    }

    await ctx.reply(
      '📋 *Главное меню*\\n\\nВыберите раздел:',
      { 
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    )
  })

  // Команда /help
  bot.command('help', async (ctx) => {
    if (!isAdmin(ctx.from?.id.toString() || '')) {
      await ctx.reply('❌ У вас нет доступа к этому боту.')
      return
    }

    await ctx.reply(
      '📖 *Помощь по боту*\\n\\n' +
      '*Основные команды:*\\n' +
      '/start - Запустить бота\\n' +
      '/menu - Главное меню\\n' +
      '/help - Эта справка\\n\\n' +
      '*Быстрые команды:*\\n' +
      '/orders - Список заказов\\n' +
      '/products - Список товаров\\n' +
      '/stats - Статистика\\n\\n' +
      '*Управление видео:*\\n' +
      '/home\\_videos - Видео главной\\n' +
      '/sign\\_videos - Видео подписи\\n\\n' +
      '*Поиск:*\\n' +
      '/order <номер> - Найти заказ\\n' +
      '/search <запрос> - Поиск',
      { parse_mode: 'Markdown' }
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

  // Обработка меню видео главной
  bot.callbackQuery('menu:home_videos', async (ctx) => {
    await ctx.editMessageText(
      '🎬 *Управление видео главной страницы*\\n\\nВыберите действие:',
      { 
        parse_mode: 'Markdown',
        reply_markup: getHomeVideosMenu()
      }
    )
  })

  // Обработка меню видео подписи
  bot.callbackQuery('menu:sign_videos', async (ctx) => {
    await ctx.editMessageText(
      '✍️ *Управление видео страницы подписи*\\n\\nВыберите действие:',
      { 
        parse_mode: 'Markdown',
        reply_markup: getSignVideosMenu()
      }
    )
  })

  // Список видео главной страницы
  bot.callbackQuery('home_videos:list', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '🔄 Загружаю видео...' })
    
    try {
      const response = await fetch(`${API_URL}/api/admin/site/home-videos`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_API_KEY}`
        }
      })
      const data = await response.json()
      
      if (data.videos && data.videos.length > 0) {
        let message = `🎬 *Видео главной страницы (${data.count} шт.)*\\n\\n`
        
        data.videos.forEach((video: any, index: number) => {
          message += `${index + 1}. ID: \`${video.id}\`\\n`
          message += `   🔗 URL: ${video.url}\\n`
          message += `   📅 Добавлено: ${new Date(video.createdAt).toLocaleDateString('ru-RU')}\\n\\n`
        })
        
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: getHomeVideosMenu()
        })
      } else {
        await ctx.editMessageText(
          '🎬 *Видео главной страницы*\\n\\n❌ Видео не найдены',
          { 
            parse_mode: 'Markdown',
            reply_markup: getHomeVideosMenu()
          }
        )
      }
    } catch (error) {
      console.error('❌ Error loading home videos:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке видео',
        { reply_markup: getHomeVideosMenu() }
      )
    }
  })

  // Список видео страницы подписи
  bot.callbackQuery('sign_videos:list', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '🔄 Загружаю видео...' })
    
    try {
      const response = await fetch(`${API_URL}/api/admin/site/sign-videos`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_API_KEY}`
        }
      })
      const data = await response.json()
      
      if (data.videos && data.videos.length > 0) {
        let message = `✍️ *Видео страницы подписи (${data.count} шт.)*\\n\\n`
        
        data.videos.forEach((video: any, index: number) => {
          message += `${index + 1}. ID: \`${video.id}\`\\n`
          if (video.title) {
            message += `   📝 Название: ${video.title}\\n`
          }
          message += `   🔗 URL: ${video.url}\\n`
          message += `   📅 Добавлено: ${new Date(video.createdAt).toLocaleDateString('ru-RU')}\\n\\n`
        })
        
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: getSignVideosMenu()
        })
      } else {
        await ctx.editMessageText(
          '✍️ *Видео страницы подписи*\\n\\n❌ Видео не найдены',
          { 
            parse_mode: 'Markdown',
            reply_markup: getSignVideosMenu()
          }
        )
      }
    } catch (error) {
      console.error('❌ Error loading sign videos:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке видео',
        { reply_markup: getSignVideosMenu() }
      )
    }
  })

  // Обработка статистики
  bot.callbackQuery('menu:stats', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '📊 Загружаю статистику...' })
    
    try {
      const [orderCount, productCount, customerCount, totalRevenue] = await Promise.all([
        prisma.order.count(),
        prisma.product.count(), 
        prisma.customer.count(),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: 'completed' }
        })
      ])

      const todayOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })

      let message = '📊 *Статистика магазина*\\n\\n'
      message += `📦 *Всего заказов:* ${orderCount}\\n`
      message += `📅 *Заказов сегодня:* ${todayOrders}\\n`
      message += `🛍 *Товаров в каталоге:* ${productCount}\\n`
      message += `👥 *Клиентов:* ${customerCount}\\n`
      message += `💰 *Общий доход:* ${totalRevenue._sum.total || 0} грн\\n`

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main')
      })
    } catch (error) {
      console.error('❌ Error fetching stats:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке статистики',
        { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
      )
    }
  })

  // Список всех заказов
  bot.callbackQuery('orders:all', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '📦 Загружаю заказы...' })
    
    try {
      const orders = await prisma.order.findMany({
        include: {
          customer: true,
          orderItems: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      if (orders.length === 0) {
        await ctx.editMessageText(
          '📦 *Заказы*\\n\\nЗаказов пока нет',
          {
            parse_mode: 'Markdown',
            reply_markup: getOrdersMenu()
          }
        )
        return
      }

      let message = '📦 *Последние заказы:*\\n\\n'
      const keyboard = new InlineKeyboard()

      for (const order of orders) {
        const status = order.status === 'pending' ? '⏳' : 
                      order.status === 'processing' ? '🔄' :
                      order.status === 'completed' ? '✅' : '❌'
        
        message += `${status} *#${order.id}* - ${order.customer?.name || 'Аноним'}\\n`
        message += `💰 ${order.total} грн | 📅 ${new Date(order.createdAt).toLocaleDateString('ru')}\\n\\n`
        
        keyboard.text(`Заказ #${order.id}`, `order:view:${order.id}`).row()
      }

      keyboard.text('◀️ Назад к меню', 'menu:orders')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error fetching orders:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке заказов',
        { reply_markup: getOrdersMenu() }
      )
    }
  })

  // Просмотр конкретного заказа
  bot.callbackQuery(/^order:view:(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match![1])
    await ctx.answerCallbackQuery({ text: '🔄 Загружаю заказ...' })
    
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderItems: {
            include: { product: true }
          }
        }
      })

      if (!order) {
        await ctx.answerCallbackQuery('Заказ не найден')
        return
      }

      let message = `📦 *Заказ #${order.id}*\\n\\n`
      message += `👤 *Клиент:* ${order.customer?.name || 'Аноним'}\\n`
      message += `📱 *Телефон:* ${order.customer?.phone || 'Не указан'}\\n`
      message += `📍 *Адрес:* ${order.shippingAddress || 'Не указан'}\\n`
      message += `💳 *Способ оплаты:* ${order.paymentMethod}\\n`
      message += `🚚 *Доставка:* ${order.shippingMethod}\\n`
      message += `📅 *Дата:* ${new Date(order.createdAt).toLocaleString('ru')}\\n`
      message += `💰 *Сумма:* ${order.total} грн\\n`
      message += `📊 *Статус:* ${
        order.status === 'pending' ? '⏳ Ожидает' :
        order.status === 'processing' ? '🔄 В обработке' :
        order.status === 'completed' ? '✅ Выполнен' : '❌ Отменён'
      }\\n\\n`

      message += '*Товары:*\\n'
      for (const item of order.orderItems) {
        message += `• ${item.product?.name || 'Товар удалён'} x${item.quantity} = ${item.price * item.quantity} грн\\n`
      }

      const keyboard = new InlineKeyboard()
      if (order.status === 'pending') {
        keyboard.text('🔄 В обработку', `order:process:${order.id}`).row()
      }
      if (order.status === 'processing') {
        keyboard.text('✅ Завершить', `order:complete:${order.id}`).row()
      }
      if (order.status !== 'cancelled' && order.status !== 'completed') {
        keyboard.text('❌ Отменить', `order:cancel:${order.id}`).row()
      }
      keyboard.text('◀️ К заказам', 'orders:all')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error viewing order:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке заказа',
        { reply_markup: new InlineKeyboard().text('◀️ К заказам', 'orders:all') }
      )
    }
  })

  // Обновление статуса заказа
  bot.callbackQuery(/^order:(process|complete|cancel):(\d+)$/, async (ctx) => {
    const action = ctx.match![1]
    const orderId = parseInt(ctx.match![2])
    
    try {
      const newStatus = action === 'process' ? 'processing' :
                       action === 'complete' ? 'completed' : 'cancelled'

      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        }
      })

      await ctx.answerCallbackQuery(
        action === 'process' ? '🔄 Заказ взят в обработку' :
        action === 'complete' ? '✅ Заказ выполнен' : '❌ Заказ отменён'
      )

      // Обновляем просмотр заказа
      const callbackData = `order:view:${orderId}`
      await ctx.editMessageReplyMarkup({
        reply_markup: new InlineKeyboard().text('🔄 Обновление...', 'loading')
      })
      
      // Симулируем нажатие для обновления
      ctx.match = [`order:view:${orderId}`, orderId.toString()]
      await bot.handleUpdate({ callback_query: { ...ctx.callbackQuery!, data: callbackData } })
    } catch (error) {
      console.error('❌ Error updating order:', error)
      await ctx.answerCallbackQuery('❌ Ошибка при обновлении заказа')
    }
  })

  // Список товаров
  bot.callbackQuery('products:list', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '🛍 Загружаю товары...' })
    
    try {
      const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { name: 'asc' },
        take: 20
      })

      if (products.length === 0) {
        await ctx.editMessageText(
          '🛍 *Товары*\\n\\nТоваров пока нет',
          {
            parse_mode: 'Markdown',
            reply_markup: getProductsMenu()
          }
        )
        return
      }

      let message = '🛍 *Список товаров:*\\n\\n'
      const keyboard = new InlineKeyboard()

      for (const product of products) {
        const status = product.active ? '✅' : '🚫'
        message += `${status} *${product.name}*\\n`
        message += `💰 ${product.price} грн | 📦 ${product.stock} шт\\n`
        message += `📂 ${product.category?.name || 'Без категории'}\\n\\n`
        
        if (products.indexOf(product) < 10) {
          keyboard.text(product.name.substring(0, 30), `product:view:${product.id}`).row()
        }
      }

      keyboard.text('◀️ Назад к меню', 'menu:products')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error fetching products:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке товаров',
        { reply_markup: getProductsMenu() }
      )
    }
  })

  // Просмотр товара
  bot.callbackQuery(/^product:view:(\d+)$/, async (ctx) => {
    const productId = parseInt(ctx.match![1])
    await ctx.answerCallbackQuery({ text: '🔄 Загружаю товар...' })
    
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
      })

      if (!product) {
        await ctx.answerCallbackQuery('Товар не найден')
        return
      }

      let message = `🛍 *${product.name}*\\n\\n`
      message += `📝 *Описание:* ${product.description || 'Не указано'}\\n`
      message += `💰 *Цена:* ${product.price} грн\\n`
      message += `📦 *На складе:* ${product.stock} шт\\n`
      message += `📂 *Категория:* ${product.category?.name || 'Без категории'}\\n`
      message += `🖼 *Изображения:* ${product.images.length || 0} шт\\n`
      message += `📊 *Статус:* ${product.active ? '✅ Активен' : '🚫 Неактивен'}\\n`
      message += `📅 *Добавлен:* ${new Date(product.createdAt).toLocaleDateString('ru')}\\n`

      const keyboard = new InlineKeyboard()
      keyboard.text(
        product.active ? '🚫 Деактивировать' : '✅ Активировать', 
        `product:toggle:${product.id}`
      ).row()
      keyboard.text('◀️ К товарам', 'products:list')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error viewing product:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке товара',
        { reply_markup: new InlineKeyboard().text('◀️ К товарам', 'products:list') }
      )
    }
  })

  // Переключение статуса товара
  bot.callbackQuery(/^product:toggle:(\d+)$/, async (ctx) => {
    const productId = parseInt(ctx.match![1])
    
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        await ctx.answerCallbackQuery('Товар не найден')
        return
      }

      await prisma.product.update({
        where: { id: productId },
        data: { active: !product.active }
      })

      await ctx.answerCallbackQuery(
        product.active ? '🚫 Товар деактивирован' : '✅ Товар активирован'
      )

      // Обновляем просмотр товара
      const callbackData = `product:view:${productId}`
      ctx.match = [`product:view:${productId}`, productId.toString()]
      await bot.handleUpdate({ callback_query: { ...ctx.callbackQuery!, data: callbackData } })
    } catch (error) {
      console.error('❌ Error toggling product:', error)
      await ctx.answerCallbackQuery('❌ Ошибка при изменении статуса')
    }
  })

  // Список категорий
  bot.callbackQuery('categories:list', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '🏷 Загружаю категории...' })
    
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      })

      let message = '🏷 *Категории товаров:*\\n\\n'
      const keyboard = new InlineKeyboard()

      if (categories.length === 0) {
        message += 'Категорий пока нет'
      } else {
        for (const category of categories) {
          message += `• *${category.name}* (${category._count.products} товаров)\\n`
          keyboard.text(category.name, `category:view:${category.id}`).row()
        }
      }

      keyboard.text('◀️ Назад к меню', 'menu:categories')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке категорий',
        { reply_markup: getCategoriesMenu() }
      )
    }
  })

  // Заказы по статусам
  bot.callbackQuery(/^orders:(new|processing|shipped|completed|cancelled)$/, async (ctx) => {
    const status = ctx.match![1]
    await ctx.answerCallbackQuery({ text: '🔄 Загружаю заказы...' })
    
    try {
      const orders = await prisma.order.findMany({
        where: { status },
        include: {
          customer: true,
          orderItems: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      const statusNames: Record<string, string> = {
        new: 'Новые',
        processing: 'В обработке',
        shipped: 'Отправленные',
        completed: 'Выполненные',
        cancelled: 'Отменённые'
      }

      if (orders.length === 0) {
        await ctx.editMessageText(
          `📦 *${statusNames[status]} заказы*\\n\\nЗаказов с таким статусом нет`,
          {
            parse_mode: 'Markdown',
            reply_markup: getOrdersMenu()
          }
        )
        return
      }

      let message = `📦 *${statusNames[status]} заказы:*\\n\\n`
      const keyboard = new InlineKeyboard()

      for (const order of orders) {
        message += `*#${order.id}* - ${order.customer?.name || 'Аноним'}\\n`
        message += `💰 ${order.total} грн | 📅 ${new Date(order.createdAt).toLocaleDateString('ru')}\\n\\n`
        
        keyboard.text(`Заказ #${order.id}`, `order:view:${order.id}`).row()
      }

      keyboard.text('◀️ Назад к заказам', 'menu:orders')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error fetching orders by status:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке заказов',
        { reply_markup: getOrdersMenu() }
      )
    }
  })

  // Быстрые команды
  bot.command('orders', async (ctx) => {
    if (!isAdmin(ctx.from?.id.toString() || '')) {
      await ctx.reply('❌ У вас нет доступа к этому боту.')
      return
    }

    const orders = await prisma.order.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    if (orders.length === 0) {
      await ctx.reply('📦 Заказов пока нет')
      return
    }

    let message = '📦 *Последние заказы:*\\n\\n'
    for (const order of orders) {
      const status = order.status === 'pending' ? '⏳' : 
                    order.status === 'processing' ? '🔄' :
                    order.status === 'completed' ? '✅' : '❌'
      
      message += `${status} *#${order.id}* - ${order.customer?.name || 'Аноним'}\\n`
      message += `💰 ${order.total} грн | 📅 ${new Date(order.createdAt).toLocaleDateString('ru')}\\n\\n`
    }

    await ctx.reply(message, { parse_mode: 'Markdown' })
  })

  bot.command('products', async (ctx) => {
    if (!isAdmin(ctx.from?.id.toString() || '')) {
      await ctx.reply('❌ У вас нет доступа к этому боту.')
      return
    }

    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      take: 10
    })

    if (products.length === 0) {
      await ctx.reply('🛍 Активных товаров пока нет')
      return
    }

    let message = '🛍 *Активные товары:*\\n\\n'
    for (const product of products) {
      message += `• *${product.name}*\\n`
      message += `  💰 ${product.price} грн | 📦 ${product.stock} шт\\n\\n`
    }

    await ctx.reply(message, { parse_mode: 'Markdown' })
  })

  bot.command('stats', async (ctx) => {
    if (!isAdmin(ctx.from?.id.toString() || '')) {
      await ctx.reply('❌ У вас нет доступа к этому боту.')
      return
    }

    const [orderCount, productCount, customerCount] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.customer.count()
    ])

    const message = `📊 *Статистика:*\\n\\n` +
                   `📦 Заказов: ${orderCount}\\n` +
                   `🛍 Товаров: ${productCount}\\n` +
                   `👥 Клиентов: ${customerCount}`

    await ctx.reply(message, { parse_mode: 'Markdown' })
  })

  // Меню клиентов
  bot.callbackQuery('menu:customers', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '👥 Загружаю клиентов...' })
    
    try {
      const [totalCustomers, recentCustomers] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.findMany({
          include: {
            _count: {
              select: { orders: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ])

      let message = `👥 *Клиенты (${totalCustomers} чел.)*\\n\\n`
      const keyboard = new InlineKeyboard()

      if (recentCustomers.length === 0) {
        message += 'Клиентов пока нет'
      } else {
        message += '*Последние клиенты:*\\n\\n'
        for (const customer of recentCustomers) {
          message += `• *${customer.name}*\\n`
          message += `  📱 ${customer.phone || 'Нет телефона'}\\n`
          message += `  📦 Заказов: ${customer._count.orders}\\n\\n`
          
          keyboard.text(customer.name, `customer:view:${customer.id}`).row()
        }
      }

      keyboard
        .text('🔍 Поиск клиента', 'customers:search').row()
        .text('📊 Статистика клиентов', 'customers:stats').row()
        .text('◀️ Назад', 'menu:main')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке клиентов',
        { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
      )
    }
  })

  // Просмотр клиента
  bot.callbackQuery(/^customer:view:(\d+)$/, async (ctx) => {
    const customerId = parseInt(ctx.match![1])
    await ctx.answerCallbackQuery({ text: '🔄 Загружаю информацию...' })
    
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: { orders: true }
          }
        }
      })

      if (!customer) {
        await ctx.answerCallbackQuery('Клиент не найден')
        return
      }

      let message = `👤 *${customer.name}*\\n\\n`
      message += `📱 *Телефон:* ${customer.phone || 'Не указан'}\\n`
      message += `📧 *Email:* ${customer.email || 'Не указан'}\\n`
      message += `📍 *Адрес:* ${customer.address || 'Не указан'}\\n`
      message += `📅 *Регистрация:* ${new Date(customer.createdAt).toLocaleDateString('ru')}\\n`
      message += `📦 *Всего заказов:* ${customer._count.orders}\\n\\n`

      if (customer.orders.length > 0) {
        message += '*Последние заказы:*\\n'
        for (const order of customer.orders) {
          const status = order.status === 'pending' ? '⏳' : 
                        order.status === 'processing' ? '🔄' :
                        order.status === 'completed' ? '✅' : '❌'
          message += `${status} #${order.id} - ${order.total} грн (${new Date(order.createdAt).toLocaleDateString('ru')})\\n`
        }
      }

      const keyboard = new InlineKeyboard()
        .text('📦 Все заказы клиента', `customer:orders:${customer.id}`).row()
        .text('✏️ Редактировать', `customer:edit:${customer.id}`).row()
        .text('◀️ К клиентам', 'menu:customers')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error viewing customer:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке клиента',
        { reply_markup: new InlineKeyboard().text('◀️ К клиентам', 'menu:customers') }
      )
    }
  })

  // Меню отзывов
  bot.callbackQuery('menu:reviews', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '💬 Загружаю отзывы...' })
    
    try {
      const [totalReviews, pendingReviews, recentReviews] = await Promise.all([
        prisma.review.count(),
        prisma.review.count({ where: { approved: false } }),
        prisma.review.findMany({
          include: {
            product: true,
            customer: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ])

      let message = `💬 *Отзывы (${totalReviews} шт.)*\\n`
      message += `⏳ *Ожидают модерации:* ${pendingReviews}\\n\\n`
      
      const keyboard = new InlineKeyboard()

      if (recentReviews.length > 0) {
        message += '*Последние отзывы:*\\n\\n'
        for (const review of recentReviews) {
          const stars = '⭐'.repeat(review.rating)
          const status = review.approved ? '✅' : '⏳'
          message += `${status} ${stars} от *${review.customer?.name || 'Аноним'}*\\n`
          message += `📦 ${review.product?.name || 'Товар удалён'}\\n`
          message += `💬 ${review.comment.substring(0, 50)}...\\n\\n`
          
          keyboard.text(`Отзыв #${review.id}`, `review:view:${review.id}`).row()
        }
      } else {
        message += 'Отзывов пока нет'
      }

      keyboard
        .text('⏳ На модерации', 'reviews:pending').row()
        .text('✅ Одобренные', 'reviews:approved').row()
        .text('📊 Статистика', 'reviews:stats').row()
        .text('◀️ Назад', 'menu:main')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error fetching reviews:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке отзывов',
        { reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:main') }
      )
    }
  })

  // Просмотр отзыва
  bot.callbackQuery(/^review:view:(\d+)$/, async (ctx) => {
    const reviewId = parseInt(ctx.match![1])
    await ctx.answerCallbackQuery({ text: '🔄 Загружаю отзыв...' })
    
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          product: true,
          customer: true
        }
      })

      if (!review) {
        await ctx.answerCallbackQuery('Отзыв не найден')
        return
      }

      const stars = '⭐'.repeat(review.rating)
      let message = `💬 *Отзыв #${review.id}*\\n\\n`
      message += `${stars} *${review.rating}/5*\\n\\n`
      message += `👤 *От:* ${review.customer?.name || 'Аноним'}\\n`
      message += `📦 *Товар:* ${review.product?.name || 'Товар удалён'}\\n`
      message += `📅 *Дата:* ${new Date(review.createdAt).toLocaleDateString('ru')}\\n`
      message += `📊 *Статус:* ${review.approved ? '✅ Одобрен' : '⏳ На модерации'}\\n\\n`
      message += `*Текст отзыва:*\\n${review.comment}`

      const keyboard = new InlineKeyboard()
      if (!review.approved) {
        keyboard.text('✅ Одобрить', `review:approve:${review.id}`).row()
      }
      keyboard
        .text('🗑 Удалить', `review:delete:${review.id}`).row()
        .text('◀️ К отзывам', 'menu:reviews')

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } catch (error) {
      console.error('❌ Error viewing review:', error)
      await ctx.editMessageText(
        '❌ Ошибка при загрузке отзыва',
        { reply_markup: new InlineKeyboard().text('◀️ К отзывам', 'menu:reviews') }
      )
    }
  })

  // Одобрение отзыва
  bot.callbackQuery(/^review:approve:(\d+)$/, async (ctx) => {
    const reviewId = parseInt(ctx.match![1])
    
    try {
      await prisma.review.update({
        where: { id: reviewId },
        data: { approved: true }
      })

      await ctx.answerCallbackQuery('✅ Отзыв одобрен')

      // Обновляем просмотр отзыва
      ctx.match = [`review:view:${reviewId}`, reviewId.toString()]
      await bot.handleUpdate({ callback_query: { ...ctx.callbackQuery!, data: `review:view:${reviewId}` } })
    } catch (error) {
      console.error('❌ Error approving review:', error)
      await ctx.answerCallbackQuery('❌ Ошибка при одобрении отзыва')
    }
  })

  // Удаление отзыва
  bot.callbackQuery(/^review:delete:(\d+)$/, async (ctx) => {
    const reviewId = parseInt(ctx.match![1])
    
    try {
      await prisma.review.delete({
        where: { id: reviewId }
      })

      await ctx.answerCallbackQuery('🗑 Отзыв удалён')
      await ctx.callbackQuery('menu:reviews')
    } catch (error) {
      console.error('❌ Error deleting review:', error)
      await ctx.answerCallbackQuery('❌ Ошибка при удалении отзыва')
    }
  })

  // Меню email рассылок
  bot.callbackQuery('menu:emails', async (ctx) => {
    await ctx.editMessageText(
      '📧 *Email рассылки*\\n\\n' +
      'Функционал email рассылок:\\n' +
      '• Автоматические уведомления о заказах\\n' +
      '• Рассылки новостей и акций\\n' +
      '• Персонализированные предложения\\n\\n' +
      '_Для настройки используйте веб-интерфейс_',
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📊 Статистика рассылок', 'emails:stats').row()
          .text('📋 История рассылок', 'emails:history').row()
          .text('◀️ Назад', 'menu:main')
      }
    )
  })

  // Меню настроек
  bot.callbackQuery('menu:settings', async (ctx) => {
    await ctx.editMessageText(
      '⚙️ *Настройки*\\n\\n' +
      'Доступные настройки:\\n' +
      '• Управление администраторами\\n' +
      '• Настройки оплаты и доставки\\n' +
      '• Интеграции с сервисами\\n' +
      '• SEO и метаданные\\n\\n' +
      '_Используйте веб-интерфейс для детальной настройки_',
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('👥 Администраторы', 'settings:admins').row()
          .text('🔧 Системная информация', 'settings:info').row()
          .text('◀️ Назад', 'menu:main')
      }
    )
  })

  // Системная информация
  bot.callbackQuery('settings:info', async (ctx) => {
    const [orderCount, productCount, customerCount] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.customer.count()
    ])

    const message = `🔧 *Системная информация*\\n\\n` +
                   `🤖 *Бот:* VobVorot CRM v2.0\\n` +
                   `🌐 *Сайт:* vobvorot.com\\n` +
                   `💾 *База данных:* PostgreSQL\\n` +
                   `🚀 *Платформа:* Vercel\\n\\n` +
                   `*Статистика БД:*\\n` +
                   `📦 Заказов: ${orderCount}\\n` +
                   `🛍 Товаров: ${productCount}\\n` +
                   `👥 Клиентов: ${customerCount}\\n\\n` +
                   `*Администраторы:*\\n${ADMIN_IDS.map(id => `• ID: ${id}`).join('\\n')}`

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('◀️ Назад', 'menu:settings')
    })
  })

  // Обработка неизвестных команд
  bot.on('message', async (ctx) => {
    if (!isAdmin(ctx.from?.id.toString() || '')) {
      return
    }

    await ctx.reply(
      '❓ Неизвестная команда\\n\\n' +
      'Используйте /help для списка команд или /menu для главного меню',
      { parse_mode: 'Markdown' }
    )
  })

  // Обработка ошибок
  bot.catch((err) => {
    const ctx = err.ctx
    console.error('❌ Bot error:', err.error)
  })
  
  return bot
}

// Webhook handler
export async function POST(request: NextRequest) {
  console.log('🚀 [HYBRID-CRM] POST request received')
  
  try {
    // Проверяем секретный токен для безопасности
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET || 'vobvorot_webhook_secret_2025'
    
    if (expectedToken && secretToken !== expectedToken) {
      console.log('❌ [HYBRID-CRM] Unauthorized webhook attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const update = await request.json()
    console.log('📨 [HYBRID-CRM] Update:', JSON.stringify(update, null, 2))
    
    // Проверяем, что это от админа
    if (update.message?.from?.id || update.callback_query?.from?.id) {
      const userId = update.message?.from?.id || update.callback_query?.from?.id
      if (!isAdmin(userId.toString())) {
        console.log('❌ [HYBRID-CRM] Unauthorized user:', userId)
        return NextResponse.json({ ok: true })
      }
    }
    
    // Создаем бота для обработки запроса
    const bot = await createBot()
    await bot.handleUpdate(update)
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('💥 [HYBRID-CRM] Error:', error)
    
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
      const webhookUrl = 'https://vobvorot.com/api/telegram/hybrid-crm'
      const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || 'vobvorot_webhook_secret_2025'
      
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
      console.log('🎯 [HYBRID-CRM] Webhook set result:', result)
      
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
        status: 'Hybrid CRM webhook ready',
        bot_token: BOT_TOKEN.substring(0, 10) + '...',
        admin_ids: ADMIN_IDS,
        features: {
          orders: 'Full order management',
          products: 'Product CRUD operations',
          categories: 'Category management',
          videos: 'Home & Sign page videos',
          customers: 'Customer CRM',
          reviews: 'Review management',
          statistics: 'Analytics & reports',
          emails: 'Email campaigns',
          settings: 'Site configuration'
        },
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('[HYBRID-CRM] Webhook error', error)
    return NextResponse.json(
      { error: 'Failed to manage webhook' }, 
      { status: 500 }
    )
  }
}