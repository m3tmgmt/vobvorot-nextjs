# Исправление проблемы с Telegram Webhook

## Проблема
Telegram webhook возвращает 401 Unauthorized из-за того, что переменные окружения не применились на Vercel.

## Статус
- ✅ TELEGRAM_WEBHOOK_SECRET установлен в .env.vercel
- ✅ GEMINI_API_KEY установлен в .env.vercel
- ❌ Переменные не применяются на production Vercel
- ❌ Webhook возвращает 401 Unauthorized

## Решение

### Вариант 1: Через Vercel Dashboard (Рекомендуется)
1. Откройте https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs
2. Перейдите в Settings → Environment Variables
3. Добавьте следующие переменные для Production:
   - `TELEGRAM_WEBHOOK_SECRET` = `vobvorot_webhook_secret_2025`
   - `GEMINI_API_KEY` = `AIzaSyAYSLsD4XW40XJm5uv6w71bYoZkTAeoU7Y`
4. Нажмите Save
5. Сделайте redeploy последнего deployment

### Вариант 2: Через Vercel CLI
```bash
# Установите Vercel CLI если еще не установлен
npm i -g vercel

# Залогиньтесь
vercel login

# Добавьте переменные окружения
vercel env add TELEGRAM_WEBHOOK_SECRET production
# Введите: vobvorot_webhook_secret_2025

vercel env add GEMINI_API_KEY production  
# Введите: AIzaSyAYSLsD4XW40XJm5uv6w71bYoZkTAeoU7Y

# Проверьте что переменные добавлены
vercel env ls production

# Сделайте redeploy
vercel --prod
```

### Вариант 3: Через GitHub Secrets (если настроена GitHub интеграция)
1. Откройте https://github.com/m3tmgmt/vobvorot-nextjs/settings/secrets/actions
2. Добавьте секреты:
   - `TELEGRAM_WEBHOOK_SECRET`
   - `GEMINI_API_KEY`
3. Обновите GitHub Actions workflow для передачи секретов в Vercel

## Проверка после исправления

### 1. Проверка переменных окружения
```bash
curl -X GET https://vobvorot.com/api/test-env \
  -H "Authorization: Bearer f6fef89ba9756e14e153aaa972dfa42bc21b64f858f084a59ae882107f41e7a5"
```

### 2. Проверка webhook
```bash
curl -X POST https://vobvorot.com/api/telegram/ai-assistant \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: vobvorot_webhook_secret_2025" \
  -d '{"message":{"message_id":1,"from":{"id":"316593422","username":"admin"},"chat":{"id":"316593422"},"text":"/start"}}'
```

### 3. Проверка статуса webhook в Telegram
```bash
curl https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/getWebhookInfo
```

## Ожидаемый результат
После применения переменных окружения webhook должен возвращать 200 OK и бот должен отвечать на команды.