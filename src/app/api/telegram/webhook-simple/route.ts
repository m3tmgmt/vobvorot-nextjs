import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM'
const ADMIN_IDS = ['316593422', '1837334996']

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    console.log('📨 Simple webhook received:', JSON.stringify(update, null, 2))
    
    // Обрабатываем только текстовые сообщения
    if (update.message?.text) {
      const chatId = update.message.chat.id
      const userId = update.message.from.id
      const text = update.message.text
      const username = update.message.from.username || 'Unknown'
      
      console.log(`👤 User ${username} (${userId}): ${text}`)
      
      // Проверяем админа
      if (!ADMIN_IDS.includes(userId.toString())) {
        await sendTelegramMessage(chatId, '❌ У вас нет доступа к этому боту')
        return NextResponse.json({ ok: true })
      }
      
      // Обрабатываем команды
      switch(text) {
        case '/start':
          await sendTelegramMessage(chatId, `🎉 *VobvorotAdminBot работает!*

✅ Webhook активен
✅ Ваш ID: ${userId}
✅ Доступ подтвержден

📱 *Команды:*
/start - Это сообщение
/menu - Главное меню
/orders - Управление заказами
/products - Управление товарами`, true)
          break
          
        case '/menu':
          await sendTelegramMessage(chatId, '📱 Главное меню в разработке...')
          break
          
        case '/orders':
          await sendTelegramMessage(chatId, '📦 Управление заказами в разработке...')
          break
          
        case '/products':
          await sendTelegramMessage(chatId, '🛍️ Управление товарами в разработке...')
          break
          
        default:
          if (text.startsWith('/')) {
            await sendTelegramMessage(chatId, `❓ Неизвестная команда: ${text}

Используйте /start для списка команд`)
          }
      }
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ ok: true }) // Всегда возвращаем ok для Telegram
  }
}

async function sendTelegramMessage(chatId: number, text: string, markdown = false) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        ...(markdown && { parse_mode: 'Markdown' })
      })
    })
    
    const result = await response.json()
    if (!result.ok) {
      console.error('❌ Telegram API error:', result)
    } else {
      console.log('✅ Message sent successfully')
    }
    return result
  } catch (error) {
    console.error('❌ Failed to send message:', error)
  }
}

// GET для управления webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'set') {
    const webhookUrl = 'https://vobvorot-nextjs-877l5w94m-m3tmgmt-gmailcoms-projects.vercel.app/api/telegram/webhook-simple'
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    })
    
    return NextResponse.json(await response.json())
  }
  
  if (action === 'info') {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    return NextResponse.json(await response.json())
  }
  
  if (action === 'delete') {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`)
    return NextResponse.json(await response.json())
  }
  
  return NextResponse.json({
    status: 'Simple webhook endpoint',
    actions: {
      set: '?action=set',
      info: '?action=info',
      delete: '?action=delete'
    }
  })
}