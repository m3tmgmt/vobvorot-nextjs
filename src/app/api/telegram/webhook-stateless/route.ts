import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram-bot-stateless'
import { logger } from '@/lib/logger'

// Webhook для stateless бота

export async function POST(request: NextRequest) {
  console.log('🚀 [WEBHOOK-STATELESS] POST request received')
  
  try {
    console.log('🔍 [WEBHOOK-STATELESS] Headers:', Object.fromEntries(request.headers.entries()))
    
    // Получаем update от Telegram
    const update = await request.json()
    console.log('📨 [WEBHOOK-STATELESS] Update received:', JSON.stringify(update, null, 2))
    
    // Проверяем наличие бота
    console.log('🤖 [WEBHOOK-STATELESS] Bot instance exists:', !!bot)
    
    try {
      console.log('🎯 [WEBHOOK-STATELESS] Calling bot.handleUpdate...')
      
      // Обрабатываем update
      await bot.handleUpdate(update)
      
      console.log('✅ [WEBHOOK-STATELESS] bot.handleUpdate completed successfully')
    } catch (botError) {
      console.error('❌ [WEBHOOK-STATELESS] Bot handling error:', botError)
      console.error('❌ [WEBHOOK-STATELESS] Error stack:', botError instanceof Error ? botError.stack : 'No stack')
      throw botError
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('💥 [WEBHOOK-STATELESS] Critical error:', error)
    console.error('💥 [WEBHOOK-STATELESS] Error stack:', error instanceof Error ? error.stack : 'No stack')
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
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram/webhook-stateless`
      const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || 'vobvorot_webhook_secret_2025'
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
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
      
    } else if (action === 'info') {
      // Получаем информацию о webhook
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
      const result = await response.json()
      return NextResponse.json(result)
      
    } else {
      return NextResponse.json({ 
        message: 'Telegram Bot Webhook - Stateless Version',
        actions: {
          set: '?action=set',
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