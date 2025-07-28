import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram-bot'

// Диагностический endpoint для проверки состояния бота

export async function GET(request: NextRequest) {
  console.log('🔍 [BOT-CHECK] Starting diagnostic check...')
  
  try {
    // Проверяем переменные окружения
    const envCheck = {
      BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      BOT_TOKEN_LENGTH: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
      BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
      OWNER_CHAT_ID: process.env.TELEGRAM_OWNER_CHAT_ID,
      WEBHOOK_SECRET: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_DATABASE_URL: !!process.env.DIRECT_DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL
    }
    
    console.log('📋 [BOT-CHECK] Environment variables:', envCheck)
    
    // Проверяем состояние бота
    let botInfo = null
    let botStatus = 'unknown'
    let botError = null
    
    try {
      console.log('🤖 [BOT-CHECK] Bot instance exists:', !!bot)
      
      if (bot) {
        // Пытаемся получить информацию о боте
        console.log('🔄 [BOT-CHECK] Attempting to get bot info...')
        const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`)
        const data = await response.json()
        
        if (data.ok) {
          botInfo = data.result
          botStatus = 'connected'
          console.log('✅ [BOT-CHECK] Bot info retrieved:', botInfo)
        } else {
          botStatus = 'error'
          botError = data.description || 'Unknown error'
          console.error('❌ [BOT-CHECK] Bot API error:', data)
        }
      } else {
        botStatus = 'not_initialized'
        console.error('❌ [BOT-CHECK] Bot instance is null')
      }
    } catch (error) {
      botStatus = 'error'
      botError = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ [BOT-CHECK] Error getting bot info:', error)
    }
    
    // Проверяем webhook
    let webhookInfo = null
    try {
      console.log('🔗 [BOT-CHECK] Checking webhook info...')
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
      const data = await response.json()
      
      if (data.ok) {
        webhookInfo = data.result
        console.log('📡 [BOT-CHECK] Webhook info:', webhookInfo)
      } else {
        console.error('❌ [BOT-CHECK] Webhook API error:', data)
      }
    } catch (error) {
      console.error('❌ [BOT-CHECK] Error getting webhook info:', error)
    }
    
    // Проверяем базу данных
    let dbStatus = 'unknown'
    let dbError = null
    try {
      console.log('🗄️ [BOT-CHECK] Checking database connection...')
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      // Простой запрос для проверки соединения
      const count = await prisma.product.count()
      dbStatus = 'connected'
      console.log(`✅ [BOT-CHECK] Database connected, products count: ${count}`)
      
      await prisma.$disconnect()
    } catch (error) {
      dbStatus = 'error'
      dbError = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ [BOT-CHECK] Database error:', error)
    }
    
    // Формируем полный отчет
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      bot: {
        status: botStatus,
        info: botInfo,
        error: botError,
        instanceExists: !!bot
      },
      webhook: webhookInfo,
      database: {
        status: dbStatus,
        error: dbError
      }
    }
    
    console.log('📊 [BOT-CHECK] Complete diagnostics:', JSON.stringify(diagnostics, null, 2))
    
    return NextResponse.json(diagnostics, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('💥 [BOT-CHECK] Critical error:', error)
    return NextResponse.json(
      { 
        error: 'Diagnostic check failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    )
  }
}