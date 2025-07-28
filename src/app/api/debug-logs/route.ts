import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Получаем последние логи из Settings
    const logs = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'debug_log_'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    return NextResponse.json({
      logs: logs.map(log => ({
        key: log.key,
        value: JSON.parse(log.value),
        timestamp: log.createdAt
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get logs' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    // Удаляем старые логи
    await prisma.setting.deleteMany({
      where: {
        key: {
          startsWith: 'debug_log_'
        }
      }
    })
    
    return NextResponse.json({ message: 'Logs cleared' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
  }
}