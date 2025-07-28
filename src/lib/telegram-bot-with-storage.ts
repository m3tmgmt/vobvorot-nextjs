import { Bot, Context, session, GrammyError, HttpError } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { Menu } from '@grammyjs/menu'
import { PsqlAdapter } from '@grammyjs/storage-psql'
import { cloudinaryService } from './cloudinary'

// Типы для контекста
interface SessionData {
  step?: string
  productData?: any
  orderFilter?: string
  refundOrderId?: string
  refundReason?: string
  maxRefundAmount?: number
  editingProductId?: string
}

type MyContext = Context & {
  session: SessionData
  conversation: any
}

// Проверка обязательных переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.split(',') || []
const DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL

console.log('🤖 [BOT-STORAGE] Initializing bot with PostgreSQL storage...')
console.log('🗄️ [BOT-STORAGE] Database URL exists:', !!DATABASE_URL)
console.log('🔑 [BOT-STORAGE] Token exists:', !!BOT_TOKEN)
console.log('👤 [BOT-STORAGE] Admin IDs:', ADMIN_IDS)

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in environment variables')
}

if (!ADMIN_IDS.length) {
  throw new Error('TELEGRAM_OWNER_CHAT_ID is required in environment variables')
}

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required for session storage')
}

// Инициализация бота
const bot = new Bot<MyContext>(BOT_TOKEN)

// Флаг инициализации
let isInitialized = false

// Настройка PostgreSQL адаптера для сессий
async function setupSessionStorage() {
  if (isInitialized) return
  
  try {
    console.log('🔄 [BOT-STORAGE] Setting up PostgreSQL session storage...')
    
    const storage = await PsqlAdapter.create({
      connectionString: DATABASE_URL,
      tableName: 'telegram_sessions' // Таблица для хранения сессий
    })
    
    console.log('✅ [BOT-STORAGE] PostgreSQL storage initialized')
    
    // Используем PostgreSQL для хранения сессий
    bot.use(session({ 
      storage,
      initial: (): SessionData => ({})
    }))
    
    // Теперь можем использовать conversations
    bot.use(conversations())
    
    console.log('✅ [BOT-STORAGE] Sessions and conversations middleware added')
    
    isInitialized = true
    
  } catch (error) {
    console.error('❌ [BOT-STORAGE] Failed to setup PostgreSQL storage:', error)
    throw error
  }
}

function isAdmin(ctx: MyContext): boolean {
  return ADMIN_IDS.includes(ctx.from?.id.toString() || '')
}

// Главное меню
const mainMenu = new Menu<MyContext>('main-menu')
  .text('📦 Заказы', (ctx) => ctx.conversation.enter('manageOrders'))
  .text('🛍️ Товары', (ctx) => ctx.conversation.enter('manageProducts'))
  .row()
  .text('🏷️ Категории', (ctx) => ctx.conversation.enter('manageCategories'))
  .text('📊 Статистика', (ctx) => ctx.conversation.enter('viewStats'))
  .row()
  .text('🎬 Видео главной', (ctx) => ctx.conversation.enter('manageHomeVideo'))
  .text('✍️ Видео подписи', (ctx) => ctx.conversation.enter('manageSignVideos'))
  .row()
  .text('💬 Отзывы', (ctx) => ctx.conversation.enter('manageReviews'))
  .text('👥 Клиенты', (ctx) => ctx.conversation.enter('manageCustomers'))

// Функция для инициализации всех middleware и команд
async function initializeBot() {
  if (!isInitialized) {
    await setupSessionStorage()
    
    // Регистрируем меню после инициализации sessions
    bot.use(mainMenu)
    
    // Регистрируем conversations
    bot.use(createConversation(manageOrders))
    bot.use(createConversation(manageProducts))
    bot.use(createConversation(manageCategories))
    bot.use(createConversation(viewStats))
    bot.use(createConversation(manageHomeVideo))
    bot.use(createConversation(manageSignVideos))
    bot.use(createConversation(manageReviews))
    bot.use(createConversation(manageCustomers))
  }
}

// Старт бота
bot.command('start', async (ctx) => {
  console.log('🎯 [BOT-STORAGE] /start command received from:', ctx.from?.id)
  
  // Инициализируем если еще не инициализировано
  await initializeBot()
  
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
      reply_markup: mainMenu
    }
  )
})

// Простая команда для тестирования
bot.command('test', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }
  
  // Тестируем сессию
  if (!ctx.session.step) {
    ctx.session.step = 'test_started'
    await ctx.reply('✅ Тест начат! Сессия работает. Отправьте /test еще раз.')
  } else {
    await ctx.reply(`✅ Сессия сохранена! Предыдущее состояние: ${ctx.session.step}`)
    ctx.session.step = undefined
  }
})

// Обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx
  console.error('❌ [BOT-STORAGE] Error while handling update', ctx.update.update_id, ':')
  const e = err.error
  
  if (e instanceof GrammyError) {
    console.error('❌ [BOT-STORAGE] Error in request:', e.description)
  } else if (e instanceof HttpError) {
    console.error('❌ [BOT-STORAGE] Could not contact Telegram:', e)
  } else {
    console.error('❌ [BOT-STORAGE] Unknown error:', e)
  }
})

// Добавляем базовые conversations для тестирования
bot.use(createConversation(async function manageOrders(conversation: any, ctx: MyContext) {
  await ctx.reply('📦 *Управление заказами*\n\nВыберите действие:', { parse_mode: 'Markdown' })
  
  const ordersMenu = new Menu<MyContext>('orders-menu')
    .text('📋 Все заказы', async (ctx) => {
      await ctx.reply('🔄 Загружаю список заказов...')
      // TODO: Добавить загрузку заказов
    })
    .text('⏳ Ожидающие', async (ctx) => {
      await ctx.reply('🔄 Загружаю ожидающие заказы...')
      // TODO: Добавить фильтрацию
    })
    .row()
    .text('◀️ Назад', async (ctx) => {
      await ctx.reply('Главное меню:', { reply_markup: mainMenu })
      return ctx.conversation.exit()
    })
  
  await ctx.reply('Выберите опцию:', { reply_markup: ordersMenu })
}))

bot.use(createConversation(async function manageProducts(conversation: any, ctx: MyContext) {
  await ctx.reply('🛍️ *Управление товарами*\n\nВыберите действие:', { parse_mode: 'Markdown' })
  
  const productsMenu = new Menu<MyContext>('products-menu')
    .text('➕ Добавить товар', async (ctx) => {
      await ctx.reply('🔄 Начинаем добавление товара...')
      // TODO: Добавить создание товара
    })
    .text('📋 Список товаров', async (ctx) => {
      await ctx.reply('🔄 Загружаю список товаров...')
      // TODO: Добавить список
    })
    .row()
    .text('◀️ Назад', async (ctx) => {
      await ctx.reply('Главное меню:', { reply_markup: mainMenu })
      return ctx.conversation.exit()
    })
  
  await ctx.reply('Выберите опцию:', { reply_markup: productsMenu })
}))

// Заглушки для остальных conversations
bot.use(createConversation(async function manageCategories(conversation: any, ctx: MyContext) {
  await ctx.reply('🏷️ Управление категориями - в разработке')
  await ctx.reply('Главное меню:', { reply_markup: mainMenu })
}))

bot.use(createConversation(async function viewStats(conversation: any, ctx: MyContext) {
  await ctx.reply('📊 Статистика - в разработке')
  await ctx.reply('Главное меню:', { reply_markup: mainMenu })
}))

bot.use(createConversation(async function manageHomeVideo(conversation: any, ctx: MyContext) {
  await ctx.reply('🎬 Видео главной - в разработке')
  await ctx.reply('Главное меню:', { reply_markup: mainMenu })
}))

bot.use(createConversation(async function manageSignVideos(conversation: any, ctx: MyContext) {
  await ctx.reply('✍️ Видео подписи - в разработке')
  await ctx.reply('Главное меню:', { reply_markup: mainMenu })
}))

bot.use(createConversation(async function manageReviews(conversation: any, ctx: MyContext) {
  await ctx.reply('💬 Отзывы - в разработке')
  await ctx.reply('Главное меню:', { reply_markup: mainMenu })
}))

bot.use(createConversation(async function manageCustomers(conversation: any, ctx: MyContext) {
  await ctx.reply('👥 Клиенты - в разработке')
  await ctx.reply('Главное меню:', { reply_markup: mainMenu })
}))

console.log('✅ [BOT-STORAGE] Bot with PostgreSQL storage initialized successfully')

export { bot }