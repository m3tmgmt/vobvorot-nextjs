# 🚀 DEPLOYMENT CHECKLIST - VOBVOROT STORE

## 📋 Чек-лист для запуска в production

### 🔑 1. ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ (Критично)

#### Обязательные для работы:
```bash
# Database (PostgreSQL для production)
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email сервис
RESEND_API_KEY="re_your-resend-api-key"
FROM_EMAIL="store@yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"

# WesternBid платежи
WESTERNBID_MERCHANT_ID="your-merchant-id"
WESTERNBID_SECRET_KEY="your-secret-key"
WESTERNBID_WEBHOOK_SECRET="your-webhook-secret"
WESTERNBID_ENVIRONMENT="production"

# Telegram бот
TELEGRAM_BOT_TOKEN="7274106590:AAFVUDX05v5FgvhzfAPJmfVOWVbfporRnMY"
OWNER_TELEGRAM_ID="316593422"
ADMIN_API_KEY="ADMIN_vobvorot_api_key_2024_ultra_secure_access_token_abc123xyz"
```

#### Опциональные (для расширенной функциональности):
```bash
# OAuth провайдеры
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-id"  
GITHUB_SECRET="your-github-secret"

# Cloudinary для изображений
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Analytics
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"

# Instagram API
INSTAGRAM_ACCESS_TOKEN="your-access-token"
INSTAGRAM_BUSINESS_ACCOUNT_ID="your-account-id"
```

---

### 🗄️ 2. БАЗА ДАННЫХ

#### Подготовка PostgreSQL:
```bash
# 1. Создать PostgreSQL базу данных
# 2. Обновить DATABASE_URL в .env
# 3. Запустить миграции
npx prisma db push

# 4. Заполнить данными
npx prisma db seed

# 5. Проверить подключение
npx prisma studio
```

#### Backup текущих данных:
```bash
# Экспорт из SQLite (если нужно перенести данные)
sqlite3 prisma/dev.db .dump > backup.sql
```

---

### 🌐 3. ДОМЕН И SSL

#### Настройка домена:
- [ ] Купить домен (рекомендуется: vobvorot.com)
- [ ] Настроить DNS записи
- [ ] Настроить SSL сертификат
- [ ] Обновить NEXTAUTH_URL в .env

#### Webhook URLs для обновления:
- WesternBid webhook: `https://yourdomain.com/api/webhooks/westernbid`
- Telegram webhook: `https://yourdomain.com/api/webhooks/telegram`

---

### 📧 4. EMAIL СЕРВИС

#### Настройка Resend:
1. Регистрация на [resend.com](https://resend.com)
2. Верификация домена для email
3. Получение API ключа
4. Обновление переменных в .env

#### Тестирование:
```bash
# Тест email отправки
curl -X POST https://yourdomain.com/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"type": "order_confirmation", "email": "test@example.com"}'
```

---

### 💳 5. ПЛАТЕЖНАЯ СИСТЕМА

#### WesternBid настройка:
1. Регистрация merchant аккаунта
2. Получение production ключей
3. Настройка webhook URL
4. Тестирование платежей

#### Безопасность:
- [ ] WESTERNBID_ENVIRONMENT="production"
- [ ] Webhook signature verification включена
- [ ] Rate limiting настроен
- [ ] IP whitelisting для webhook

---

### 🤖 6. TELEGRAM БОТ

#### Текущие настройки:
- **Бот**: @VobvorotecomAdminBot
- **Token**: Уже настроен
- **Админы**: 316593422, 1837334996

#### Для production:
```bash
# Запуск бота на сервере
nohup node telegram-bot.js > bot.log 2>&1 &

# Проверка работы
ps aux | grep telegram-bot
```

---

### 🚀 7. DEPLOYMENT PLATFORMS

#### Vercel (рекомендуется):
```bash
# 1. Установить Vercel CLI
npm i -g vercel

# 2. Deployment
vercel --prod

# 3. Настроить environment variables в Vercel dashboard
```

#### Railway (альтернатива):
```bash
# 1. Подключить GitHub репозиторий
# 2. Настроить переменные окружения
# 3. Deploy automatically
```

---

### 🔍 8. ТЕСТИРОВАНИЕ

#### Критические функции для проверки:
- [ ] Регистрация/вход пользователей
- [ ] Добавление товаров в корзину
- [ ] Создание заказа
- [ ] Обработка платежа
- [ ] Email уведомления
- [ ] Telegram бот команды
- [ ] Админ панель

#### Тестовые сценарии:
```bash
# 1. Создание тестового заказа
# 2. Проверка email уведомлений
# 3. Webhook обработка
# 4. Telegram бот команды
# 5. Мобильная версия
```

---

### 📊 9. МОНИТОРИНГ

#### Логирование:
- Next.js логи через Vercel
- Email логи через Resend dashboard
- Платежи через WesternBid dashboard
- Telegram бот через bot.log

#### Алерты настроить на:
- Ошибки платежей > 5%
- Email delivery failures
- Database connection errors
- Telegram бот недоступность

---

### 🔒 10. БЕЗОПАСНОСТЬ

#### Финальная проверка:
- [ ] HTTPS включен
- [ ] Все API ключи в production режиме
- [ ] Rate limiting активен
- [ ] Webhook signatures проверяются
- [ ] Чувствительные данные маскированы в логах
- [ ] CORS настроен правильно

---

### 📈 11. PERFORMANCE

#### Оптимизация:
- [ ] Images оптимизированы
- [ ] CSS/JS минифицированы
- [ ] Database индексы настроены
- [ ] CDN для статических файлов
- [ ] Caching стратегия

---

### 📖 12. ДОКУМЕНТАЦИЯ

#### Для команды:
- `AUTH_SETUP.md` - Аутентификация
- `EMAIL_SERVICE_README.md` - Email система
- `WESTERNBID_INTEGRATION.md` - Платежи
- `PROJECT_HANDOVER_REPORT.md` - Общий обзор

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

### Перед запуском проверить:
- [ ] Все переменные окружения настроены
- [ ] PostgreSQL база данных работает
- [ ] Email сервис тестирован
- [ ] Платежи работают в production
- [ ] Telegram бот отвечает
- [ ] SSL сертификат активен
- [ ] Домен направлен на приложение
- [ ] Backup данных создан
- [ ] Мониторинг настроен
- [ ] Команда обучена работе с системой

---

## 🆘 SUPPORT CONTACTS

### В случае проблем:
1. **Технические вопросы**: Проверить логи в Vercel/Railway
2. **Платежи**: WesternBid support
3. **Email**: Resend support dashboard
4. **Telegram**: @BotFather для bot issues

### Важные файлы логов:
- `bot.log` - Telegram бот
- Vercel Functions logs - API endpoints
- Resend Dashboard - Email delivery
- WesternBid Dashboard - Платежи

---

**🎯 Цель**: Запустить полнофункциональный интернет-магазин с минимальным downtime и максимальной безопасностью.

**⏱️ Время развертывания**: 2-4 часа (при готовых API ключах)