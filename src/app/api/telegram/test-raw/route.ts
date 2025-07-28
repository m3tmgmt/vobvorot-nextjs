import { NextRequest, NextResponse } from 'next/server'

// Тестовый endpoint для проверки работы без Grammy

export async function POST(request: NextRequest) {
  console.log('🚀 [TEST-RAW] POST request received')
  
  try {
    // Получаем update от Telegram
    const update = await request.json()
    console.log('📨 [TEST-RAW] Update:', JSON.stringify(update, null, 2))
    
    // Простая проверка сообщения
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id
      const messageText = '✅ Бот работает! Это тестовый ответ без Grammy.'
      
      // Отправляем ответ напрямую через API
      const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: 'HTML'
          })
        }
      )
      
      const result = await response.json()
      console.log('📤 [TEST-RAW] Send result:', result)
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('💥 [TEST-RAW] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }, 
      { status: 500 }
    )
  }
}

// GET для установки webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'set') {
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram/test-raw`
    
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message']
        })
      }
    )
    
    const result = await response.json()
    return NextResponse.json(result)
  }
  
  return NextResponse.json({ 
    message: 'Test Raw Webhook',
    setWebhook: '?action=set'
  })
}