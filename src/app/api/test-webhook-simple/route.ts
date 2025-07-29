import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('Simple webhook test called')
  
  // Get all headers
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })
  
  // Get the secret token
  const receivedToken = req.headers.get('x-telegram-bot-api-secret-token')
  const envToken = process.env.TELEGRAM_WEBHOOK_SECRET
  
  return NextResponse.json({
    message: 'Test webhook simple',
    receivedToken: receivedToken || 'not provided',
    envTokenSet: !!envToken,
    envTokenValue: envToken ? envToken.substring(0, 10) + '...' : 'NOT SET',
    match: receivedToken === envToken,
    headers: headers,
    timestamp: new Date().toISOString()
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook simple GET',
    envVars: {
      TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    }
  })
}