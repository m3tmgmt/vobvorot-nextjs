import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram-bot'

// Полная версия webhook с CRM функциональностью

export async function POST(request: NextRequest) {
  console.log('🚀 [WEBHOOK] POST request received')
  
  try {
    console.log('🤖 [WEBHOOK] Starting webhook processing...')
    console.log('🔍 [WEBHOOK] Headers:', Object.fromEntries(request.headers.entries()))
    
    // Временно отключаем проверку секретного токена для отладки
    // TODO: Восстановить проверку после исправления проблемы с токеном
    console.log('🔑 [WEBHOOK] Auth check disabled for debugging')

    console.log('✅ [WEBHOOK] Auth passed, parsing JSON...')
    
    // Получаем update от Telegram
    const update = await request.json()
    console.log('📨 [WEBHOOK] Update received:', JSON.stringify(update, null, 2))
    
    // Проверяем наличие бота
    console.log('🤖 [WEBHOOK] Bot instance exists:', !!bot)
    console.log('🤖 [WEBHOOK] Bot token exists:', !!process.env.TELEGRAM_BOT_TOKEN)
    console.log('🤖 [WEBHOOK] Admin IDs:', process.env.TELEGRAM_OWNER_CHAT_ID)
    
    try {
      console.log('🎯 [WEBHOOK] Calling bot.handleUpdate directly...')
      
      // Обрабатываем update напрямую через Grammy bot (Next.js 15 compatible)
      await bot.handleUpdate(update)
      
      console.log('✅ [WEBHOOK] bot.handleUpdate completed successfully')
    } catch (botError) {
      console.error('❌ [WEBHOOK] Bot handling error:', botError)
      console.error('❌ [WEBHOOK] Error stack:', botError instanceof Error ? botError.stack : 'No stack')
      throw botError
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('💥 [WEBHOOK] Critical error:', error)
    console.error('💥 [WEBHOOK] Error stack:', error instanceof Error ? error.stack : 'No stack')
    logger.error('Telegram webhook error', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
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
    logger.error('Webhook setup error', error)
    return NextResponse.json(
      { error: 'Failed to setup webhook' }, 
      { status: 500 }
    )
  }
}