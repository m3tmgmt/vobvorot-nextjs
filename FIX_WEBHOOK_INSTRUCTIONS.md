# 🚨 СРОЧНО: Инструкция по исправлению Telegram Webhook

## Проблема
Webhook возвращает 401 Unauthorized, потому что переменная `TELEGRAM_WEBHOOK_SECRET` не установлена в Vercel.

## Решение

### Вариант 1: Через Vercel Dashboard (РЕКОМЕНДУЕТСЯ)

1. Перейдите по ссылке:
   https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs/settings/environment-variables

2. Нажмите "Add New" и добавьте:
   - **Key**: `TELEGRAM_WEBHOOK_SECRET`
   - **Value**: `vobvorot_webhook_secret_2025` (БЕЗ КАВЫЧЕК!)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development

3. Нажмите "Save"

4. **ВАЖНО**: Нужно передеплоить проект!
   - Перейдите в Deployments
   - Нажмите на три точки рядом с последним деплоем
   - Выберите "Redeploy"

### Вариант 2: Через Vercel CLI

```bash
# Установите Vercel CLI если нет
npm i -g vercel

# Авторизуйтесь
vercel login

# Добавьте переменную
vercel env add TELEGRAM_WEBHOOK_SECRET production
# Введите: vobvorot_webhook_secret_2025

# Передеплойте
vercel --prod
```

### Вариант 3: Временное решение (БЕЗ ЗАЩИТЫ)

Я создал временный webhook без проверки токена:
```
https://vobvorot.com/api/telegram/webhook-temp
```

Чтобы его использовать:
```bash
curl -X POST "https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://vobvorot.com/api/telegram/webhook-temp"}'
```

⚠️ **ВНИМАНИЕ**: Этот webhook НЕ ЗАЩИЩЕН токеном! Используйте только для тестирования!

## Проверка

После установки переменной и редеплоя, проверьте:

```bash
# Проверить статус webhook
curl "https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/getWebhookInfo"

# Если все хорошо, вы увидите:
# - url: https://vobvorot.com/api/telegram/ai-assistant
# - last_error_message: null (или отсутствует)
```

## Дополнительные переменные для проверки

Убедитесь, что в Vercel установлены ВСЕ эти переменные:
- `DATABASE_URL` ✅
- `TELEGRAM_BOT_TOKEN` ❓
- `TELEGRAM_BOT_USERNAME` ❓
- `TELEGRAM_OWNER_CHAT_ID` ❓
- `TELEGRAM_WEBHOOK_SECRET` ❌ (НУЖНО ДОБАВИТЬ!)
- `ADMIN_API_KEY` ❓
- `NEXTAUTH_SECRET` ❓
- `GEMINI_API_KEY` ❓

## Контакты для помощи

Если нужна помощь с Vercel:
- Документация: https://vercel.com/docs/environment-variables
- Support: https://vercel.com/support