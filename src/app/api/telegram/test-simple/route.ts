import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const ADMIN_IDS = ['316593422', '1837334996'] // Hardcoded for testing

export async function POST(request: NextRequest) {
  console.log('🚀 TEST-SIMPLE webhook called')
  
  try {
    const update = await request.json()
    console.log('📨 Update:', JSON.stringify(update, null, 2))
    
    if (update.message?.text) {
      const chatId = update.message.chat.id
      const userId = update.message.from.id
      const text = update.message.text
      
      // Check admin
      const isAdmin = ADMIN_IDS.includes(userId.toString())
      console.log(`🔐 User ${userId} admin: ${isAdmin}`)
      
      let responseText = ''
      
      if (!isAdmin) {
        responseText = '❌ Access denied'
      } else if (text === '/start') {
        responseText = `✅ BOT WORKS!\n\nToken: ${BOT_TOKEN.substring(0, 10)}...\nYour ID: ${userId}\nAdmin: YES\nTime: ${new Date().toISOString()}`
      } else {
        responseText = `Echo: ${text}`
      }
      
      // Send response
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText
        })
      })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ ok: false })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Test webhook ready',
    token: BOT_TOKEN ? 'configured' : 'missing',
    admins: ADMIN_IDS
  })
}