# Email Service Documentation

## Overview

Этот проект включает полнофункциональный email сервис на базе Resend API для отправки уведомлений о заказах и маркетинговых писем.

## Настройка

### 1. Переменные окружения

Добавьте следующие переменные в ваш `.env` файл:

```env
# Email Service (Resend)
RESEND_API_KEY=re_your-resend-api-key
FROM_EMAIL=store@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### 2. Получение Resend API ключа

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Подтвердите ваш домен
3. Создайте API ключ в панели управления
4. Добавьте ключ в переменную `RESEND_API_KEY`

## Функциональность

### Автоматические email уведомления

1. **Подтверждение заказа** - отправляется покупателю после создания заказа
2. **Уведомление админу** - отправляется администратору о новом заказе  
3. **Обновление статуса** - отправляется покупателю при изменении статуса заказа

### Email шаблоны

Все шаблоны созданы с responsive дизайном и включают:

- HTML версию с красивой версткой
- Текстовую версию для совместимости
- Персонализацию (имя клиента, данные заказа)
- Корпоративный стиль

### API Endpoints

#### 1. Тестирование email - `/api/test/email`

```javascript
// POST запрос
{
  "type": "test|order-confirmation|admin-notification|status-update",
  "email": "test@example.com"
}
```

#### 2. Обновление статуса заказа - `/api/orders/[id]/status`

```javascript
// PATCH запрос
{
  "status": "SHIPPED",
  "trackingNumber": "TRACK123456"
}
```

#### 3. Массовые email - `/api/admin/email/bulk`

```javascript
// Массовые уведомления
{
  "action": "bulk-notifications",
  "type": "status-update",
  "status": "SHIPPED",
  "dateFrom": "2024-01-01"
}

// Маркетинговые письма
{
  "action": "marketing",
  "subject": "Special Offer",
  "htmlContent": "<h1>Hello {{customerName}}!</h1>",
  "onlyRecentCustomers": true,
  "daysBack": 30
}

// Статистика
{
  "action": "stats",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31"
}
```

## Тестирование

### 1. Через админ панель

Перейдите на `/admin/email-test` для интерактивного тестирования всех типов писем.

### 2. Через API

```bash
# Тестовое письмо
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "email": "your-email@example.com"}'

# Подтверждение заказа
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"type": "order-confirmation", "email": "your-email@example.com"}'
```

## Структура файлов

```
src/
├── lib/
│   ├── email.ts              # Основной email сервис
│   └── email-utils.ts        # Утилиты для массовых рассылок
├── app/
│   ├── api/
│   │   ├── test/email/       # Тестирование email
│   │   ├── orders/[id]/status/ # Обновление статуса
│   │   └── admin/email/bulk/ # Массовые рассылки
│   └── admin/
│       └── email-test/       # Админ панель тестирования
```

## Использование в коде

### Отправка подтверждения заказа

```typescript
import { emailService } from '@/lib/email'

const emailData = {
  orderNumber: 'EXV-123456',
  customerName: 'John Doe',
  customerEmail: 'customer@example.com',
  items: [...],
  total: 99.99,
  // ...другие поля
}

await emailService.sendOrderConfirmation(emailData)
```

### Отправка уведомления о статусе

```typescript
await emailService.sendOrderStatusUpdate({
  ...emailData,
  status: 'SHIPPED',
  trackingNumber: 'TRACK123'
})
```

## Обработка ошибок

Все email функции используют try-catch блоки. Ошибки отправки email не прерывают основные процессы (создание заказа, обновление статуса).

```typescript
try {
  await emailService.sendOrderConfirmation(emailData)
  console.log('Email sent successfully')
} catch (error) {
  console.error('Email failed:', error)
  // Процесс продолжается
}
```

## Rate Limiting

- Добавлены задержки между массовыми рассылками
- Рекомендуется не отправлять более 100 писем в минуту
- Используйте bulk API для больших объемов

## Персонализация

В маркетинговых письмах доступны плейсхолдеры:

- `{{customerName}}` - имя клиента
- `{{email}}` - email клиента

## Мониторинг

Все операции логируются в консоль. Для production рекомендуется:

1. Настроить логирование в файлы/сервисы
2. Добавить метрики отправки
3. Настроить алерты на ошибки

## Развитие

### Добавление новых типов писем

1. Создайте интерфейс для данных
2. Добавьте функцию генерации шаблона
3. Добавьте метод в `emailService`
4. Обновите API endpoints

### Кастомизация шаблонов

Все HTML шаблоны находятся в функциях генерации в `email.ts`. Можно:

- Изменить стили
- Добавить логотип компании
- Настроить цветовую схему
- Добавить дополнительные блоки

## Troubleshooting

### Email не отправляются

1. Проверьте `RESEND_API_KEY`
2. Убедитесь что домен подтвержден в Resend
3. Проверьте логи на ошибки API
4. Используйте тестовый endpoint для диагностики

### Некорректное отображение

1. Проверьте HTML валидность шаблонов
2. Тестируйте в разных email клиентах
3. Используйте текстовую версию как fallback

### Rate limiting

1. Уменьшите частоту отправки
2. Используйте bulk API для больших объемов
3. Реализуйте очереди для массовых рассылок