# 🚀 QUICK REFERENCE - КОМАНДЫ ДЛЯ ПРОВЕРКИ

## 🔍 ПРОВЕРКА СТАТУСА

### Проверить health endpoint:
```bash
curl https://vobvorot-nextjs.vercel.app/api/health | jq
```

### Проверить webhook статус:
```bash
curl https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/getWebhookInfo | jq
```

### Проверить доступность сайта:
```bash
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://vobvorot.com
```

## 🤖 ТЕСТИРОВАНИЕ БОТА

### Отправить тестовое сообщение:
```bash
curl -X POST "https://vobvorot-nextjs.vercel.app/api/telegram/ai-assistant" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "from": {
        "id": 316593422,
        "is_bot": false,
        "first_name": "Test"
      },
      "chat": {
        "id": 316593422,
        "type": "private"
      },
      "date": 1753796000,
      "text": "Покажи заказы"
    }
  }'
```

## 📊 ЛОКАЛЬНОЕ ТЕСТИРОВАНИЕ

### Запустить бота локально:
```bash
cd /Users/matty/vobvorot-backup-latest/vobvorot-production
node telegram-bot.js
```

### Проверить базу данных:
```bash
cd /Users/matty/vobvorot-backup-latest/vobvorot-production
node test-direct-db.js
```

## 🔧 ПОЛЕЗНЫЕ ПЕРЕМЕННЫЕ

### Telegram Bot Token:
```
7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI
```

### Webhook Secret:
```
vobvorot_webhook_secret_2025
```

### Admin Chat IDs:
```
316593422,1837334996
```

### Production URL:
```
https://vobvorot-nextjs.vercel.app
```

## ⚠️ ИЗВЕСТНЫЕ ПРОБЛЕМЫ

1. **AI обработка естественного языка** - возвращает HTTP 500
2. **Vercel CLI токен** - не настроен в окружении

## 📁 ФАЙЛЫ ОТЧЕТОВ

- `/Users/matty/vobvorot-backup-latest/vobvorot-production/FINAL_AI_ASSISTANT_TEST_REPORT.md`
- `/Users/matty/vobvorot-backup-latest/vobvorot-production/.env.production`
- `/Users/matty/vobvorot-backup-latest/vobvorot-production/src/app/api/telegram/ai-assistant/route.ts`