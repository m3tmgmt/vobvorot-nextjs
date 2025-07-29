import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Собираем всю информацию о запросе
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    
    const body = await req.json().catch(() => null)
    
    const debugInfo = {
      method: req.method,
      url: req.url,
      headers: headers,
      body: body,
      env: {
        TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ? {
          exists: true,
          length: process.env.TELEGRAM_WEBHOOK_SECRET.length,
          firstChar: process.env.TELEGRAM_WEBHOOK_SECRET[0],
          lastChar: process.env.TELEGRAM_WEBHOOK_SECRET[process.env.TELEGRAM_WEBHOOK_SECRET.length - 1],
          // Check if it has quotes
          hasQuotes: process.env.TELEGRAM_WEBHOOK_SECRET.includes('"') || process.env.TELEGRAM_WEBHOOK_SECRET.includes("'"),
          raw: process.env.TELEGRAM_WEBHOOK_SECRET
        } : { exists: false },
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set',
      },
      tokenComparison: {
        received: headers['x-telegram-bot-api-secret-token'],
        expected: process.env.TELEGRAM_WEBHOOK_SECRET,
        match: headers['x-telegram-bot-api-secret-token'] === process.env.TELEGRAM_WEBHOOK_SECRET,
        trimmedMatch: headers['x-telegram-bot-api-secret-token']?.trim() === process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
      },
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error processing request', 
      message: error.message 
    }, { status: 500 })
  }
}