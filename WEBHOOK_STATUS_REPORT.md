# Отчет о статусе Telegram Webhook

## Дата проверки: 2025-07-29

### Статус: ❌ Webhook возвращает 401 Unauthorized

## Детали проверки

### 1. Информация о Webhook (getWebhookInfo)
```json
{
  "ok": true,
  "result": {
    "url": "https://vobvorot-nextjs.vercel.app/api/telegram/ai-assistant",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 1753795516,
    "last_error_message": "Wrong response from the webhook: 401 Unauthorized",
    "max_connections": 40,
    "ip_address": "64.29.17.67",
    "allowed_updates": ["message", "callback_query"]
  }
}
```

### 2. Последний deployment
- **Deployment ID**: dpl_EDZbxZiQBXDKWfQVemHKHdJTQVCB
- **Статус**: READY
- **Коммит**: "fix: Use Grammy's built-in secret token validation instead of manual check"
- **Время**: 2025-07-29 13:27:40 UTC

### 3. Отладочная информация (debug endpoint)
```json
{
  "bot_token_exists": true,
  "bot_token_length": 47,
  "bot_token_prefix": "7700098378...",
  "webhook_secret_exists": true,
  "admin_ids_raw": "316593422,1837334996\n",  // ⚠️ Замечена новая строка в конце
  "admin_ids_processed": [
    {"original": "316593422", "trimmed": "316593422", "length": 9},
    {"original": "1837334996\n", "trimmed": "1837334996", "length": 10}  // ⚠️ 10 символов вместо 10
  ],
  "nextauth_url": "https://vobvorot.com\n",  // ⚠️ Новая строка
  "admin_api_key_exists": true,
  "internal_api_key_exists": true,
  "node_env": "production"
}
```

## Выявленные проблемы

### 1. **Проблема с переменными окружения**
В переменных окружения Vercel есть лишние символы новой строки:
- `TELEGRAM_OWNER_CHAT_ID` содержит `\n` в конце
- `NEXTAUTH_URL` содержит `\n` в конце

### 2. **401 Unauthorized продолжается**
Несмотря на правильную настройку Grammy webhook с secret token, ошибка 401 продолжается.

### 3. **Возможные причины:**
1. **Неправильная обработка secret token в Grammy**
2. **Проблема с форматом переменных окружения**
3. **Конфликт между разными эндпойнтами**

## Рекомендации для исправления

### 1. **Немедленные действия:**
1. Обновить переменные окружения в Vercel (убрать новые строки)
2. Добавить более детальное логирование в webhook handler
3. Проверить, что secret token передается правильно

### 2. **Код для исправления:**

```typescript
// Добавить в начало POST функции для отладки
export async function POST(req: NextRequest) {
  try {
    console.log('=== WEBHOOK DEBUG START ===')
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    console.log('Secret Token Expected:', process.env.TELEGRAM_WEBHOOK_SECRET?.trim())
    console.log('=== WEBHOOK DEBUG END ===')
    
    // Остальной код...
  } catch (error) {
    console.error('Webhook error details:', error)
    return new Response('Error', { status: 500 })
  }
}
```

### 3. **Проверка переменных окружения:**
```bash
# В Vercel CLI
vercel env pull
# Проверить .env.local на лишние символы
```

### 4. **Альтернативное решение:**
Если Grammy не работает правильно, можно вернуться к ручной проверке:
```typescript
const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET?.trim()) {
  return new Response('Unauthorized', { status: 401 })
}
```

## Следующие шаги

1. **Исправить переменные окружения в Vercel**
2. **Добавить отладочное логирование**
3. **Передеплоить и проверить логи**
4. **Если проблема сохраняется - вернуться к ручной проверке**

## Команды для проверки

```bash
# Проверить webhook статус
curl -s "https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/getWebhookInfo" | jq

# Тест webhook напрямую
curl -X POST "https://vobvorot-nextjs.vercel.app/api/telegram/ai-assistant" \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: vobvorot_webhook_secret_2025" \
  -d '{"message": {"text": "test", "chat": {"id": 1}}}'

# Проверить логи Vercel (требует вход)
vercel logs --output raw -n 100 | grep -E "(telegram|webhook|401)"
```