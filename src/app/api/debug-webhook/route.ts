import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Собираем всю информацию для диагностики
  const headers = Object.fromEntries(req.headers.entries());
  const envInfo = {
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ? 
      `Set (${process.env.TELEGRAM_WEBHOOK_SECRET.length} chars)` : 
      'NOT SET',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
  
  // Получаем тело запроса
  let body = null;
  try {
    body = await req.json();
  } catch (e) {
    body = 'Failed to parse JSON';
  }
  
  // Проверяем токен
  const receivedToken = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET || 'NOT_SET';
  const tokenMatch = receivedToken === expectedToken;
  
  return NextResponse.json({
    status: 'debug',
    timestamp: new Date().toISOString(),
    tokenCheck: {
      received: receivedToken ? `${receivedToken.substring(0, 5)}...` : 'NO TOKEN',
      expected: expectedToken ? `${expectedToken.substring(0, 5)}...` : 'NOT_SET',
      match: tokenMatch
    },
    envInfo,
    headers: {
      'x-telegram-bot-api-secret-token': headers['x-telegram-bot-api-secret-token'] || 'NOT FOUND',
      'content-type': headers['content-type'],
      'user-agent': headers['user-agent']
    },
    body
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/debug-webhook',
    method: 'POST',
    purpose: 'Debug webhook authentication issues',
    envCheck: {
      TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ? 'Set' : 'NOT SET',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'NOT SET'
    }
  });
}