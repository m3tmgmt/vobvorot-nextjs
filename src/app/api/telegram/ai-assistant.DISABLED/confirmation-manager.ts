// Менеджер подтверждений для критичных операций

export interface PendingConfirmation {
  userId: string
  action: string
  params: any
  expiresAt: number
  messageId?: number
}

class ConfirmationManager {
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map()
  private readonly confirmationTimeout = 60000 // 1 минута

  // Создать запрос на подтверждение
  createConfirmation(userId: string, action: string, params: any, messageId?: number): string {
    const confirmationId = `${userId}_${Date.now()}`
    
    this.pendingConfirmations.set(confirmationId, {
      userId,
      action,
      params,
      expiresAt: Date.now() + this.confirmationTimeout,
      messageId
    })
    
    // Автоматическое удаление через таймаут
    setTimeout(() => {
      this.pendingConfirmations.delete(confirmationId)
    }, this.confirmationTimeout)
    
    return confirmationId
  }
  
  // Получить последнее подтверждение для пользователя
  getLastConfirmation(userId: string): PendingConfirmation | null {
    const now = Date.now()
    
    // Ищем последнее активное подтверждение
    for (const [id, confirmation] of this.pendingConfirmations.entries()) {
      if (confirmation.userId === userId && confirmation.expiresAt > now) {
        // Удаляем использованное подтверждение
        this.pendingConfirmations.delete(id)
        return confirmation
      }
    }
    
    return null
  }
  
  // Отменить все подтверждения пользователя
  cancelUserConfirmations(userId: string) {
    for (const [id, confirmation] of this.pendingConfirmations.entries()) {
      if (confirmation.userId === userId) {
        this.pendingConfirmations.delete(id)
      }
    }
  }
  
  // Очистка истекших подтверждений
  cleanup() {
    const now = Date.now()
    for (const [id, confirmation] of this.pendingConfirmations.entries()) {
      if (confirmation.expiresAt < now) {
        this.pendingConfirmations.delete(id)
      }
    }
  }
}

export const confirmationManager = new ConfirmationManager()

// Очистка каждую минуту
setInterval(() => {
  confirmationManager.cleanup()
}, 60000)