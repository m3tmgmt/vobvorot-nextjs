# Telegram Bot - Руководство по управлению

## 📱 Общая информация

Telegram бот EXVICPMOUR предназначен для:
- Уведомлений о новых заказах
- Управления заказами
- Получения статистики продаж
- Модерации отзывов
- Административных задач

## 🚀 Запуск и настройка

### Получение токена бота
1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### Настройка переменных окружения
```bash
# В .env файле
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_FROM_BOTFATHER"
TELEGRAM_BOT_USERNAME="YourBotUsername"
OWNER_TELEGRAM_ID="YOUR_TELEGRAM_USER_ID"
ADMIN_API_KEY="YOUR_SECURE_ADMIN_API_KEY"
```

### Запуск бота
```bash
# Разработка
node telegram-bot.js

# Production (с PM2)
pm2 start telegram-bot.js --name "exvicpmour-bot"
pm2 startup
pm2 save
```

## 🎛 Команды бота

### Пользовательские команды
- `/start` - Приветствие и информация о боте
- `/help` - Список доступных команд
- `/store` - Ссылка на интернет-магазин
- `/support` - Контактная информация

### Административные команды (только для OWNER_TELEGRAM_ID)

#### Статистика
- `/stats` - Общая статистика магазина
- `/today` - Статистика за сегодня
- `/week` - Статистика за неделю
- `/month` - Статистика за месяц

#### Заказы
- `/orders` - Последние 10 заказов
- `/order <ID>` - Детали конкретного заказа
- `/pending` - Заказы в обработке
- `/completed` - Завершенные заказы

#### Товары
- `/products` - Список товаров
- `/lowstock` - Товары с низким остатком
- `/outofstock` - Товары без остатков

#### Система
- `/status` - Статус системы
- `/logs` - Последние логи
- `/backup` - Создать резервную копию

## 📊 Автоматические уведомления

### Новый заказ
```
🛒 НОВЫЙ ЗАКАЗ #ORD-001

👤 Клиент: Иван Иванов
📧 Email: ivan@example.com
💰 Сумма: $150.00
📦 Товаров: 2

Перейти к заказу: /order ORD-001
```

### Изменение статуса заказа
```
📋 СТАТУС ЗАКАЗА #ORD-001

Статус изменен: Обработка → Отправлен
📦 Трек-номер: 1234567890
👤 Клиент: Иван Иванов
```

### Низкий остаток товара
```
⚠️ НИЗКИЙ ОСТАТОК

📦 Товар: Винтажная камера Canon
🏷 SKU: CANON_001
📊 Остаток: 2 шт.
🎯 Минимум: 5 шт.

Нужно пополнить запас!
```

### Неудачная оплата
```
❌ НЕУДАЧНАЯ ОПЛАТА

🛒 Заказ: #ORD-001
💰 Сумма: $150.00
❌ Причина: Недостаточно средств
👤 Клиент: ivan@example.com

Требует внимания!
```

## 🔧 Настройка уведомлений

### В коде бота (telegram-bot.js)
```javascript
// Настройка типов уведомлений
const notifications = {
  newOrder: true,
  statusChange: true,
  lowStock: true,
  paymentFailed: true,
  systemErrors: true
}

// Пороговые значения
const thresholds = {
  lowStock: 5,
  criticalStock: 1
}
```

### Расписание проверок
```javascript
// Проверка статистики каждый час
setInterval(checkSystemHealth, 60 * 60 * 1000)

// Проверка низких остатков каждые 6 часов
setInterval(checkLowStock, 6 * 60 * 60 * 1000)

// Ежедневный отчет в 9:00
cron.schedule('0 9 * * *', sendDailyReport)
```

## 👨‍💼 Административные функции

### Управление заказами
```javascript
// Изменение статуса заказа
/setstatus ORD-001 shipped

// Добавление трек-номера
/tracking ORD-001 1234567890

// Отмена заказа
/cancel ORD-001
```

### Управление товарами
```javascript
// Обновление остатков
/stock CANON_001 10

// Деактивация товара
/disable PROD-123

// Обновление цены
/price CANON_001 175.00
```

### Управление клиентами
```javascript
// Информация о клиенте
/customer user@example.com

// Заказы клиента
/customerorders user@example.com

// Блокировка клиента
/block user@example.com
```

## 🛠 Техническое обслуживание

### Мониторинг бота
```bash
# Проверка статуса PM2
pm2 status

# Просмотр логов
pm2 logs exvicpmour-bot

# Перезапуск бота
pm2 restart exvicpmour-bot

# Остановка бота
pm2 stop exvicpmour-bot
```

### Обновление бота
```bash
# Остановить бота
pm2 stop exvicpmour-bot

# Обновить код
git pull origin main

# Установить зависимости (если изменились)
npm install

# Запустить бота
pm2 start exvicpmour-bot
```

### Резервное копирование настроек
```bash
# Сохранить конфигурацию PM2
pm2 save

# Экспорт настроек
pm2 dump
```

## 🔐 Безопасность

### Защита токена
- Никогда не публикуйте токен в открытом виде
- Используйте переменные окружения
- Регулярно меняйте токен при подозрении на компрометацию

### Контроль доступа
```javascript
// Проверка прав администратора
function isAdmin(userId) {
  return userId.toString() === process.env.OWNER_TELEGRAM_ID
}

// Логирование команд
function logCommand(userId, command) {
  console.log(`[${new Date().toISOString()}] User ${userId}: ${command}`)
}
```

### Валидация данных
```javascript
// Проверка корректности ID заказа
function validateOrderId(orderId) {
  return /^ORD-\d+$/.test(orderId)
}

// Ограничение частоты запросов
const rateLimiter = new Map()
function checkRateLimit(userId) {
  const lastRequest = rateLimiter.get(userId)
  const now = Date.now()
  
  if (lastRequest && now - lastRequest < 1000) {
    return false // Слишком частые запросы
  }
  
  rateLimiter.set(userId, now)
  return true
}
```

## 📈 Аналитика и отчеты

### Ежедневный отчет
```
📊 ЕЖЕДНЕВНЫЙ ОТЧЕТ (15.01.2024)

💰 Продажи: $1,250.00
🛒 Заказов: 8
👥 Новых клиентов: 3
📦 Отправлено: 5
⏳ В обработке: 3

📈 По сравнению с вчера: +15%
```

### Еженедельный отчет
```
📊 ЕЖЕНЕДЕЛЬНЫЙ ОТЧЕТ (8-14.01.2024)

💰 Продажи: $8,750.00
🛒 Заказов: 45
👥 Новых клиентов: 18
📦 Отправлено: 42
💳 Конверсия: 12.5%

🏆 Топ товар: Винтажная камера Canon (8 продаж)
```

## 🚨 Устранение неполадок

### Бот не отвечает
1. Проверьте статус процесса: `pm2 status`
2. Проверьте логи: `pm2 logs exvicpmour-bot`
3. Проверьте подключение к интернету
4. Проверьте корректность токена

### Уведомления не приходят
1. Проверьте OWNER_TELEGRAM_ID
2. Проверьте блокировку бота пользователем
3. Проверьте настройки уведомлений в коде

### Ошибки базы данных
1. Проверьте подключение к базе данных
2. Проверьте ADMIN_API_KEY
3. Проверьте доступность API эндпоинтов

### Проблемы с PM2
```bash
# Очистка PM2
pm2 kill
pm2 resurrect

# Обновление PM2
npm install -g pm2@latest
```

## 📞 Поддержка

### Контакты разработчика
- Email: developer@exvicpmour.com
- Telegram: @exvicpmour_dev

### Логи и диагностика
```bash
# Детальные логи
pm2 logs exvicpmour-bot --lines 100

# Мониторинг в реальном времени
pm2 monit

# Информация о системе
pm2 info exvicpmour-bot
```

---

*Последнее обновление: Январь 2024*
*Версия бота: 1.0*