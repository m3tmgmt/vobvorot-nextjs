/**
 * Secure logging system for production use
 * Replaces console.log statements with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  requestId?: string
}

class SecureLogger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  private sanitizeData(data: any): any {
    if (!data) return data
    
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'credential', 
      'authorization', 'cookie', 'session', 'api_key',
      'credit_card', 'ssn', 'phone', 'email'
    ]
    
    const sanitized = JSON.parse(JSON.stringify(data))
    
    const sanitizeRecursive = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj
      
      for (const key in obj) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]'
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitizeRecursive(obj[key])
        }
      }
      return obj
    }
    
    return sanitizeRecursive(sanitized)
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: this.sanitizeData(data)
    }
  }

  private writeLog(entry: LogEntry): void {
    if (this.isDevelopment) {
      // In development, use console for easier debugging
      const logMethod = entry.level === 'error' ? console.error : 
                       entry.level === 'warn' ? console.warn : console.log
      logMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.data || '')
    } else if (this.isProduction) {
      // In production, write to structured output (could be sent to logging service)
      process.stdout.write(JSON.stringify(entry) + '\n')
    }
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.writeLog(this.createLogEntry('debug', message, data))
    }
  }

  info(message: string, data?: any): void {
    this.writeLog(this.createLogEntry('info', message, data))
  }

  warn(message: string, data?: any): void {
    this.writeLog(this.createLogEntry('warn', message, data))
  }

  error(message: string, error?: any): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: this.isProduction ? undefined : error.stack
    } : error

    this.writeLog(this.createLogEntry('error', message, errorData))
  }

  // Security-specific logging
  security(message: string, data?: any): void {
    this.writeLog({
      ...this.createLogEntry('warn', `SECURITY: ${message}`, data),
      category: 'security'
    } as LogEntry & { category: string })
  }

  // API request logging
  apiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    this.info('API Request', {
      method,
      path,
      statusCode,
      duration,
      userId: userId || 'anonymous'
    })
  }

  // Payment logging (with extra security)
  payment(message: string, orderId?: string, amount?: number): void {
    this.info(`PAYMENT: ${message}`, {
      orderId,
      amount: amount ? `$${amount}` : undefined,
      timestamp: new Date().toISOString()
    })
  }
}

export const logger = new SecureLogger()

// Utility functions for common patterns
export const logApiError = (error: unknown, context: string) => {
  logger.error(`API Error in ${context}`, error)
}

export const logAuthEvent = (event: string, userId?: string, details?: any) => {
  logger.security(`Auth Event: ${event}`, { userId, ...details })
}

export const logPaymentEvent = (event: string, orderId: string, details?: any) => {
  logger.payment(`Payment Event: ${event}`, orderId, details?.amount)
}