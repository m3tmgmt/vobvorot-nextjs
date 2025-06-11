import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.trim().split(',').map(id => id.trim()) || []

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Webhook received')
    
    if (!BOT_TOKEN) {
      console.error('❌ No bot token')
      return NextResponse.json({ error: 'Bot not configured' }, { status: 500 })
    }

    // Получаем update от Telegram
    const update = await request.json()
    console.log('📋 Update received:', JSON.stringify(update, null, 2))
    
    // Обрабатываем сообщение
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id
      const userId = update.message.from.id
      const text = update.message.text
      
      console.log(`👤 User ${userId} sent: ${text}`)
      
      // Проверяем права администратора
      if (!ADMIN_IDS.includes(userId.toString())) {
        console.log(`❌ Access denied for user ${userId}`)
        await sendMessage(chatId, '❌ У вас нет доступа к этому боту')
        return NextResponse.json({ ok: true })
      }
      
      // Обрабатываем команды
      if (text === '/start') {
        console.log(`✅ Sending welcome to admin ${userId}`)
        const welcomeMessage = `
🎉 VobvorotAdminBot работает!

✅ Новый токен: 7700098378...
✅ Webhook: активен
✅ Доступ: подтвержден
✅ ID: ${userId}

Простая версия для тестирования.
        `
        await sendMessage(chatId, welcomeMessage)
      } else {
        await sendMessage(chatId, '👋 Используйте /start для начала работы')
      }
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      })
    })
    
    const result = await response.json()
    console.log('📤 Message sent:', result.ok)
    return result
  } catch (error) {
    console.error('❌ Failed to send message:', error)
  }
}