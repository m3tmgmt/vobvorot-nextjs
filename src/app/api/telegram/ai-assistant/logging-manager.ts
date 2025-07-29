// Модуль логирования и мониторинга для AI ассистента
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { escapeMarkdownV2 } from './utils'

// Интерфейсы для логирования
export interface LogEntry {
  id?: string
  userId: string
  username?: string
  action: string
  category: 'command' | 'error' | 'ai_request' | 'ai_response' | 'system' | 'payment' | 'email' | 'delivery'
  details?: any
  errorMessage?: string
  errorStack?: string
  duration?: number
  success: boolean
  createdAt?: Date
}

export interface LogFilter {
  userId?: string
  action?: string
  category?: string
  dateFrom?: Date
  dateTo?: Date
  success?: boolean
}

export interface UsageStats {
  totalCommands: number
  uniqueUsers: number
  commandsByCategory: Record<string, number>
  errorRate: number
  averageResponseTime: number
  mostActiveUsers: Array<{ userId: string, username?: string, commandCount: number }>
  popularCommands: Array<{ action: string, count: number }>
}

// Логирование действия пользователя
export async function logAction(entry: Omit<LogEntry, 'createdAt' | 'success'>): Promise<void> {
  const startTime = Date.now()
  
  try {
    // Логируем в консоль через существующий logger
    logger.info('Bot Action', {
      userId: entry.userId,
      action: entry.action,
      category: entry.category,
      details: entry.details
    })

    // Сохраняем в БД (используем OrderLog как временное решение)
    await prisma.orderLog.create({
      data: {
        orderId: 'BOT_LOG', // Используем специальный ID для логов бота
        action: `${entry.category}:${entry.action}`,
        details: {
          userId: entry.userId,
          username: entry.username,
          category: entry.category,
          actionDetails: entry.details,
          timestamp: new Date().toISOString()
        },
        userId: entry.userId
      }
    })

    // Отслеживаем производительность
    const duration = Date.now() - startTime
    if (duration > 1000) {
      logger.warn('Slow bot action', { action: entry.action, duration })
    }
  } catch (error) {
    logger.error('Failed to log bot action', { entry }, error as Error)
  }
}

// Логирование ошибки
export async function logError(
  userId: string,
  action: string,
  error: Error | any,
  details?: any
): Promise<void> {
  try {
    // Логируем в консоль
    logger.error('Bot Error', {
      userId,
      action,
      errorMessage: error.message || String(error),
      details
    }, error instanceof Error ? error : undefined)

    // Сохраняем в БД
    await prisma.orderLog.create({
      data: {
        orderId: 'BOT_ERROR',
        action: `error:${action}`,
        details: {
          userId,
          errorMessage: error.message || String(error),
          errorStack: error.stack,
          actionDetails: details,
          timestamp: new Date().toISOString()
        },
        userId
      }
    })
  } catch (logError) {
    logger.error('Failed to log error', {}, logError as Error)
  }
}

// Логирование AI запроса и ответа
export async function logAIInteraction(
  userId: string,
  userMessage: string,
  aiAction: string,
  aiParams: any,
  duration: number
): Promise<void> {
  try {
    await logAction({
      userId,
      action: aiAction,
      category: 'ai_request',
      details: {
        userMessage,
        aiParams,
        duration
      }
    })
  } catch (error) {
    logger.error('Failed to log AI interaction', {}, error as Error)
  }
}

// Получение логов действий
export async function getActionLogs(filter: LogFilter = {}): Promise<LogEntry[]> {
  try {
    const where: any = {
      orderId: { in: ['BOT_LOG', 'BOT_ERROR'] }
    }

    if (filter.userId) {
      where.userId = filter.userId
    }

    if (filter.action) {
      where.action = { contains: filter.action }
    }

    if (filter.category) {
      where.action = { startsWith: filter.category }
    }

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {}
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom
      if (filter.dateTo) where.createdAt.lte = filter.dateTo
    }

    const logs = await prisma.orderLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return logs.map(log => {
      const details = log.details as any
      const [category, action] = log.action.split(':')
      
      return {
        id: log.id,
        userId: log.userId || details?.userId || '',
        username: details?.username,
        action: action || log.action,
        category: category as any,
        details: details?.actionDetails || details,
        errorMessage: details?.errorMessage,
        errorStack: details?.errorStack,
        duration: details?.duration,
        success: log.orderId === 'BOT_LOG',
        createdAt: log.createdAt
      }
    })
  } catch (error) {
    logger.error('Failed to get action logs', { filter }, error as Error)
    return []
  }
}

// Получение логов ошибок
export async function getErrorLogs(
  dateFrom?: Date,
  dateTo?: Date,
  limit: number = 50
): Promise<LogEntry[]> {
  const filter: LogFilter = {
    dateFrom,
    dateTo,
    success: false
  }
  
  const logs = await getActionLogs(filter)
  return logs.filter(log => log.category === 'error' || !log.success).slice(0, limit)
}

// Получение статистики использования
export async function getUsageStatistics(
  dateFrom?: Date,
  dateTo?: Date
): Promise<UsageStats> {
  try {
    const logs = await getActionLogs({ dateFrom, dateTo })
    
    // Подсчет команд по категориям
    const commandsByCategory: Record<string, number> = {}
    const commandCounts: Record<string, number> = {}
    const userCommands: Record<string, number> = {}
    const usernames: Record<string, string> = {}
    
    let totalDuration = 0
    let durationCount = 0
    let errorCount = 0

    logs.forEach(log => {
      // Подсчет по категориям
      commandsByCategory[log.category] = (commandsByCategory[log.category] || 0) + 1
      
      // Подсчет по командам
      commandCounts[log.action] = (commandCounts[log.action] || 0) + 1
      
      // Подсчет по пользователям
      userCommands[log.userId] = (userCommands[log.userId] || 0) + 1
      if (log.username) {
        usernames[log.userId] = log.username
      }
      
      // Подсчет ошибок
      if (!log.success) {
        errorCount++
      }
      
      // Подсчет времени выполнения
      if (log.duration) {
        totalDuration += log.duration
        durationCount++
      }
    })

    // Топ активных пользователей
    const mostActiveUsers = Object.entries(userCommands)
      .map(([userId, count]) => ({
        userId,
        username: usernames[userId],
        commandCount: count
      }))
      .sort((a, b) => b.commandCount - a.commandCount)
      .slice(0, 10)

    // Популярные команды
    const popularCommands = Object.entries(commandCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalCommands: logs.length,
      uniqueUsers: Object.keys(userCommands).length,
      commandsByCategory,
      errorRate: logs.length > 0 ? (errorCount / logs.length) * 100 : 0,
      averageResponseTime: durationCount > 0 ? totalDuration / durationCount : 0,
      mostActiveUsers,
      popularCommands
    }
  } catch (error) {
    logger.error('Failed to get usage statistics', {}, error as Error)
    return {
      totalCommands: 0,
      uniqueUsers: 0,
      commandsByCategory: {},
      errorRate: 0,
      averageResponseTime: 0,
      mostActiveUsers: [],
      popularCommands: []
    }
  }
}

// Экспорт логов в формате CSV
export async function exportLogs(
  filter: LogFilter = {},
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  try {
    const logs = await getActionLogs(filter)
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2)
    }
    
    // CSV формат
    const headers = ['Date', 'User ID', 'Username', 'Action', 'Category', 'Success', 'Duration (ms)', 'Error']
    const rows = logs.map(log => [
      log.createdAt?.toISOString() || '',
      log.userId,
      log.username || '',
      log.action,
      log.category,
      log.success ? 'Yes' : 'No',
      log.duration || '',
      log.errorMessage || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    return csvContent
  } catch (error) {
    logger.error('Failed to export logs', { filter }, error as Error)
    throw error
  }
}

// Очистка старых логов
export async function cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const result = await prisma.orderLog.deleteMany({
      where: {
        orderId: { in: ['BOT_LOG', 'BOT_ERROR'] },
        createdAt: { lt: cutoffDate }
      }
    })
    
    logger.info('Cleaned up old bot logs', {
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString()
    })
    
    return result.count
  } catch (error) {
    logger.error('Failed to cleanup old logs', {}, error as Error)
    return 0
  }
}

// Форматирование статистики для Telegram
export function formatUsageStats(stats: UsageStats): string {
  let message = `📊 *Статистика использования бота:*\\n\\n`
  
  message += `📈 *Общая статистика:*\\n`
  message += `• Всего команд: ${escapeMarkdownV2(stats.totalCommands.toString())}\\n`
  message += `• Уникальных пользователей: ${escapeMarkdownV2(stats.uniqueUsers.toString())}\\n`
  message += `• Процент ошибок: ${escapeMarkdownV2(stats.errorRate.toFixed(2))}%\\n`
  message += `• Среднее время ответа: ${escapeMarkdownV2(stats.averageResponseTime.toFixed(0))} мс\\n\\n`
  
  message += `📋 *Команды по категориям:*\\n`
  Object.entries(stats.commandsByCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      message += `• ${escapeMarkdownV2(category)}: ${escapeMarkdownV2(count.toString())}\\n`
    })
  
  if (stats.mostActiveUsers.length > 0) {
    message += `\\n👥 *Самые активные пользователи:*\\n`
    stats.mostActiveUsers.slice(0, 5).forEach((user, index) => {
      const name = user.username || `ID: ${user.userId}`
      message += `${index + 1}\\. ${escapeMarkdownV2(name)} \\- ${escapeMarkdownV2(user.commandCount.toString())} команд\\n`
    })
  }
  
  if (stats.popularCommands.length > 0) {
    message += `\\n⭐ *Популярные команды:*\\n`
    stats.popularCommands.slice(0, 5).forEach((cmd, index) => {
      message += `${index + 1}\\. ${escapeMarkdownV2(cmd.action)} \\- ${escapeMarkdownV2(cmd.count.toString())} раз\\n`
    })
  }
  
  return message
}

// Форматирование логов для Telegram
export function formatLogs(logs: LogEntry[], title: string = 'Логи'): string {
  if (logs.length === 0) {
    return `📝 *${escapeMarkdownV2(title)}*\\n\\nНет записей`
  }
  
  let message = `📝 *${escapeMarkdownV2(title)}* \\(${escapeMarkdownV2(logs.length.toString())} записей\\):\\n\\n`
  
  logs.slice(0, 10).forEach(log => {
    const date = log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : ''
    const icon = log.success ? '✅' : '❌'
    
    message += `${icon} *${escapeMarkdownV2(date)}*\\n`
    message += `👤 Пользователь: ${escapeMarkdownV2(log.username || log.userId)}\\n`
    message += `🎯 Действие: ${escapeMarkdownV2(log.action)}\\n`
    
    if (log.errorMessage) {
      message += `⚠️ Ошибка: ${escapeMarkdownV2(log.errorMessage)}\\n`
    }
    
    if (log.duration) {
      message += `⏱️ Время: ${escapeMarkdownV2(log.duration.toString())} мс\\n`
    }
    
    message += `\\n`
  })
  
  if (logs.length > 10) {
    message += `\\.\\.\\. и еще ${escapeMarkdownV2((logs.length - 10).toString())} записей`
  }
  
  return message
}