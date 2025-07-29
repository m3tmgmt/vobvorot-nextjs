import { NextResponse } from 'next/server';

export async function GET() {
  // Проверяем важные переменные окружения
  const envVars = {
    // Telegram
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set',
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ? '✅ Set' : '❌ Not set',
    NEXT_PUBLIC_TELEGRAM_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ? '✅ Set' : '❌ Not set',
    
    // Vercel
    VERCEL_URL: process.env.VERCEL_URL ? `✅ ${process.env.VERCEL_URL}` : '❌ Not set',
    NODE_ENV: process.env.NODE_ENV,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    
    // Other important vars
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ? `✅ ${process.env.NEXT_PUBLIC_BASE_URL}` : '❌ Not set',
    
    // Webhook secret value (first 5 chars only for security)
    WEBHOOK_SECRET_PREVIEW: process.env.TELEGRAM_WEBHOOK_SECRET 
      ? `First 5 chars: ${process.env.TELEGRAM_WEBHOOK_SECRET.substring(0, 5)}...`
      : 'Not set',
    
    // Total env vars count
    TOTAL_ENV_VARS: Object.keys(process.env).length
  };

  return NextResponse.json({
    message: 'Environment variables check',
    timestamp: new Date().toISOString(),
    envVars,
    allEnvKeys: Object.keys(process.env).sort()
  });
}