import { NextRequest, NextResponse } from 'next/server'

// Hardcoded values for testing
const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']
const WEBHOOK_SECRET = 'vobvorot_webhook_secret_2025'

async function sendTelegramMessage(chatId: number, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  })
  return response.json()
}

export async function POST(request: NextRequest) {
  console.log('='.repeat(50))
  console.log('🚀 DIRECT WEBHOOK CALLED:', new Date().toISOString())
  
  try {
    // Check secret token
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    console.log('🔑 Secret token received:', secretToken)
    console.log('🔑 Expected token:', WEBHOOK_SECRET)
    
    if (secretToken !== WEBHOOK_SECRET) {
      console.log('❌ Secret token mismatch!')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const update = await request.json()
    console.log('📨 Update:', JSON.stringify(update, null, 2))
    
    // Handle messages
    if (update.message) {
      const message = update.message
      const chatId = message.chat.id
      const userId = message.from.id
      const text = message.text || ''
      const username = message.from.username || 'unknown'
      
      console.log(`👤 Message from ${username} (${userId}): ${text}`)
      
      // Check if user is admin
      const isAdmin = ADMIN_IDS.includes(userId.toString())
      console.log(`🔐 Admin check for ${userId}: ${isAdmin}`)
      
      if (!isAdmin) {
        await sendTelegramMessage(chatId, '❌ У вас нет доступа к этому боту')
        return NextResponse.json({ ok: true })
      }
      
      // Handle commands
      if (text === '/start') {
        const response = `
🤖 <b>VobvorotAdminBot работает!</b>

✅ Прямой webhook активен
✅ Вы авторизованы как администратор
✅ ID: ${userId}

<b>Доступные команды:</b>
/start - это сообщение
/status - статус системы
/test - тест функций

<b>Управление видео:</b>
/home_videos - видео главной страницы
/sign_videos - видео страницы sign

<i>Время: ${new Date().toLocaleString('ru-RU')}</i>
        `.trim()
        
        const result = await sendTelegramMessage(chatId, response)
        console.log('✅ Start message sent:', result.ok)
        
      } else if (text === '/status') {
        const response = `
📊 <b>Статус системы:</b>

🟢 Webhook: активен
🟢 База данных: подключена
🟢 API: работает
🟢 Токен бота: ${BOT_TOKEN.substring(0, 10)}...

<i>Время проверки: ${new Date().toLocaleString('ru-RU')}</i>
        `.trim()
        
        await sendTelegramMessage(chatId, response)
        
      } else if (text === '/test') {
        await sendTelegramMessage(chatId, '🧪 Тест пройден успешно! Бот работает.')
        
      } else if (text.startsWith('/')) {
        await sendTelegramMessage(chatId, `❓ Неизвестная команда: ${text}\n\nИспользуйте /start для списка команд.`)
        
      } else {
        // Echo non-command messages
        await sendTelegramMessage(chatId, `Вы написали: ${text}`)
      }
    }
    
    // Handle callback queries
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      console.log('🔘 Callback query:', callbackQuery.data)
      
      // Answer callback query to remove loading state
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: 'Обработка...'
        })
      })
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Direct webhook ready',
    bot_token: BOT_TOKEN.substring(0, 10) + '...',
    admin_ids: ADMIN_IDS,
    timestamp: new Date().toISOString()
  })
}