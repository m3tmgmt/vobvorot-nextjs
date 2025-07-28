import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Payment Log Levels
export enum PaymentLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Payment Log Entry Interface
export interface PaymentLogEntry {
  timestamp: string
  level: PaymentLogLevel
  category: 'PAYMENT' | 'WEBHOOK' | 'REFUND' | 'SECURITY' | 'API'
  message: string
  orderId?: string
  paymentId?: string
  userId?: string
  amount?: number
  currency?: string
  gateway: 'WESTERNBID' | 'MOCK'
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  request?: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: any
  }
  response?: {
    status: number
    headers?: Record<string, string>
    body?: any
  }
  duration?: number
  ipAddress?: string
  userAgent?: string
}

// Payment Logger Configuration
interface PaymentLoggerConfig {
  enableFileLogging: boolean
  enableConsoleLogging: boolean
  logDirectory: string
  maxFileSize: number
  maxFiles: number
  logLevel: PaymentLogLevel
  enableSensitiveDataMasking: boolean
  enableWebhookLogging: boolean
  enableSecurityLogging: boolean
}

// Enhanced Payment Logger Class
export class PaymentLogger {
  private config: PaymentLoggerConfig
  private logBuffer: PaymentLogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.config = {
      enableFileLogging: process.env.PAYMENT_LOG_FILE === 'true',
      enableConsoleLogging: process.env.NODE_ENV !== 'production' || process.env.PAYMENT_LOG_CONSOLE === 'true',
      logDirectory: process.env.PAYMENT_LOG_DIR || './logs/payments',
      maxFileSize: parseInt(process.env.PAYMENT_LOG_MAX_SIZE || '10485760'), // 10MB
      maxFiles: parseInt(process.env.PAYMENT_LOG_MAX_FILES || '10'),
      logLevel: (process.env.PAYMENT_LOG_LEVEL as PaymentLogLevel) || PaymentLogLevel.INFO,
      enableSensitiveDataMasking: process.env.PAYMENT_LOG_MASK_SENSITIVE !== 'false',
      enableWebhookLogging: process.env.PAYMENT_LOG_WEBHOOKS !== 'false',
      enableSecurityLogging: process.env.PAYMENT_LOG_SECURITY !== 'false'
    }

    // Start periodic log flushing
    this.startLogFlushing()
  }

  // Log payment creation
  public logPaymentCreation(data: {
    orderId: string
    paymentId?: string
    userId?: string
    amount: number
    currency: string
    gateway: 'WESTERNBID' | 'MOCK'
    metadata?: Record<string, any>
    request?: any
    duration?: number
  }): void {
    this.log({
      level: PaymentLogLevel.INFO,
      category: 'PAYMENT',
      message: `Payment creation initiated for order ${data.orderId}`,
      orderId: data.orderId,
      paymentId: data.paymentId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      gateway: data.gateway,
      metadata: data.metadata,
      request: data.request ? this.sanitizeRequest(data.request) : undefined,
      duration: data.duration
    })
  }

  // Log payment completion
  public logPaymentCompletion(data: {
    orderId: string
    paymentId: string
    userId?: string
    amount: number
    currency: string
    gateway: 'WESTERNBID' | 'MOCK'
    transactionId?: string
    metadata?: Record<string, any>
    duration?: number
  }): void {
    this.log({
      level: PaymentLogLevel.INFO,
      category: 'PAYMENT',
      message: `Payment completed successfully for order ${data.orderId}`,
      orderId: data.orderId,
      paymentId: data.paymentId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      gateway: data.gateway,
      metadata: {
        ...data.metadata,
        transactionId: data.transactionId
      },
      duration: data.duration
    })
  }

  // Log payment failure
  public logPaymentFailure(data: {
    orderId: string
    paymentId?: string
    userId?: string
    amount: number
    currency: string
    gateway: 'WESTERNBID' | 'MOCK'
    error: Error | any
    metadata?: Record<string, any>
    duration?: number
  }): void {
    this.log({
      level: PaymentLogLevel.ERROR,
      category: 'PAYMENT',
      message: `Payment failed for order ${data.orderId}`,
      orderId: data.orderId,
      paymentId: data.paymentId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      gateway: data.gateway,
      metadata: data.metadata,
      error: this.sanitizeError(data.error),
      duration: data.duration
    })
  }

  // Log webhook events
  public logWebhook(data: {
    event: string
    orderId?: string
    paymentId?: string
    status: string
    gateway: 'WESTERNBID' | 'MOCK'
    payload?: any
    signature?: string
    verified: boolean
    ipAddress?: string
    userAgent?: string
    metadata?: Record<string, any>
  }): void {
    if (!this.config.enableWebhookLogging) return

    this.log({
      level: PaymentLogLevel.INFO,
      category: 'WEBHOOK',
      message: `Webhook ${data.event} received for ${data.orderId || data.paymentId}`,
      orderId: data.orderId,
      paymentId: data.paymentId,
      gateway: data.gateway,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        ...data.metadata,
        event: data.event,
        status: data.status,
        verified: data.verified,
        signature: data.signature ? this.maskSensitiveData(data.signature) : undefined,
        payload: data.payload ? this.sanitizeWebhookPayload(data.payload) : undefined
      }
    })
  }

  // Log security events
  public logSecurityEvent(data: {
    event: 'SIGNATURE_VERIFICATION_FAILED' | 'INVALID_WEBHOOK' | 'SUSPICIOUS_REQUEST' | 'RATE_LIMIT_EXCEEDED'
    message: string
    orderId?: string
    paymentId?: string
    ipAddress?: string
    userAgent?: string
    metadata?: Record<string, any>
  }): void {
    if (!this.config.enableSecurityLogging) return

    this.log({
      level: PaymentLogLevel.WARN,
      category: 'SECURITY',
      message: `Security event: ${data.event} - ${data.message}`,
      orderId: data.orderId,
      paymentId: data.paymentId,
      gateway: 'WESTERNBID',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        ...data.metadata,
        securityEvent: data.event
      }
    })
  }

  // Log API calls
  public logAPICall(data: {
    method: string
    url: string
    gateway: 'WESTERNBID' | 'MOCK'
    orderId?: string
    paymentId?: string
    request?: any
    response?: any
    duration: number
    success: boolean
    error?: Error | any
  }): void {
    this.log({
      level: data.success ? PaymentLogLevel.DEBUG : PaymentLogLevel.ERROR,
      category: 'API',
      message: `API call ${data.method} ${data.url} ${data.success ? 'succeeded' : 'failed'}`,
      orderId: data.orderId,
      paymentId: data.paymentId,
      gateway: data.gateway,
      request: data.request ? this.sanitizeRequest(data.request) : undefined,
      response: data.response ? this.sanitizeResponse(data.response) : undefined,
      duration: data.duration,
      error: data.error ? this.sanitizeError(data.error) : undefined
    })
  }

  // Log refund operations
  public logRefund(data: {
    type: 'REFUND_INITIATED' | 'REFUND_COMPLETED' | 'REFUND_FAILED'
    orderId: string
    paymentId: string
    refundId?: string
    amount: number
    currency: string
    reason: string
    gateway: 'WESTERNBID' | 'MOCK'
    userId?: string
    metadata?: Record<string, any>
    error?: Error | any
  }): void {
    this.log({
      level: data.type === 'REFUND_FAILED' ? PaymentLogLevel.ERROR : PaymentLogLevel.INFO,
      category: 'REFUND',
      message: `${data.type} for order ${data.orderId}`,
      orderId: data.orderId,
      paymentId: data.paymentId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      gateway: data.gateway,
      metadata: {
        ...data.metadata,
        refundId: data.refundId,
        reason: data.reason,
        type: data.type
      },
      error: data.error ? this.sanitizeError(data.error) : undefined
    })
  }

  // Core logging method
  private log(entry: Partial<PaymentLogEntry>): void {
    const logEntry: PaymentLogEntry = {
      timestamp: new Date().toISOString(),
      level: entry.level || PaymentLogLevel.INFO,
      category: entry.category || 'PAYMENT',
      message: entry.message || '',
      gateway: entry.gateway || 'WESTERNBID',
      ...entry
    }

    // Check log level
    if (!this.shouldLog(logEntry.level)) {
      return
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry)
    }

    // File logging
    if (this.config.enableFileLogging) {
      this.logBuffer.push(logEntry)
    }
  }

  // Console logging with colors
  private logToConsole(entry: PaymentLogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.category}]`
    const message = `${prefix} ${entry.message}`
    
    const context = {
      orderId: entry.orderId,
      paymentId: entry.paymentId,
      amount: entry.amount,
      currency: entry.currency,
      gateway: entry.gateway,
      duration: entry.duration,
      ...(entry.metadata || {})
    }

    const filteredContext = Object.fromEntries(
      Object.entries(context).filter(([_, value]) => value !== undefined)
    )

    switch (entry.level) {
      case PaymentLogLevel.DEBUG:
        console.debug(message, Object.keys(filteredContext).length > 0 ? filteredContext : '')
        break
      case PaymentLogLevel.INFO:
        console.info(message, Object.keys(filteredContext).length > 0 ? filteredContext : '')
        break
      case PaymentLogLevel.WARN:
        console.warn(message, Object.keys(filteredContext).length > 0 ? filteredContext : '')
        break
      case PaymentLogLevel.ERROR:
      case PaymentLogLevel.CRITICAL:
        console.error(message, Object.keys(filteredContext).length > 0 ? filteredContext : '')
        if (entry.error) {
          console.error('Error details:', entry.error)
        }
        break
    }
  }

  // Check if log level should be logged
  private shouldLog(level: PaymentLogLevel): boolean {
    const levels = [
      PaymentLogLevel.DEBUG,
      PaymentLogLevel.INFO,
      PaymentLogLevel.WARN,
      PaymentLogLevel.ERROR,
      PaymentLogLevel.CRITICAL
    ]
    
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const logLevelIndex = levels.indexOf(level)
    
    return logLevelIndex >= currentLevelIndex
  }

  // Start periodic log flushing
  private startLogFlushing(): void {
    if (!this.config.enableFileLogging) return

    this.flushInterval = setInterval(() => {
      this.flushLogs().catch(error => {
        console.error('Failed to flush payment logs:', error)
      })
    }, 5000) // Flush every 5 seconds
  }

  // Flush logs to file
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return

    try {
      // Ensure log directory exists
      if (!existsSync(this.config.logDirectory)) {
        await mkdir(this.config.logDirectory, { recursive: true })
      }

      // Get current date for log file name
      const date = new Date().toISOString().split('T')[0]
      const logFileName = `payment-${date}.log`
      const logFilePath = join(this.config.logDirectory, logFileName)

      // Prepare log entries for writing
      const logLines = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n'

      // Write to file
      await writeFile(logFilePath, logLines, { flag: 'a' })

      // Clear buffer
      this.logBuffer = []

    } catch (error) {
      console.error('Failed to write payment logs to file:', error)
    }
  }

  // Sanitize request data
  private sanitizeRequest(request: any): any {
    if (!request) return undefined

    const sanitized = { ...request }

    // Remove sensitive headers
    if (sanitized.headers) {
      const sensitiveHeaders = ['authorization', 'x-signature', 'x-webhook-signature', 'cookie']
      for (const header of sensitiveHeaders) {
        if (sanitized.headers[header]) {
          sanitized.headers[header] = this.maskSensitiveData(sanitized.headers[header])
        }
      }
    }

    // Sanitize body
    if (sanitized.body) {
      sanitized.body = this.sanitizePayload(sanitized.body)
    }

    return sanitized
  }

  // Sanitize response data
  private sanitizeResponse(response: any): any {
    if (!response) return undefined

    const sanitized = { ...response }

    // Remove sensitive headers
    if (sanitized.headers) {
      const sensitiveHeaders = ['set-cookie', 'authorization']
      for (const header of sensitiveHeaders) {
        if (sanitized.headers[header]) {
          sanitized.headers[header] = '[MASKED]'
        }
      }
    }

    // Sanitize body
    if (sanitized.body) {
      sanitized.body = this.sanitizePayload(sanitized.body)
    }

    return sanitized
  }

  // Sanitize webhook payload
  private sanitizeWebhookPayload(payload: any): any {
    if (!payload) return undefined

    const sanitized = { ...payload }

    // Remove or mask sensitive fields
    const sensitiveFields = ['signature', 'secret', 'token', 'key']
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = this.maskSensitiveData(sanitized[field])
      }
    }

    return sanitized
  }

  // Sanitize general payload
  private sanitizePayload(payload: any): any {
    if (!this.config.enableSensitiveDataMasking) return payload
    if (!payload) return undefined

    const sensitized = { ...payload }

    // Fields to mask
    const sensitiveFields = [
      'secret_key', 'webhook_secret', 'api_key', 'token',
      'password', 'card_number', 'cvv', 'expiry',
      'bank_account', 'routing_number', 'ssn'
    ]

    for (const field of sensitiveFields) {
      if (sensitized[field]) {
        sensitized[field] = this.maskSensitiveData(sensitized[field])
      }
    }

    return sensitized
  }

  // Sanitize error data
  private sanitizeError(error: any): any {
    if (!error) return undefined

    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }

  // Mask sensitive data
  private maskSensitiveData(data: string): string {
    if (!this.config.enableSensitiveDataMasking) return data
    if (!data || data.length <= 4) return '[MASKED]'
    
    return data.substring(0, 4) + '*'.repeat(Math.max(data.length - 8, 0)) + data.substring(data.length - 4)
  }

  // Get payment logs for debugging
  public async getRecentLogs(filters?: {
    orderId?: string
    paymentId?: string
    level?: PaymentLogLevel
    category?: string
    limit?: number
  }): Promise<PaymentLogEntry[]> {
    // This would typically read from log files or database
    // For now, return recent buffer entries
    let logs = [...this.logBuffer]

    if (filters?.orderId) {
      logs = logs.filter(log => log.orderId === filters.orderId)
    }

    if (filters?.paymentId) {
      logs = logs.filter(log => log.paymentId === filters.paymentId)
    }

    if (filters?.level) {
      logs = logs.filter(log => log.level === filters.level)
    }

    if (filters?.category) {
      logs = logs.filter(log => log.category === filters.category)
    }

    return logs.slice(-(filters?.limit || 100))
  }

  // Cleanup method
  public cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    // Flush remaining logs
    this.flushLogs().catch(error => {
      console.error('Failed to flush logs during cleanup:', error)
    })
  }
}

// Export singleton instance
export const paymentLogger = new PaymentLogger()

// Export helper functions for specific use cases
export const logPaymentCreation = (data: Parameters<PaymentLogger['logPaymentCreation']>[0]) => 
  paymentLogger.logPaymentCreation(data)

export const logPaymentCompletion = (data: Parameters<PaymentLogger['logPaymentCompletion']>[0]) => 
  paymentLogger.logPaymentCompletion(data)

export const logPaymentFailure = (data: Parameters<PaymentLogger['logPaymentFailure']>[0]) => 
  paymentLogger.logPaymentFailure(data)

export const logWebhook = (data: Parameters<PaymentLogger['logWebhook']>[0]) => 
  paymentLogger.logWebhook(data)

export const logSecurityEvent = (data: Parameters<PaymentLogger['logSecurityEvent']>[0]) => 
  paymentLogger.logSecurityEvent(data)

export const logAPICall = (data: Parameters<PaymentLogger['logAPICall']>[0]) => 
  paymentLogger.logAPICall(data)

export const logRefund = (data: Parameters<PaymentLogger['logRefund']>[0]) => 
  paymentLogger.logRefund(data)