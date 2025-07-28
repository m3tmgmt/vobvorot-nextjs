import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      telegram_bot_token_exists: !!process.env.TELEGRAM_BOT_TOKEN,
      telegram_bot_token_preview: process.env.TELEGRAM_BOT_TOKEN?.substring(0, 15) + '...',
      telegram_owner_chat_id: process.env.TELEGRAM_OWNER_CHAT_ID,
      telegram_webhook_secret_exists: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      admin_api_key_exists: !!process.env.ADMIN_API_KEY,
      nextauth_url: process.env.NEXTAUTH_URL
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read env' }, { status: 500 })
  }
}