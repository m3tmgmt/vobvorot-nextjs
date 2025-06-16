import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredReservations, archiveZeroStockProducts } from '@/lib/inventory'
import { logger } from '@/lib/logger'

// Cron job для очистки просроченных резервирований
// Должен запускаться каждые 2-3 минуты
export async function GET(request: NextRequest) {
  try {
    // Проверить авторизацию для cron jobs (Vercel cron или локальный запуск)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job access attempt', {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Starting reservation cleanup cron job')
    
    // Шаг 1: Очистить просроченные резервирования
    const cleanupResult = await cleanupExpiredReservations()
    
    if (!cleanupResult.success) {
      logger.error('Failed to cleanup expired reservations', {
        error: cleanupResult.error
      })
      return NextResponse.json({
        success: false,
        error: cleanupResult.error
      }, { status: 500 })
    }

    // Шаг 2: Архивировать товары с нулевым остатком
    const archiveResult = await archiveZeroStockProducts()
    
    if (!archiveResult.success) {
      logger.error('Failed to archive zero stock products', {
        error: archiveResult.error
      })
      // Не провалить весь cron job если архивация не удалась
    }

    const results = {
      success: true,
      expiredReservationsCleanedUp: cleanupResult.cleanedCount,
      productsArchived: archiveResult.archivedCount,
      executedAt: new Date().toISOString()
    }

    logger.info('Reservation cleanup cron job completed', results)

    return NextResponse.json(results)

  } catch (error) {
    logger.error('Reservation cleanup cron job failed', {}, 
      error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executedAt: new Date().toISOString()
    }, { status: 500 })
  }
}

// Также поддержать POST для ручного запуска
export async function POST(request: NextRequest) {
  return GET(request)
}