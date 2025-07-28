import { Bot, Context, GrammyError, HttpError } from 'grammy'

// Минимальная версия бота для тестирования

// Проверка обязательных переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.split(',') || []

console.log('🤖 [BOT-MINIMAL] Initializing minimal bot...')
console.log('🔑 [BOT-MINIMAL] Token exists:', !!BOT_TOKEN)
console.log('👤 [BOT-MINIMAL] Admin IDs:', ADMIN_IDS)

if (!BOT_TOKEN) {
  console.error('❌ [BOT-MINIMAL] TELEGRAM_BOT_TOKEN is required')
  throw new Error('TELEGRAM_BOT_TOKEN is required in environment variables')
}

if (ADMIN_IDS.length === 0) {
  console.error('❌ [BOT-MINIMAL] TELEGRAM_OWNER_CHAT_ID is required')
  throw new Error('TELEGRAM_OWNER_CHAT_ID is required in environment variables')
}

// Инициализация бота
console.log('🚀 [BOT-MINIMAL] Creating bot instance...')
const bot = new Bot<Context>(BOT_TOKEN)

// Middleware для логирования
bot.use((ctx, next) => {
  console.log('📨 [BOT-MINIMAL] Update received:', {
    type: ctx.updateType,
    from: ctx.from?.id,
    text: ctx.message?.text
  })
  return next()
})

// Проверка админа
function isAdmin(ctx: Context): boolean {
  const isAdminUser = ADMIN_IDS.includes(ctx.from?.id.toString() || '')
  console.log('🔐 [BOT-MINIMAL] Admin check:', {
    userId: ctx.from?.id,
    isAdmin: isAdminUser
  })
  return isAdminUser
}

// Команда /start
bot.command('start', async (ctx) => {
  console.log('🎯 [BOT-MINIMAL] /start command received')
  
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }

  await ctx.reply(
    '🚀 *VobVorot Bot - Minimal Version*\n\n' +
    'Бот работает в минимальном режиме.\n' +
    'Доступные команды:\n' +
    '/start - Это сообщение\n' +
    '/ping - Проверка работы бота\n' +
    '/info - Информация о системе',
    { parse_mode: 'Markdown' }
  )
})

// Команда /ping
bot.command('ping', async (ctx) => {
  console.log('🏓 [BOT-MINIMAL] /ping command received')
  
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }

  await ctx.reply('🏓 Pong! Бот работает.')
})

// Команда /info
bot.command('info', async (ctx) => {
  console.log('ℹ️ [BOT-MINIMAL] /info command received')
  
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }

  const info = {
    botVersion: 'minimal',
    nodeVersion: process.version,
    admins: ADMIN_IDS.length,
    environment: process.env.NODE_ENV || 'unknown'
  }

  await ctx.reply(
    '📊 *Информация о системе:*\n\n' +
    `Версия бота: ${info.botVersion}\n` +
    `Node.js: ${info.nodeVersion}\n` +
    `Администраторов: ${info.admins}\n` +
    `Окружение: ${info.environment}`,
    { parse_mode: 'Markdown' }
  )
})

// Обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx
  console.error('❌ [BOT-MINIMAL] Error while handling update', ctx.update.update_id, ':')
  const e = err.error
  
  if (e instanceof GrammyError) {
    console.error('❌ [BOT-MINIMAL] Error in request:', e.description)
  } else if (e instanceof HttpError) {
    console.error('❌ [BOT-MINIMAL] Could not contact Telegram:', e)
  } else {
    console.error('❌ [BOT-MINIMAL] Unknown error:', e)
  }
})

console.log('✅ [BOT-MINIMAL] Bot initialized successfully')

export { bot }