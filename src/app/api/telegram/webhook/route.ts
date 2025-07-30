import { NextRequest, NextResponse } from 'next/server'
import { webhookCallback } from 'grammy'
import { bot } from '@/lib/telegram-bot'

// Основной webhook обработчик для полной CRM-системы БЕЗ AI
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Telegram webhook received (FULL CRM - NO AI)')
    
    // ВРЕМЕННОЕ ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ
    const body = await req.clone().json()
    console.log('🔍 WEBHOOK DEBUG:', {
      headers: Object.fromEntries(req.headers.entries()),
      botInfo: body.message?.from || body.callback_query?.from,
      chatInfo: body.message?.chat || body.callback_query?.message?.chat,
      messageText: body.message?.text || 'no text'
    })
    
    // 🛡️ ФИЛЬТР БОТОВ - Блокируем неизвестные боты (включая @DrHillBot_bot)
    const ALLOWED_BOT_IDS = [
      7700098378, // VobvorotAdminBot - наш основной бот
      // Добавить сюда ID других разрешенных ботов при необходимости
    ]
    
    const botId = body.message?.from?.id || body.callback_query?.from?.id
    const botUsername = body.message?.from?.username || body.callback_query?.from?.username
    
    if (botId && !ALLOWED_BOT_IDS.includes(botId)) {
      console.log(`🚫 ЗАБЛОКИРОВАН неизвестный бот:`)
      console.log(`   ID: ${botId}`)
      console.log(`   Username: @${botUsername || 'unknown'}`)
      console.log(`   🎯 Это может быть @DrHillBot_bot или другой конфликтующий бот`)
      
      // Возвращаем успешный ответ, чтобы неизвестный бот не повторял запрос
      return NextResponse.json({ 
        ok: true, 
        message: 'Request processed by security filter' 
      })
    }
    
    // Проверка секретного токена
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || 'vobvorot_webhook_secret_2025'
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token')
    
    if (secretHeader !== secretToken) {
      console.warn('Invalid webhook secret token')
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Создаем обработчик Grammy для ПОЛНОГО бота (БЕЗ AI)
    const handleUpdate = webhookCallback(bot, 'std/http', {
      secretToken: secretToken,
      onTimeout: () => {
        console.log('⏰ Webhook callback timeout!')
      }
    })
    
    // Обрабатываем через Grammy (ПОЛНЫЙ CRM БЕЗ AI)
    const result = await handleUpdate(req)
    
    console.log('✅ Webhook processed successfully (FULL CRM - NO AI)')
    return result
    
  } catch (error) {
    console.error('💥 Webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// AI-система полностью отключена - используем только ПОЛНУЮ CRM версию бота