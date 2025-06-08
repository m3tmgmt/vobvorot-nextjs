# 🚀 Деплой EXVICPMOUR Store с Telegram Bot

## Готовность проекта
✅ Проект полностью настроен и готов к деплою
✅ Telegram бот @VobvorotecomAdminBot создан и настроен  
✅ Все API endpoints для CRM функций реализованы
✅ Build проекта успешно проходит
✅ Git репозиторий инициализирован

## Деплой на Vercel

### 1. Авторизация в Vercel
```bash
npx vercel login
# Выберите GitHub или другой метод авторизации
```

### 2. Деплой проекта
```bash
npx vercel --prod --yes
```

Vercel автоматически:
- Установит зависимости
- Соберет проект
- Деплоит на продакшн URL
- Настроит HTTPS

### 3. Добавление переменных окружения в Vercel Dashboard

После деплоя, перейдите в Vercel Dashboard → Settings → Environment Variables:

```env
TELEGRAM_BOT_TOKEN=7274106590:AAFVUDX05v5FgvhzfAPJmfVOWVbfporRnMY
TELEGRAM_BOT_USERNAME=VobvorotecomAdminBot
OWNER_TELEGRAM_ID=316593422
TELEGRAM_WEBHOOK_SECRET=TG_vobvorot_webhook_secret_2024_secure_key_xyz789
ADMIN_API_KEY=ADMIN_vobvorot_api_key_2024_ultra_secure_access_token_abc123xyz

# NextAuth (обязательно для продакшна)
NEXTAUTH_SECRET=ваш-новый-секретный-ключ-для-продакшна
NEXTAUTH_URL=https://ваш-домен.vercel.app

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=ваш-google-client-id
GOOGLE_CLIENT_SECRET=ваш-google-client-secret
```

### 4. Установка Telegram Webhook

После деплоя замените YOUR-DOMAIN на ваш URL от Vercel:

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/telegram/webhook?action=set"
```

Должен вернуться ответ: `{"ok":true,"result":true}`

### 5. Тестирование бота

1. Найдите @VobvorotecomAdminBot в Telegram
2. Отправьте `/start`
3. Вы увидите главное меню CRM:

```
🏪 EXVICPMOUR Admin Panel

📦 Заказы - управление заказами
🛍️ Товары - управление каталогом  
📊 Статистика - аналитика продаж
👥 Клиенты - база клиентов
```

## Возможности Telegram CRM

### 📦 Управление заказами
- Просмотр новых заказов в реальном времени
- Изменение статусов (pending → confirmed → shipped → completed)
- Поиск заказов по номеру или email
- Автоматические уведомления о новых заказах

### 🛍️ Управление товарами
- Добавление новых товаров через интерактивный диалог
- Редактирование цен, описаний, остатков
- Загрузка фотографий товаров
- Уведомления о низких остатках

### 📊 Аналитика и статистика
- Ежедневные сводки с ключевыми метриками
- Статистика продаж по периодам
- Топ товары и клиенты
- Географическое распределение продаж

### 👥 Управление клиентами
- База всех клиентов с историей покупок
- Сегментация по объему покупок
- Информация о новых и постоянных клиентах

## Проверка работы

### Проверка webhook
```bash
curl "https://YOUR-DOMAIN.vercel.app/api/telegram/webhook?action=info"
```

### Проверка API
```bash
curl "https://YOUR-DOMAIN.vercel.app/api/admin/stats?type=overview" \
  -H "Authorization: Bearer ADMIN_vobvorot_api_key_2024_ultra_secure_access_token_abc123xyz"
```

## Безопасность

✅ Telegram webhook защищен секретным токеном
✅ Admin API требует авторизацию через Bearer token
✅ Доступ к боту только у владельца (OWNER_TELEGRAM_ID)
✅ Все sensitive данные в переменных окружения

## Поддержка

После успешного деплоя ваш магазин будет работать с полной CRM системой через Telegram бот, без необходимости в дополнительных сервисах или панелях администратора.

Все управление магазином происходит через @VobvorotecomAdminBot в Telegram!