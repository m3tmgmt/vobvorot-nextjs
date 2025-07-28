import { NextRequest } from 'next/server'

export class CSRFProtection {
  private static readonly CSRF_TOKEN_HEADER = 'x-csrf-token'
  private static readonly CSRF_TOKEN_COOKIE = 'csrf-token'
  
  /**
   * Проверяет CSRF токен для защищенных endpoints
   */
  static async validateCSRFToken(request: NextRequest): Promise<boolean> {
    try {
      // Получаем токен из заголовка
      const tokenFromHeader = request.headers.get(this.CSRF_TOKEN_HEADER)
      
      // Получаем токен из cookies
      const tokenFromCookie = request.cookies.get(this.CSRF_TOKEN_COOKIE)?.value
      
      // Проверяем наличие обоих токенов
      if (!tokenFromHeader || !tokenFromCookie) {
        return false
      }
      
      // Проверяем что токены совпадают
      if (tokenFromHeader !== tokenFromCookie) {
        return false
      }
      
      // Проверяем базовый формат токена
      return this.isValidTokenFormat(tokenFromHeader)
      
    } catch (error) {
      return false
    }
  }
  
  /**
   * Генерирует CSRF токен для пользователя
   */
  static generateTokenForUser(userId: string): string {
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2)
    const userPart = Buffer.from(userId).toString('base64').substring(0, 8)
    
    return `csrf_${timestamp}_${userPart}_${randomPart}`
  }
  
  /**
   * Генерирует базовый CSRF токен для анонимных пользователей
   */
  static generateAnonymousToken(): string {
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2)
    
    return `csrf_anon_${timestamp}_${randomPart}`
  }
  
  /**
   * Проверяет формат токена
   */
  private static isValidTokenFormat(token: string): boolean {
    // Проверяем что токен начинается с csrf_ и имеет правильную структуру
    const csrfPattern = /^csrf_(anon_)?\d+_.+$/
    return csrfPattern.test(token)
  }
  
  /**
   * Middleware для защиты API endpoints
   */
  static async protectEndpoint(request: NextRequest): Promise<{ isValid: boolean; error?: string }> {
    // Методы, требующие CSRF защиты
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
    
    if (!protectedMethods.includes(request.method)) {
      return { isValid: true }
    }
    
    // Исключения - endpoints которые имеют свою защиту или специальную логику
    const exemptPaths = [
      '/api/auth/',
      '/api/webhooks/',
      '/api/payment/westernbid/redirect',
      '/api/telegram/webhook',
      '/api/sign-orders', // Специальный endpoint для заказов подписей
      '/api/letters', // Endpoint для отправки писем в будущее
      '/api/cart/reserve' // Cart reservation использует свою логику
    ]
    
    const isExempt = exemptPaths.some(path => request.nextUrl.pathname.startsWith(path))
    if (isExempt) {
      return { isValid: true }
    }
    
    const isValid = await this.validateCSRFToken(request)
    
    return {
      isValid,
      error: isValid ? undefined : 'Invalid or missing CSRF token'
    }
  }
}

/**
 * React Hook для получения CSRF токена на клиенте
 */
export function useCSRFToken() {
  const getCSRFToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/auth/csrf')
      const data = await response.json()
      
      if (data.success) {
        return data.data.token
      }
      
      throw new Error('Failed to get CSRF token')
    } catch (error) {
      console.error('Error getting CSRF token:', error)
      throw error
    }
  }
  
  return { getCSRFToken }
}