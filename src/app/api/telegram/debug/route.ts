import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envCheck = {
    bot_token_exists: !!process.env.TELEGRAM_BOT_TOKEN,
    bot_token_length: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
    bot_token_prefix: process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...',
    webhook_secret_exists: !!process.env.TELEGRAM_WEBHOOK_SECRET,
    admin_ids_raw: process.env.TELEGRAM_OWNER_CHAT_ID,
    admin_ids_split: process.env.TELEGRAM_OWNER_CHAT_ID?.split(','),
    admin_ids_processed: process.env.TELEGRAM_OWNER_CHAT_ID
      ?.split(',')
      .map(id => {
        const trimmed = id.trim().replace(/[\r\n\s]/g, '')
        return {
          original: id,
          trimmed: trimmed,
          length: trimmed.length,
          charCodes: Array.from(id).map(c => c.charCodeAt(0))
        }
      }),
    nextauth_url: process.env.NEXTAUTH_URL,
    admin_api_key_exists: !!process.env.ADMIN_API_KEY,
    internal_api_key_exists: !!process.env.INTERNAL_API_KEY,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(envCheck, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}