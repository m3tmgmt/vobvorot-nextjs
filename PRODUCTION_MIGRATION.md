# 🚀 Production Migration System - VobVorot Store

Полная система миграции для перехода от SQLite (разработка) к PostgreSQL (production) с расширенными возможностями управления данными.

## 📋 Что Создано

### ✅ 1. Обновленная Prisma Schema
- **Изменен провайдер:** SQLite → PostgreSQL
- **Улучшенные типы данных:** Float → Decimal для денежных значений
- **Новые поля:**
  - Расширенные данные пользователей (имя, фамилия, телефон, адреса)
  - SEO поля для продуктов (metaTitle, metaDescription)
  - Cloudinary интеграция для изображений
  - Детализированная информация о заказах (налоги, скидки, отслеживание)

### ✅ 2. Индексы для Производительности
```sql
-- Стратегические индексы добавлены в схему:
@@index([categoryId])      -- Для фильтрации по категориям
@@index([slug])           -- Для SEO URL
@@index([userId])         -- Для пользовательских данных
@@index([orderNumber])    -- Для поиска заказов
@@fulltext([name, description])  -- Для полнотекстового поиска
```

### ✅ 3. Миграционные Скрипты

#### `/scripts/migrate-to-postgres.ts`
**Полная миграция данных с проверкой целостности:**
```bash
npm run migrate:sqlite-to-postgres
```
- Поэтапный перенос всех таблиц
- Обработка ошибок и логирование
- Сохранение связей между данными
- Конвертация типов данных

#### `/scripts/seed-production.ts`
**Начальные данные для production:**
```bash
npm run seed:production
```
- Администратор по умолчанию
- Базовые категории товаров
- Тестовый продукт для проверки
- Системные настройки

### ✅ 4. Система Backup/Restore

#### `/scripts/backup-restore.ts`
**Полнофункциональная система резервного копирования:**
```bash
# Создание бэкапа
npm run backup:create

# Восстановление
npm run backup:restore ./backups/backup-file.sql.gz

# Проверка целостности
npm run backup:verify ./backups/backup-file.sql.gz

# Список бэкапов
npm run backup:list

# Очистка старых бэкапов
npm run backup:cleanup
```

**Возможности:**
- Автоматическое сжатие (gzip)
- Проверка целостности
- Автоочистка по расписанию
- Детальное логирование

### ✅ 5. Проверка Целостности Данных

#### `/scripts/data-integrity.ts`
**Комплексная проверка данных:**
```bash
# Проверка целостности
npm run integrity:check

# Автоисправление
npm run integrity:fix
```

**Проверяет:**
- Сиротские записи
- Бизнес-логику
- Качество данных
- Отсутствующие индексы
- Дубликаты
- Нарушения ограничений

### ✅ 6. Мониторинг Производительности

#### `/scripts/performance-monitor.ts`
**Анализ производительности базы данных:**
```bash
# Отчет о производительности
npm run performance:monitor

# Непрерывный мониторинг
npm run performance:continuous
```

**Анализирует:**
- Статистику запросов
- Использование индексов
- Размеры таблиц
- Медленные запросы
- Пул соединений
- Рекомендации по оптимизации

### ✅ 7. Автоматизированный Деплой

#### `/scripts/deploy-production.sh`
**Полный цикл развертывания:**
```bash
npm run deploy:production
```

**Этапы развертывания:**
1. Проверка окружения
2. Создание pre-deployment бэкапа
3. Установка зависимостей
4. Миграция базы данных
5. Заполнение production данными
6. Сборка приложения
7. Проверка целостности
8. Создание post-deployment бэкапа
9. Очистка и отчет

### ✅ 8. Cloudinary Интеграция

**Обновленная схема изображений:**
```typescript
model ProductImage {
  // Стандартные поля
  url       String
  alt       String?
  isPrimary Boolean
  
  // Cloudinary интеграция
  cloudinaryId   String?
  cloudinaryUrl  String?
  width         Int?
  height        Int?
  format        String?
  size          BigInt?
}
```

## 🔧 Конфигурация

### Переменные Окружения (.env.production)
```bash
# PostgreSQL
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="https://yourdomain.com"

# Admin
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="SecurePassword123!"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"

# Backup
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
```

## 🚀 Процесс Миграции

### Пошаговая Инструкция

1. **Подготовка:**
   ```bash
   # Скопировать и настроить окружение
   cp .env.production.example .env.production
   # Настроить переменные в .env.production
   ```

2. **Создание PostgreSQL базы:**
   ```sql
   CREATE DATABASE vobvorot_production;
   CREATE USER vobvorot_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE vobvorot_production TO vobvorot_user;
   ```

3. **Полная миграция (рекомендуется):**
   ```bash
   npm run deploy:production
   ```

4. **Или поэтапная миграция:**
   ```bash
   npm run migrate:sqlite-to-postgres
   npm run seed:production
   npm run integrity:check
   npm run build
   ```

### Проверка После Миграции

1. **Целостность данных:**
   ```bash
   npm run integrity:check
   ```

2. **Производительность:**
   ```bash
   npm run performance:monitor
   ```

3. **Функциональность:**
   - Вход в админ панель
   - Создание тестового заказа
   - Загрузка изображений
   - Работа поиска

## 📊 Новые Возможности

### Расширенные Пользователи
- Полные профили с адресами
- Предпочтения и настройки
- История активности

### Улучшенные Продукты
- SEO оптимизация
- Cloudinary изображения
- Расширенное управление складом
- Полнотекстовый поиск

### Детализированные Заказы
- Налоги и скидки
- Трекинг номера
- Внутренние заметки
- Снапшот данных

### Система Мониторинга
- Проверка здоровья базы
- Автоматические бэкапы
- Мониторинг производительности
- Алерты и уведомления

## 🔍 Мониторинг и Поддержка

### Регулярные Проверки
```bash
# Еженедельно
npm run integrity:check

# Ежемесячно
npm run performance:monitor

# По необходимости
npm run backup:create
```

### Логи и Отладка
- Миграционные логи: `migration-YYYYMMDD-HHMMSS.log`
- Логи приложения: настроены через переменные окружения
- PostgreSQL логи: стандартные логи сервера

### Автоматизация
- Настройте cron задачи для бэкапов
- Мониторинг через health check endpoints
- Интеграция с системами оповещения

## 🛡️ Безопасность

### Рекомендации
- Смените пароль администратора сразу после развертывания
- Настройте SSL для соединений с базой
- Ограничьте доступ к базе по IP
- Регулярно обновляйте зависимости
- Настройте брандмауэр

### Резервное Копирование
- Автоматические daily бэкапы
- Хранение в безопасном месте
- Регулярная проверка восстановления
- Шифрование бэкапов

## 📚 Документация

- **`/docs/MIGRATION_GUIDE.md`** - Подробное руководство по миграции
- **`/scripts/README.md`** - Документация по всем скриптам
- **`.env.production.example`** - Пример конфигурации production

## 🎯 Следующие Шаги

После успешной миграции:

1. **Настройте мониторинг** - Nagios, Prometheus, или другой
2. **Оптимизируйте производительность** - на основе отчетов мониторинга
3. **Настройте CI/CD** - для автоматических развертываний
4. **Обучите команду** - новым инструментам и процессам
5. **Документируйте изменения** - для будущих разработчиков

## ✅ Checklist После Миграции

- [ ] Администратор может войти в систему
- [ ] Все данные перенеслись корректно
- [ ] Поиск работает правильно
- [ ] Изображения загружаются через Cloudinary
- [ ] Заказы создаются и обрабатываются
- [ ] Email уведомления работают
- [ ] Backup система настроена
- [ ] Мониторинг активен
- [ ] SSL сертификаты установлены
- [ ] Производительность удовлетворительная

---

**🎉 Поздравляем! У вас теперь есть полнофункциональная production-ready система базы данных с расширенными возможностями мониторинга, резервного копирования и обслуживания!**