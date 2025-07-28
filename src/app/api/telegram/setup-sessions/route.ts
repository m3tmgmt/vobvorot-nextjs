import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Endpoint для создания таблицы сессий

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Setting up telegram_sessions table...')
    
    // Создаем таблицу через raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "telegram_sessions" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "telegram_sessions_pkey" PRIMARY KEY ("key")
      )
    `
    
    // Создаем индекс
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "telegram_sessions_updated_at_idx" 
      ON "telegram_sessions"("updated_at")
    `
    
    // Проверяем, что таблица создана
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'telegram_sessions'
      )
    `
    
    return NextResponse.json({
      success: true,
      message: 'Telegram sessions table setup completed',
      tableExists
    })
    
  } catch (error) {
    console.error('Error setting up sessions table:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup sessions table',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}