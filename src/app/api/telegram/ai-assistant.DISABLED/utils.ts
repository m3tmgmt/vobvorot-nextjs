// Утилиты для AI агента

// Экранирование специальных символов для MarkdownV2
export function escapeMarkdownV2(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return ''
  
  const str = String(text)
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
  
  let escaped = str
  for (const char of specialChars) {
    escaped = escaped.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`)
  }
  
  return escaped
}

// Форматирование даты для отображения
export function formatDate(date: Date): string {
  return date.toLocaleString('ru', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Форматирование цены
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}