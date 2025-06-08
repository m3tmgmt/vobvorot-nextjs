import { Bot, Context, session, GrammyError, HttpError } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { Menu } from '@grammyjs/menu'

// Типы для контекста
interface SessionData {
  step?: string
  productData?: any
  orderFilter?: string
}

type MyContext = Context & {
  session: SessionData
  conversation: any
}

// Инициализация бота
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!)

// Сессии и конверсации
bot.use(session({ initial: (): SessionData => ({}) }))
bot.use(conversations())

// Проверка авторизации владельца
const OWNER_CHAT_ID = process.env.OWNER_TELEGRAM_ID || '1234567890'

function isOwner(ctx: MyContext): boolean {
  return ctx.from?.id.toString() === OWNER_CHAT_ID
}

// Главное меню
const mainMenu = new Menu<MyContext>('main-menu')
  .text('📦 Заказы', (ctx) => ctx.conversation.enter('manageOrders'))
  .text('🛍️ Товары', (ctx) => ctx.conversation.enter('manageProducts'))
  .row()
  .text('📊 Статистика', (ctx) => ctx.conversation.enter('viewStats'))
  .text('⚙️ Настройки', (ctx) => ctx.conversation.enter('settings'))
  .row()
  .text('💬 Отзывы', (ctx) => ctx.conversation.enter('manageReviews'))
  .text('👥 Клиенты', (ctx) => ctx.conversation.enter('manageCustomers'))

bot.use(mainMenu)

// Старт бота
bot.command('start', async (ctx) => {
  if (!isOwner(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }

  await ctx.reply(
    '🚀 *EXVICPMOUR Store Management*\n\n' +
    'Добро пожаловать в систему управления магазином!\n' +
    'Выберите раздел для работы:',
    { 
      parse_mode: 'Markdown',
      reply_markup: mainMenu
    }
  )
})

// Конверсация для управления заказами
async function manageOrders(conversation: any, ctx: MyContext) {
  await ctx.reply('📦 *Управление заказами*', { parse_mode: 'Markdown' })
  
  const ordersMenu = new Menu<MyContext>('orders-menu')
    .text('🆕 Новые заказы', async (ctx) => {
      await showOrders(ctx, 'pending')
    })
    .text('🔄 В обработке', async (ctx) => {
      await showOrders(ctx, 'processing')
    })
    .row()
    .text('📦 Отправленные', async (ctx) => {
      await showOrders(ctx, 'shipped')
    })
    .text('✅ Завершенные', async (ctx) => {
      await showOrders(ctx, 'completed')
    })
    .row()
    .text('🔍 Поиск заказа', async (ctx) => {
      await ctx.reply('Введите номер заказа или email клиента:')
      const response = await conversation.wait()
      await searchOrder(ctx, response.message?.text || '')
    })
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: ordersMenu })
}

// Конверсация для управления товарами
async function manageProducts(conversation: any, ctx: MyContext) {
  await ctx.reply('🛍️ *Управление товарами*', { parse_mode: 'Markdown' })
  
  const productsMenu = new Menu<MyContext>('products-menu')
    .text('➕ Добавить товар', async (ctx) => {
      await ctx.conversation.enter('addProduct')
    })
    .text('📝 Редактировать', async (ctx) => {
      await showProductsList(ctx, 'edit')
    })
    .row()
    .text('📸 Загрузить фото', async (ctx) => {
      await showProductsList(ctx, 'photos')
    })
    .text('💰 Изменить цены', async (ctx) => {
      await showProductsList(ctx, 'prices')
    })
    .row()
    .text('📊 Остатки товаров', async (ctx) => {
      await showInventory(ctx)
    })
    .text('🗑️ Удалить товар', async (ctx) => {
      await showProductsList(ctx, 'delete')
    })
    .row()
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: productsMenu })
}

// Конверсация для добавления нового товара
async function addProduct(conversation: any, ctx: MyContext) {
  await ctx.reply('➕ *Добавление нового товара*\n\nВведите название товара:', { parse_mode: 'Markdown' })
  
  const productData: any = {}
  
  // Название
  const nameResponse = await conversation.wait()
  productData.name = nameResponse.message?.text
  
  // Описание
  await ctx.reply('Введите описание товара:')
  const descResponse = await conversation.wait()
  productData.description = descResponse.message?.text
  
  // Бренд
  await ctx.reply('Введите бренд (или пропустите, отправив "-"):')
  const brandResponse = await conversation.wait()
  productData.brand = brandResponse.message?.text === '-' ? null : brandResponse.message?.text
  
  // Категория
  const categories = await getCategories()
  const categoryText = categories.map((cat: any, index: number) => `${index + 1}. ${cat.name}`).join('\n')
  await ctx.reply(`Выберите категорию:\n${categoryText}\n\nВведите номер:`)
  
  const catResponse = await conversation.wait()
  const catIndex = parseInt(catResponse.message?.text || '1') - 1
  productData.categoryId = categories[catIndex]?.id
  
  // Цена
  await ctx.reply('Введите цену в долларах (например: 29.99):')
  const priceResponse = await conversation.wait()
  productData.price = parseFloat(priceResponse.message?.text || '0')
  
  // Количество
  await ctx.reply('Введите количество на складе:')
  const stockResponse = await conversation.wait()
  productData.stock = parseInt(stockResponse.message?.text || '0')
  
  // Размеры (опционально)
  await ctx.reply('Введите доступные размеры через запятую (или пропустите, отправив "-"):')
  const sizesResponse = await conversation.wait()
  productData.sizes = sizesResponse.message?.text === '-' ? [] : sizesResponse.message?.text?.split(',').map((s: string) => s.trim())
  
  // Сохранение товара
  try {
    const newProduct = await createProduct(productData)
    await ctx.reply(`✅ Товар успешно добавлен!\n\n📦 *${newProduct.name}*\n💰 $${newProduct.price}\n📦 Количество: ${newProduct.stock}`, { parse_mode: 'Markdown' })
    
    // Предложение загрузить фото
    await ctx.reply('📸 Хотите загрузить фото для этого товара? Отправьте изображения или нажмите /skip')
    
    let photoCount = 0
    while (true) {
      const response = await conversation.wait()
      
      if (response.message?.text === '/skip') break
      
      if (response.message?.photo) {
        const photo = response.message.photo[response.message.photo.length - 1]
        await uploadProductPhoto(newProduct.id, photo.file_id)
        photoCount++
        await ctx.reply(`✅ Фото ${photoCount} загружено! Отправьте еще или /skip для завершения`)
      } else {
        await ctx.reply('❌ Пожалуйста, отправьте изображение или /skip')
      }
    }
    
    await ctx.reply(`🎉 Товар полностью настроен! Загружено ${photoCount} фото.`, { reply_markup: mainMenu })
    
  } catch (error) {
    await ctx.reply(`❌ Ошибка при создании товара: ${error}`)
  }
}

// Конверсация для просмотра статистики
async function viewStats(conversation: any, ctx: MyContext) {
  await ctx.reply('📊 *Статистика магазина*', { parse_mode: 'Markdown' })
  
  const statsMenu = new Menu<MyContext>('stats-menu')
    .text('📈 Продажи', async (ctx) => {
      const stats = await getSalesStats()
      await ctx.reply(formatSalesStats(stats), { parse_mode: 'Markdown' })
    })
    .text('🛍️ Товары', async (ctx) => {
      const stats = await getProductStats()
      await ctx.reply(formatProductStats(stats), { parse_mode: 'Markdown' })
    })
    .row()
    .text('👥 Клиенты', async (ctx) => {
      const stats = await getCustomerStats()
      await ctx.reply(formatCustomerStats(stats), { parse_mode: 'Markdown' })
    })
    .text('💰 Доходы', async (ctx) => {
      const stats = await getRevenueStats()
      await ctx.reply(formatRevenueStats(stats), { parse_mode: 'Markdown' })
    })
    .row()
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: statsMenu })
}

// Регистрация конверсаций
bot.use(createConversation(manageOrders))
bot.use(createConversation(manageProducts))
bot.use(createConversation(addProduct))
bot.use(createConversation(viewStats))

// Обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx
  console.error(`Error while handling update ${ctx.update.update_id}:`)
  const e = err.error
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description)
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e)
  } else {
    console.error('Unknown error:', e)
  }
})

// Вспомогательные функции (заглушки для API)
async function showOrders(ctx: MyContext, status: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/orders?status=${status}`, {
      headers: { 'Authorization': `Bearer ${process.env.ADMIN_API_KEY}` }
    })
    const orders = await response.json()
    
    if (orders.length === 0) {
      await ctx.reply(`📭 Нет заказов со статусом "${status}"`)
      return
    }
    
    for (const order of orders.slice(0, 5)) {
      const orderText = formatOrderInfo(order)
      const orderMenu = createOrderMenu(order.id)
      await ctx.reply(orderText, { parse_mode: 'Markdown', reply_markup: orderMenu })
    }
  } catch (error) {
    await ctx.reply('❌ Ошибка при загрузке заказов')
  }
}

async function searchOrder(ctx: MyContext, query: string) {
  // Поиск заказа по номеру или email
  await ctx.reply(`🔍 Поиск заказа: "${query}"`)
}

async function showProductsList(ctx: MyContext, action: string) {
  // Показать список товаров для выбранного действия
  await ctx.reply(`📋 Выберите товар для действия: ${action}`)
}

async function showInventory(ctx: MyContext) {
  // Показать остатки товаров
  await ctx.reply('📊 *Остатки товаров*', { parse_mode: 'Markdown' })
}

async function getCategories() {
  // Получить категории из API
  return [
    { id: '1', name: 'Cameras' },
    { id: '2', name: 'Fashion' },
    { id: '3', name: 'Accessories' }
  ]
}

async function createProduct(productData: any) {
  // Создать товар через API
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/products`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify(productData)
  })
  return response.json()
}

async function uploadProductPhoto(productId: string, fileId: string) {
  // Загрузить фото товара
  return true
}

async function getSalesStats() {
  // Получить статистику продаж
  return {}
}

async function getProductStats() {
  // Получить статистику товаров
  return {}
}

async function getCustomerStats() {
  // Получить статистику клиентов
  return {}
}

async function getRevenueStats() {
  // Получить статистику доходов
  return {}
}

function formatOrderInfo(order: any): string {
  return `📦 *Заказ #${order.id}*\n💰 $${order.total}\n👤 ${order.customerName}\n📅 ${order.createdAt}`
}

function formatSalesStats(stats: any): string {
  return '📈 *Статистика продаж*\n\nЗагружается...'
}

function formatProductStats(stats: any): string {
  return '🛍️ *Статистика товаров*\n\nЗагружается...'
}

function formatCustomerStats(stats: any): string {
  return '👥 *Статистика клиентов*\n\nЗагружается...'
}

function formatRevenueStats(stats: any): string {
  return '💰 *Статистика доходов*\n\nЗагружается...'
}

function createOrderMenu(orderId: string) {
  return new Menu<MyContext>(`order-${orderId}`)
    .text('✅ Подтвердить', (ctx) => updateOrderStatus(ctx, orderId, 'confirmed'))
    .text('📦 Отправить', (ctx) => updateOrderStatus(ctx, orderId, 'shipped'))
    .row()
    .text('❌ Отменить', (ctx) => updateOrderStatus(ctx, orderId, 'cancelled'))
    .text('👁️ Детали', (ctx) => showOrderDetails(ctx, orderId))
}

async function updateOrderStatus(ctx: MyContext, orderId: string, status: string) {
  await ctx.reply(`✅ Статус заказа #${orderId} изменен на "${status}"`)
}

async function showOrderDetails(ctx: MyContext, orderId: string) {
  await ctx.reply(`📋 Детали заказа #${orderId}`)
}

export { bot }