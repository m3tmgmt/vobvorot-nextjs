/**
 * Production-ready logging utility for API routes
 * Provides structured logging with different levels and sanitization
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Sanitizes sensitive data from objects to prevent data leaks
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'auth',
      'cookie',
      'session',
      'apikey',
      'api_key',
      'client_secret',
      'access_token',
      'refresh_token',
      'private_key',
      'credit_card',
      'card_number',
      'cvv',
      'ssn',
      'social_security'
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const [key, value] of Object.entries(sanitized)) {
      const keyLower = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitiveKey => keyLower.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }

  /**
   * Creates a structured log entry
   */
  private createLogEntry(level: string, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
    };

    if (context) {
      entry.context = this.sanitizeData(context);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(this.isDevelopment && error.stack && { stack: error.stack })
      };
    }

    return entry;
  }

  /**
   * Outputs log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry, null, this.isDevelopment ? 2 : 0);

    if (this.isDevelopment) {
      // In development, use console for better formatting
      switch (entry.level) {
        case 'ERROR':
          console.error(logString);
          break;
        case 'WARN':
          console.warn(logString);
          break;
        case 'INFO':
          console.info(logString);
          break;
        case 'DEBUG':
          console.log(logString);
          break;
        default:
          console.log(logString);
      }
    } else {
      // In production, use console.log for structured logging
      console.log(logString);
    }
  }

  /**
   * Logs error messages with optional context and error object
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (this.logLevel >= LogLevel.ERROR) {
      this.output(this.createLogEntry('error', message, context, error));
    }
  }

  /**
   * Logs warning messages with optional context
   */
  warn(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.WARN) {
      this.output(this.createLogEntry('warn', message, context));
    }
  }

  /**
   * Logs info messages with optional context
   */
  info(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.INFO) {
      this.output(this.createLogEntry('info', message, context));
    }
  }

  /**
   * Logs debug messages with optional context (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.output(this.createLogEntry('debug', message, context));
    }
  }

  /**
   * Creates a child logger with additional context that will be included in all logs
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalOutput = childLogger.output.bind(childLogger);
    
    childLogger.output = (entry: LogEntry) => {
      entry.context = { ...context, ...entry.context };
      originalOutput(entry);
    };
    
    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for context
export type { LogContext };