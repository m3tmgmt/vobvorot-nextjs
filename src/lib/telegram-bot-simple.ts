import { Bot } from 'grammy'

// Проверяем переменные окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.trim().split(',').map(id => id.trim()) || []

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required')
}

console.log('🤖 Simple VobvorotAdminBot initializing...')
console.log(`🔑 Bot token exists: ${!!BOT_TOKEN}`)
console.log(`📋 Admin IDs: ${ADMIN_IDS.join(', ')}`)

// Создаем простого бота
export const bot = new Bot(BOT_TOKEN)

// Проверка прав администратора
function isAdmin(userId: number): boolean {
  const isAdminUser = ADMIN_IDS.includes(userId.toString())
  console.log(`🔐 Checking admin rights for user ${userId}: ${isAdminUser}`)
  return isAdminUser
}

// Команда /start
bot.command('start', async (ctx) => {
  try {
    console.log(`📱 Received /start from user ${ctx.from?.id}`)
    
    if (!ctx.from) {
      console.log('❌ No user data in context')
      return
    }
    
    if (!isAdmin(ctx.from.id)) {
      console.log(`❌ Access denied for user ${ctx.from.id}`)
      await ctx.reply('❌ У вас нет доступа к этому боту')
      return
    }

    console.log(`✅ Sending welcome message to admin ${ctx.from.id}`)
    await ctx.reply(`
🤖 VobvorotAdminBot работает!

✅ Бот успешно инициализирован
✅ Вы авторизованы как администратор
✅ Токен бота обновлен

Полная версия бота будет включена после тестирования.
    `)
    
    console.log(`✅ Welcome message sent successfully`)
  } catch (error) {
    console.error('❌ Error in /start command:', error)
    try {
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
    } catch (replyError) {
      console.error('❌ Failed to send error message:', replyError)
    }
  }
})

// Обработка всех сообщений
bot.on('message', async (ctx) => {
  try {
    console.log(`📨 Received message from user ${ctx.from?.id}: ${ctx.message?.text}`)
    
    if (!ctx.from) return
    
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этому боту')
      return
    }

    if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
      await ctx.reply('👋 Привет! Используйте команду /start для начала работы.')
    }
  } catch (error) {
    console.error('❌ Error handling message:', error)
  }
})

console.log('✅ Simple VobvorotAdminBot initialized successfully')