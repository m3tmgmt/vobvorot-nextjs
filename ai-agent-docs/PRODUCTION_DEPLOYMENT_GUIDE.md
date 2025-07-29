# 🚀 РУКОВОДСТВО ПО РАЗВЕРТЫВАНИЮ AI АССИСТЕНТА НА PRODUCTION

## 📅 Дата: 29 января 2025

## ✅ СТАТУС РАЗВЕРТЫВАНИЯ

### Выполненные шаги:
1. ✅ Код AI ассистента полностью готов (82+ функций)
2. ✅ Все тесты пройдены успешно
3. ✅ Конфигурация Vercel обновлена
4. ✅ Код отправлен на GitHub
5. ✅ Deployment запущен на Vercel
6. ✅ Проблемы безопасности устранены

### Текущий deployment:
- **URL**: https://vobvorot-nextjs-o68vu9utc-m3tmgmt-gmailcoms-projects.vercel.app
- **Статус**: Building...

## 🔐 НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ

### Критически важно настроить в Vercel:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=<ваш_токен_бота>
NEXT_PUBLIC_ADMIN_ID=316593422

# AI
GEMINI_API_KEY=<ваш_ключ_gemini>

# База данных
DATABASE_URL=<ваша_строка_подключения_postgresql>

# Cloudinary
CLOUDINARY_URL=<ваш_cloudinary_url>
CLOUDINARY_CLOUD_NAME=<ваше_имя_облака>
CLOUDINARY_API_KEY=<ваш_api_ключ>
CLOUDINARY_API_SECRET=<ваш_секрет>

# Email
RESEND_API_KEY=<ваш_resend_ключ>

# Платежи (опционально)
WESTERNBID_USERNAME=<ваш_username>
WESTERNBID_PASSWORD=<ваш_пароль>
WESTERNBID_API_URL=https://api.westernbid.com
```

### Как настроить:

#### Вариант 1: Через веб-интерфейс Vercel
1. Перейдите: https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs/settings/environment-variables
2. Добавьте каждую переменную для Production
3. Нажмите Save

#### Вариант 2: Через CLI
```bash
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add GEMINI_API_KEY production
# и так далее для каждой переменной
```

## 🔗 НАСТРОЙКА TELEGRAM WEBHOOK

После успешного deployment:

1. Получите URL вашего deployment (например: https://vobvorot.com)
2. Установите webhook для бота:

```bash
curl -X POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://vobvorot.com/api/telegram/ai-assistant",
    "allowed_updates": ["message", "callback_query"],
    "secret_token": "<TELEGRAM_BOT_TOKEN>"
  }'
```

## 🧪 ПРОВЕРКА РАБОТОСПОСОБНОСТИ

### 1. Проверка deployment:
```bash
curl https://vobvorot.com/api/health
```

### 2. Проверка webhook:
```bash
curl https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

### 3. Тестирование бота:
- Откройте бота в Telegram
- Отправьте команду: "покажи заказы"
- Бот должен ответить списком заказов

## 📊 МОНИТОРИНГ

### Vercel Dashboard:
- Функции: https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs/functions
- Логи: https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs/logs

### Что мониторить:
1. **Время ответа** - должно быть <5 сек
2. **Ошибки 5xx** - должны отсутствовать
3. **Использование Gemini API** - следить за лимитами
4. **База данных** - проверять доступность

## ⚠️ ВОЗМОЖНЫЕ ПРОБЛЕМЫ

### 1. "Бот не отвечает"
- Проверьте webhook через getWebhookInfo
- Убедитесь, что все env переменные установлены
- Проверьте логи в Vercel

### 2. "Ошибка AI"
- Проверьте GEMINI_API_KEY
- Убедитесь, что используется модель gemini-1.5-flash
- Проверьте лимиты API

### 3. "База данных недоступна"
- Проверьте DATABASE_URL
- Убедитесь, что IP Vercel добавлен в whitelist

## ✅ ЧЕКЛИСТ ПОСЛЕ DEPLOYMENT

- [ ] Все переменные окружения настроены
- [ ] Webhook установлен и работает
- [ ] Бот отвечает на команды
- [ ] AI корректно распознает намерения
- [ ] Логирование работает
- [ ] Нет ошибок в Vercel logs

## 🎉 ПОЗДРАВЛЯЕМ!

Если все шаги выполнены успешно, ваш AI ассистент VOBVOROT готов к работе!

### Функциональность:
- 82+ команд для управления магазином
- Интеллектуальное распознавание намерений
- Интеграция с платежами, доставкой, email
- Полное логирование и мониторинг
- Защита от спама и безопасность

### Поддержка:
При возникновении проблем проверьте:
1. Логи в Vercel Dashboard
2. Статус webhook в Telegram
3. Доступность внешних API