import { Bot, webhookCallback } from 'grammy'
import { NextRequest } from 'next/server'

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'

async function createBot() {
  const bot = new Bot(BOT_TOKEN)
  await bot.init()
  
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '✅ Webhook работает!\n\n' +
      'Но есть проблемы:\n' +
      '1. DNS домена vobvorot.shop не настроен\n' +
      '2. Нужно дождаться нового deployment для применения переменных окружения\n\n' +
      'Используйте Vercel URL для тестов:\n' +
      'https://vobvorot-nextjs.vercel.app/api/telegram/ai-assistant'
    )
  })
  
  bot.on('message', async (ctx) => {
    await ctx.reply(`Получено сообщение: ${ctx.message.text}`)
  })
  
  return bot
}

export async function POST(req: NextRequest) {
  try {
    // ВРЕМЕННО отключаем проверку токена для тестирования
    console.log('Webhook request received (auth check disabled temporarily)')
    
    const bot = await createBot()
    const handleUpdate = webhookCallback(bot, 'std/http')
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}