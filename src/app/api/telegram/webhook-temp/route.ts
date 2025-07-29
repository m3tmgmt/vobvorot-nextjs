import { Bot, webhookCallback } from 'grammy'
import { NextRequest } from 'next/server'

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']

async function createBot() {
  const bot = new Bot(BOT_TOKEN)
  await bot.init()

  // Simple handler for testing
  bot.command('start', async (ctx) => {
    if (!ctx.from || !ADMIN_IDS.includes(ctx.from.id.toString())) {
      await ctx.reply('⛔ У вас нет доступа к этому боту')
      return
    }
    
    await ctx.reply('👋 Привет! Бот работает!\n\nЭто временный webhook для тестирования.')
  })

  bot.on('message', async (ctx) => {
    if (!ctx.from || !ADMIN_IDS.includes(ctx.from.id.toString())) {
      return
    }
    
    await ctx.reply(`Вы написали: ${ctx.message.text}\n\nОсновной AI бот сейчас настраивается.`)
  })

  return bot
}

export async function POST(req: NextRequest) {
  try {
    console.log('Temporary webhook called')
    
    const bot = await createBot()
    const handleUpdate = webhookCallback(bot, 'std/http')
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}