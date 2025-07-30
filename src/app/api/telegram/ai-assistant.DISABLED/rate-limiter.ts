// Rate limiter для ограничения запросов к Gemini API

interface UserRateInfo {
  requests: number
  resetTime: number
}

class RateLimiter {
  private userLimits: Map<string, UserRateInfo> = new Map()
  private readonly maxRequestsPerMinute = 10 // Ограничение на пользователя
  private readonly globalMaxRequestsPerMinute = 50 // Глобальное ограничение (Gemini лимит 60)
  private globalRequests = 0
  private globalResetTime = Date.now() + 60000

  // Проверка лимита для пользователя
  checkUserLimit(userId: string): { allowed: boolean; resetIn?: number } {
    const now = Date.now()
    
    // Проверка глобального лимита
    if (now > this.globalResetTime) {
      this.globalRequests = 0
      this.globalResetTime = now + 60000
    }
    
    if (this.globalRequests >= this.globalMaxRequestsPerMinute) {
      return { 
        allowed: false, 
        resetIn: Math.ceil((this.globalResetTime - now) / 1000) 
      }
    }
    
    // Проверка лимита пользователя
    const userInfo = this.userLimits.get(userId)
    
    if (!userInfo || now > userInfo.resetTime) {
      // Новый период для пользователя
      this.userLimits.set(userId, {
        requests: 1,
        resetTime: now + 60000
      })
      this.globalRequests++
      return { allowed: true }
    }
    
    if (userInfo.requests >= this.maxRequestsPerMinute) {
      return { 
        allowed: false, 
        resetIn: Math.ceil((userInfo.resetTime - now) / 1000) 
      }
    }
    
    // Увеличиваем счетчик
    userInfo.requests++
    this.globalRequests++
    return { allowed: true }
  }
  
  // Очистка старых записей (вызывать периодически)
  cleanup() {
    const now = Date.now()
    for (const [userId, info] of this.userLimits.entries()) {
      if (now > info.resetTime + 300000) { // 5 минут после сброса
        this.userLimits.delete(userId)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Очистка каждые 5 минут
setInterval(() => {
  rateLimiter.cleanup()
}, 300000)