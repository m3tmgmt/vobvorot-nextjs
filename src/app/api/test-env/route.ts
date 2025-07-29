import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Проверяем авторизацию
  const authHeader = req.headers.get('authorization')
  const adminApiKey = process.env.ADMIN_API_KEY
  
  if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Возвращаем информацию о переменных окружения
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL ? '✅ Set' : '❌ Not set',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set',
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ? `✅ Set (${process.env.TELEGRAM_WEBHOOK_SECRET?.length} chars)` : '❌ Not set',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set',
    ADMIN_API_KEY: process.env.ADMIN_API_KEY ? '✅ Set' : '❌ Not set',
    WESTERNBID_MERCHANT_ID: process.env.WESTERNBID_MERCHANT_ID ? '✅ Set' : '❌ Not set',
    WESTERNBID_SECRET_KEY: process.env.WESTERNBID_SECRET_KEY ? '✅ Set' : '❌ Not set',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not set',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set',
    // Debug info
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    region: process.env.VERCEL_REGION,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(envStatus, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}