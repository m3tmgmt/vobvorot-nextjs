import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']

export async function POST(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: request.url
  }
  
  console.log('🚀 TEST-DEBUG webhook called:', JSON.stringify(debug, null, 2))
  
  try {
    const body = await request.text()
    console.log('📨 Raw body:', body)
    
    const update = JSON.parse(body)
    console.log('📨 Parsed update:', JSON.stringify(update, null, 2))
    
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id
      const userId = update.message.from.id
      
      console.log(`👤 User ${userId} sent /start`)
      
      const responseText = `✅ Debug Bot Works!\n\nTime: ${new Date().toISOString()}\nUser ID: ${userId}\nChat ID: ${chatId}\nAdmin: ${ADMIN_IDS.includes(userId.toString()) ? 'YES' : 'NO'}`
      
      console.log('📤 Sending response:', responseText)
      
      const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText
        })
      })
      
      const telegramResult = await telegramResponse.json()
      console.log('✅ Telegram API response:', JSON.stringify(telegramResult, null, 2))
      
      return NextResponse.json({ 
        ok: true, 
        debug: { userId, chatId, sent: telegramResult.ok }
      })
    }
    
    return NextResponse.json({ ok: true, debug: { message: 'No /start command' } })
    
  } catch (error) {
    console.error('❌ Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      ok: false, 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Debug webhook ready',
    timestamp: new Date().toISOString(),
    admins: ADMIN_IDS
  })
}