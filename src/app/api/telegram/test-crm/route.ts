import { NextRequest, NextResponse } from 'next/server'
import { Bot, Context, InlineKeyboard } from 'grammy'
import { PrismaClient } from '@prisma/client'

// Конфигурация
const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']

export async function POST(request: NextRequest) {
  console.log('🚀 [TEST-CRM] POST request received')
  
  try {
    const update = await request.json()
    console.log('📨 [TEST-CRM] Update:', JSON.stringify(update, null, 2))
    
    // Тест 1: Проверка Grammy Bot
    console.log('🔧 [TEST-CRM] Creating bot instance...')
    const bot = new Bot(BOT_TOKEN)
    console.log('✅ [TEST-CRM] Bot created successfully')
    
    // Инициализация бота
    console.log('🔧 [TEST-CRM] Initializing bot...')
    await bot.init()
    console.log('✅ [TEST-CRM] Bot initialized successfully')
    
    // Тест 2: Проверка Prisma
    console.log('🔧 [TEST-CRM] Creating Prisma client...')
    const prisma = new PrismaClient()
    console.log('✅ [TEST-CRM] Prisma client created')
    
    // Тест 3: Простой запрос к БД
    console.log('🔧 [TEST-CRM] Testing database connection...')
    const categoryCount = await prisma.category.count()
    console.log(`✅ [TEST-CRM] Database connected. Categories: ${categoryCount}`)
    
    // Тест 4: Обработка update
    console.log('🔧 [TEST-CRM] Setting up simple handler...')
    bot.on('message', async (ctx) => {
      console.log('📥 [TEST-CRM] Message handler called')
      await ctx.reply('Test response')
    })
    
    console.log('🔧 [TEST-CRM] Handling update...')
    await bot.handleUpdate(update)
    console.log('✅ [TEST-CRM] Update handled successfully')
    
    return NextResponse.json({ 
      ok: true,
      tests: {
        bot: 'created',
        prisma: 'connected',
        categories: categoryCount
      }
    })
    
  } catch (error: any) {
    console.error('💥 [TEST-CRM] Error:', error)
    console.error('💥 [TEST-CRM] Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Test CRM endpoint ready',
    timestamp: new Date().toISOString()
  })
}