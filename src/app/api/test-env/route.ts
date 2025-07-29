import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  const expectedAuth = process.env.ADMIN_API_KEY;
  
  // Check authorization
  if (authHeader !== `Bearer ${expectedAuth}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Return environment info (safe values only)
  return NextResponse.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      TELEGRAM_WEBHOOK_SECRET_EXISTS: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      TELEGRAM_WEBHOOK_SECRET_LENGTH: process.env.TELEGRAM_WEBHOOK_SECRET?.length || 0,
      TELEGRAM_WEBHOOK_SECRET_STARTS_WITH: process.env.TELEGRAM_WEBHOOK_SECRET?.substring(0, 10) + '...',
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      TELEGRAM_BOT_TOKEN_EXISTS: !!process.env.TELEGRAM_BOT_TOKEN,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    },
    headers: {
      'x-telegram-bot-api-secret-token': req.headers.get('x-telegram-bot-api-secret-token'),
      'X-Telegram-Bot-Api-Secret-Token': req.headers.get('X-Telegram-Bot-Api-Secret-Token'),
    },
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  // Log all headers
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  // Get the secret token from header
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  
  return NextResponse.json({
    test: 'webhook-test',
    received_token: secretToken,
    expected_token_exists: !!expectedToken,
    expected_token_length: expectedToken?.length || 0,
    tokens_match: secretToken === expectedToken,
    all_headers: headers,
    env_value_raw: process.env.TELEGRAM_WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
}