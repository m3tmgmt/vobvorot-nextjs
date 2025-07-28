import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram-bot-with-storage'
import { logger } from '@/lib/logger'

// Webhook с PostgreSQL хранилищем сессий

export async function POST(request: NextRequest) {
  console.log('🚀 [WEBHOOK-STORAGE] POST request received')
  
  try {
    console.log('🔍 [WEBHOOK-STORAGE] Headers:', Object.fromEntries(request.headers.entries()))
    
    // Получаем update от Telegram
    const update = await request.json()
    console.log('📨 [WEBHOOK-STORAGE] Update received:', JSON.stringify(update, null, 2))
    
    // Проверяем наличие бота
    console.log('🤖 [WEBHOOK-STORAGE] Bot instance exists:', !!bot)
    
    try {
      console.log('🎯 [WEBHOOK-STORAGE] Calling bot.handleUpdate...')
      
      // Обрабатываем update
      await bot.handleUpdate(update)
      
      console.log('✅ [WEBHOOK-STORAGE] bot.handleUpdate completed successfully')
    } catch (botError) {
      console.error('❌ [WEBHOOK-STORAGE] Bot handling error:', botError)
      console.error('❌ [WEBHOOK-STORAGE] Error stack:', botError instanceof Error ? botError.stack : 'No stack')
      throw botError
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('💥 [WEBHOOK-STORAGE] Critical error:', error)
    console.error('💥 [WEBHOOK-STORAGE] Error stack:', error instanceof Error ? error.stack : 'No stack')
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
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram/webhook-storage`
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
      
    } else if (action === 'info') {
      // Получаем информацию о webhook
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
      const result = await response.json()
      return NextResponse.json(result)
      
    } else {
      return NextResponse.json({ 
        message: 'Telegram Bot Webhook with PostgreSQL Storage',
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