import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram-bot-simple'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Grammar webhook received request')
    
    // Проверяем секретный токен для безопасности
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET
    
    console.log(`🔐 Secret token check: ${!!secretToken}, expected: ${!!expectedToken}`)
    
    // Временно отключено для тестирования
    // if (expectedToken && secretToken !== expectedToken) {
    //   console.log('❌ Unauthorized webhook request')
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Получаем update от Telegram
    const update = await request.json()
    console.log('📨 Received update:', JSON.stringify(update, null, 2))
    
    // Проверяем, что bot инициализирован
    if (!bot) {
      console.error('❌ Bot not initialized')
      return NextResponse.json({ error: 'Bot not initialized' }, { status: 500 })
    }
    
    // Обрабатываем update напрямую через Grammy bot
    console.log('🔄 Processing update through Grammy bot...')
    await bot.handleUpdate(update)
    console.log('✅ Update processed successfully')
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('❌ Telegram webhook error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    )
  }
}

// GET endpoint для установки webhook
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'set') {
      // Устанавливаем webhook
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram/webhook`
      const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET
      
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: secretToken,
          allowed_updates: ['message', 'callback_query', 'inline_query']
        })
      })
      
      const result = await response.json()
      return NextResponse.json(result)
      
    } else if (action === 'delete') {
      // Удаляем webhook
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteWebhook`)
      const result = await response.json()
      return NextResponse.json(result)
      
    } else if (action === 'info') {
      // Получаем информацию о webhook
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
      const result = await response.json()
      return NextResponse.json(result)
      
    } else {
      return NextResponse.json({ 
        message: 'Telegram Bot Webhook',
        actions: {
          set: '?action=set',
          delete: '?action=delete',
          info: '?action=info'
        }
      })
    }
    
  } catch (error) {
    console.error('Webhook setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup webhook' }, 
      { status: 500 }
    )
  }
}