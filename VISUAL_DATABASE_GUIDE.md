# 🖥️ ВИЗУАЛЬНОЕ УПРАВЛЕНИЕ БАЗОЙ ДАННЫХ МАГАЗИНА

## 🚀 БЫСТРЫЙ СТАРТ - Prisma Studio

### Шаг 1: Запустите Prisma Studio
```bash
cd /Users/matty/vobvorot-backup-latest/vobvorot-production
npx prisma studio
```

### Шаг 2: Откройте в браузере
http://localhost:5555

### Что вы увидите:
- **products** - все товары магазина
- **orders** - заказы клиентов  
- **categories** - категории товаров
- **reviews** - отзывы покупателей
- **users** - пользователи

## 📝 КАК РЕДАКТИРОВАТЬ ТОВАРЫ

### Добавить новый товар:
1. Откройте таблицу `products`
2. Нажмите "+ Add record"
3. Заполните поля:
   - **name**: Название товара
   - **slug**: URL товара (латиницей, через дефис)
   - **price**: Цена в центах (100 = $1.00)
   - **description**: Описание
   - **images**: ["url1.jpg", "url2.jpg"] - массив картинок
   - **inStock**: true/false - в наличии
   - **categoryId**: ID категории
   - **status**: "active" или "draft"

### Редактировать существующий:
1. Найдите товар в списке
2. Кликните на любое поле
3. Измените значение
4. Нажмите Enter или кликните вне поля

### Удалить товар:
1. Наведите на строку товара
2. Справа появится иконка корзины
3. Нажмите и подтвердите удаление

## 📦 УПРАВЛЕНИЕ ЗАКАЗАМИ

### Посмотреть заказы:
1. Откройте таблицу `orders`
2. Видите все заказы с деталями
3. Кликните на orderItems чтобы увидеть товары в заказе

### Изменить статус заказа:
1. Найдите заказ
2. Кликните на поле `status`
3. Выберите новый статус:
   - pending - ожидает оплаты
   - paid - оплачен
   - processing - в обработке
   - shipped - отправлен
   - delivered - доставлен
   - cancelled - отменен

## 🏷️ КАТЕГОРИИ ТОВАРОВ

### Создать категорию:
1. Откройте `categories`
2. Add record
3. Заполните:
   - **name**: Название
   - **slug**: URL категории
   - **parentId**: null (или ID родительской категории)

## ⭐ ОТЗЫВЫ

### Модерация отзывов:
1. Откройте `reviews`
2. Найдите отзыв
3. Измените поле `verified` на true/false

## 💡 ПОЛЕЗНЫЕ ФИЛЬТРЫ

### Найти все активные товары:
1. В таблице products
2. Кликните на фильтр
3. Выберите: status equals "active"

### Найти товары без категории:
1. Фильтр: categoryId equals null

### Найти неоплаченные заказы:
1. В orders
2. Фильтр: status equals "pending"

## 🔧 ДОПОЛНИТЕЛЬНЫЕ ИНСТРУМЕНТЫ

### Если нужно больше возможностей:

**Supabase Table Editor** (если используете Supabase):
- https://app.supabase.com
- Войдите в ваш проект
- Table Editor в меню слева

**TablePlus** (Mac, $89):
- https://tableplus.com
- Самый удобный интерфейс
- Поддержка всех БД

**DBeaver** (бесплатно, все ОС):
- https://dbeaver.io
- Мощный функционал
- Требует Java

## ⚠️ ВАЖНЫЕ МОМЕНТЫ

1. **Всегда делайте бэкап** перед массовыми изменениями
2. **ID генерируются автоматически** - не вводите их вручную
3. **Связанные данные** - удаление категории может повлиять на товары
4. **Цены в центах** - 1000 = $10.00

## 🆘 ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК

### Откатить изменения:
```bash
# Посмотреть последние миграции
npx prisma migrate status

# Откатить если нужно
npx prisma migrate reset
```

### Сделать бэкап БД:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Восстановить из бэкапа:
```bash
psql $DATABASE_URL < backup.sql
```