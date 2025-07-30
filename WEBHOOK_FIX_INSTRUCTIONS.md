# Инструкции по исправлению Telegram Webhook

## Проблема
Webhook возвращает 401 Unauthorized из-за проблем с переменными окружения и проверкой secret token.

## Шаг 1: Исправить переменные окружения

### Вариант A: Через Vercel Dashboard (Рекомендуется)
1. Откройте https://vercel.com/dashboard
2. Выберите проект `vobvorot-nextjs`
3. Перейдите в Settings → Environment Variables
4. Обновите следующие переменные (убедитесь, что НЕТ лишних пробелов или новых строк):
   ```
   TELEGRAM_OWNER_CHAT_ID = 316593422,1837334996
   NEXTAUTH_URL = https://vobvorot.com
   NEXT_PUBLIC_BASE_URL = https://vobvorot.com
   NEXT_PUBLIC_API_URL = https://vobvorot.com
   TELEGRAM_WEBHOOK_SECRET = vobvorot_webhook_secret_2025
   ```

### Вариант B: Через CLI
```bash
# 1. Сделайте скрипт исполняемым
chmod +x fix-vercel-env-newlines.js

# 2. Запустите скрипт
./fix-vercel-env-newlines.js
```

## Шаг 2: Временно использовать отладочную версию

1. Переименуйте файлы:
```bash
# Сохраните текущую версию
mv src/app/api/telegram/ai-assistant/route.ts src/app/api/telegram/ai-assistant/route-original.ts

# Используйте отладочную версию
mv src/app/api/telegram/ai-assistant/route-debug.ts src/app/api/telegram/ai-assistant/route.ts
```

2. Закоммитьте и задеплойте:
```bash
git add .
git commit -m "debug: Use debug version of webhook handler to investigate 401 error"
git push
vercel --prod
```

3. Подождите 30 секунд и проверьте логи:
```bash
vercel logs --output raw -n 100 | grep "WEBHOOK DEBUG"
```

## Шаг 3: Проверить результаты

1. Проверьте webhook статус:
```bash
curl -s "https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/getWebhookInfo" | jq
```

2. Сделайте тестовый запрос:
```bash
curl -X POST "https://vobvorot-nextjs.vercel.app/api/telegram/ai-assistant" \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: vobvorot_webhook_secret_2025" \
  -d '{"message": {"text": "test", "chat": {"id": 316593422, "type": "private"}, "from": {"id": 316593422}}}'
```

## Шаг 4: Если проблема решена

1. Обновите основной файл с исправлениями:
```typescript
// В route.ts добавьте ручную проверку secret token
export async function POST(req: NextRequest) {
  try {
    // Проверяем secret token вручную
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || 'vobvorot_webhook_secret_2025'
    
    if (secretToken !== expectedToken) {
      console.error('Webhook unauthorized:', { received: secretToken, expected: expectedToken })
      return new Response('Unauthorized', { status: 401 })
    }
    
    const bot = await createBot()
    
    // Используем webhookCallback без опций secretToken
    const handleUpdate = webhookCallback(bot, 'std/http')
    
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}
```

2. Деплой финальной версии:
```bash
git add .
git commit -m "fix: Add manual secret token validation for webhook"
git push
vercel --prod
```

## Альтернативное решение

Если проблема не решается, можно использовать другой эндпойнт:
1. Создайте новый webhook URL: `/api/telegram/webhook-v2`
2. Используйте простую проверку без Grammy
3. Обновите webhook в Telegram на новый URL

## Контакты для помощи

Если проблема сохраняется:
1. Проверьте логи Vercel: https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs
2. Проверьте переменные окружения в Vercel Dashboard
3. Убедитесь, что deployment успешный