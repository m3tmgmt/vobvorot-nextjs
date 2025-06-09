# EXVICPMOUR Store - Документация для собственника

## 📋 Общая информация о проекте

### Описание
EXVICPMOUR - это интернет-магазин винтажной и кастомной моды из Украины. Проект построен на современном стеке технологий и готов к production запуску.

### Технический стек
- **Frontend**: Next.js 15 с App Router
- **Styling**: Tailwind CSS + shadcn/ui компоненты
- **База данных**: PostgreSQL с Prisma ORM
- **Аутентификация**: NextAuth.js
- **Платежи**: Western Bid API
- **Email**: Resend
- **Изображения**: Cloudinary
- **Хостинг**: Vercel (рекомендуется)
- **Telegram Bot**: Grammy framework

### Текущий статус
✅ Проект полностью готов к production развертыванию
✅ Все критические ошибки исправлены
✅ Интеграция с Western Bid готова
✅ База данных настроена для PostgreSQL
✅ SEO оптимизация выполнена

---

## 🚀 Развертывание в production

### 1. Подготовка домена
1. Приобретите домен `exvicpmour.com`
2. Настройте DNS записи для указания на Vercel

### 2. Настройка базы данных PostgreSQL

#### Рекомендуемые провайдеры:
- **Vercel Postgres** (рекомендуется для Vercel)
- **Neon** (бесплатный tier доступен)
- **PlanetScale**
- **Railway**

#### Создание базы:
```bash
# После создания базы данных получите DATABASE_URL
# Примерный формат: postgresql://username:password@host:5432/database
```

### 3. Настройка переменных окружения

Скопируйте `.env.production` в `.env` и обновите следующие значения:

```bash
# База данных
DATABASE_URL="postgresql://username:password@host:5432/database"
DIRECT_DATABASE_URL="postgresql://username:password@host:5432/database"

# Домен
NEXT_PUBLIC_SITE_URL=https://exvicpmour.com
NEXTAUTH_URL=https://exvicpmour.com

# Безопасность
NEXTAUTH_SECRET="your-super-secret-key-32-chars-minimum"

# Western Bid (получите от Western Bid)
WESTERNBID_MERCHANT_ID="your_real_merchant_id"
WESTERNBID_SECRET_KEY="your_real_secret_key"
WESTERNBID_WEBHOOK_SECRET="your_webhook_secret"

# Email (получите от Resend)
RESEND_API_KEY="re_your_real_api_key"
FROM_EMAIL="store@exvicpmour.com"

# Cloudinary (получите от Cloudinary)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Google Analytics
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### 4. Развертывание на Vercel

1. Подключите GitHub репозиторий к Vercel
2. Добавьте переменные окружения в Vercel Dashboard
3. Настройте домен в Vercel
4. Запустите деплой

### 5. Инициализация базы данных

```bash
# Применить миграции
npx prisma migrate deploy

# Заполнить базу начальными данными (опционально)
npx prisma db seed
```

---

## 📧 Настройка сервисов

### Western Bid
1. Зарегистрируйтесь на платформе Western Bid
2. Получите учетные данные для production
3. Настройте webhook URL: `https://exvicpmour.com/api/webhooks/westernbid`

### Resend
1. Зарегистрируйтесь на resend.com
2. Добавьте и верифицируйте домен `exvicpmour.com`
3. Получите API ключ

### Cloudinary
1. Зарегистрируйтесь на cloudinary.com
2. Получите учетные данные
3. Настройте папки для организации изображений

### Google Analytics
1. Создайте аккаунт Google Analytics
2. Добавьте сайт
3. Получите Measurement ID

---

## 🛠 Управление контентом

### Добавление товаров

#### Через админ панель:
1. Перейдите на `/admin` (требуется аутентификация)
2. Используйте интерфейс для добавления товаров

#### Через базу данных:
```sql
-- Пример добавления товара
INSERT INTO products (name, slug, description, "categoryId") 
VALUES ('Винтажная камера Canon', 'vintage-canon-camera', 'Описание товара', 'category_id');

-- Добавление SKU
INSERT INTO product_skus (sku, price, stock, "productId")
VALUES ('CANON_001', 150.00, 5, 'product_id');
```

### Управление категориями
```sql
-- Добавление категории
INSERT INTO categories (name, slug, description)
VALUES ('Винтажные камеры', 'vintage-cameras', 'Коллекция винтажных камер');
```

### Загрузка изображений
1. Используйте Cloudinary для хранения изображений
2. Обновите URLs в базе данных
3. Убедитесь, что изображения доступны

---

## 📱 Telegram Bot

### Настройка
1. Получите токен от @BotFather
2. Обновите переменные в `.env`:
```bash
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_BOT_USERNAME="your_bot_username"
OWNER_TELEGRAM_ID="your_telegram_id"
```

### Запуск бота
```bash
node telegram-bot.js
```

### Команды бота
- `/start` - Начало работы
- `/help` - Помощь
- `/stats` - Статистика (только для админа)
- `/orders` - Список заказов (только для админа)

---

## 🔧 Обслуживание

### Мониторинг

#### Ключевые метрики:
- Время отклика сайта
- Статус базы данных
- Ошибки в логах
- Статус платежей

#### Рекомендуемые инструменты:
- Vercel Analytics
- Sentry для отслеживания ошибок
- UptimeRobot для мониторинга доступности

### Резервное копирование

#### База данных:
```bash
# Создание бэкапа
pg_dump DATABASE_URL > backup_$(date +%Y%m%d).sql

# Восстановление
psql DATABASE_URL < backup_file.sql
```

#### Изображения:
- Cloudinary автоматически создает резервные копии
- Рекомендуется настроить дополнительное резервирование

### Обновления

#### Код:
1. Тестируйте изменения локально
2. Создайте ветку для изменений
3. Используйте preview deployments в Vercel
4. После тестирования деплойте в main

#### Зависимости:
```bash
# Обновление зависимостей
npm update

# Проверка уязвимостей
npm audit
```

---

## 📊 Аналитика и отчеты

### Google Analytics
- Настроен автоматический трекинг
- Доступны отчеты по продажам и трафику

### Встроенная аналитика
- Статистика заказов в админ панели
- Отчеты по продажам
- Данные о клиентах

---

## 🔐 Безопасность

### Текущие меры безопасности:
- HTTPS только
- Строгие заголовки безопасности
- Валидация всех входных данных
- Защита от CSRF
- Rate limiting для API

### Рекомендации:
1. Регулярно обновляйте зависимости
2. Мониторьте логи на подозрительную активность
3. Используйте сильные пароли
4. Настройте 2FA для всех админ аккаунтов

---

## 🆘 Поддержка и устранение неполадок

### Частые проблемы:

#### Сайт не загружается:
1. Проверьте статус Vercel
2. Проверьте DNS настройки
3. Проверьте логи в Vercel Dashboard

#### Ошибки базы данных:
1. Проверьте подключение к PostgreSQL
2. Проверьте переменные окружения
3. Проверьте лимиты подключений

#### Проблемы с платежами:
1. Проверьте статус Western Bid API
2. Проверьте webhook настройки
3. Проверьте логи платежей

### Контакты для поддержки:
- Техническая поддержка: tech@exvicpmour.com
- Общие вопросы: info@exvicpmour.com

---

## 📝 Дополнительные ресурсы

### Документация:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Полезные команды:
```bash
# Локальная разработка
npm run dev

# Сборка для production
npm run build

# Запуск production сборки
npm start

# Работа с базой данных
npx prisma studio
npx prisma migrate dev
npx prisma generate

# Проверка кода
npm run lint
npm run type-check
```

---

*Дата создания: {{current_date}}*
*Версия документации: 1.0*