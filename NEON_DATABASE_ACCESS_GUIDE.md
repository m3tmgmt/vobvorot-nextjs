# 🚀 ДОСТУП К ВАШЕЙ БАЗЕ ДАННЫХ NEON

## ✅ САМЫЙ ПРОСТОЙ СПОСОБ - NEON CONSOLE

### 1. Зайдите в Neon Console:
🔗 https://console.neon.tech

### 2. Войдите в аккаунт
Используйте email, с которого создавали БД

### 3. Выберите проект "vobvorot"

### 4. Нажмите "Tables" в левом меню

### 5. ВСЁ! Вы видите все таблицы:
- **products** - товары
- **orders** - заказы  
- **categories** - категории
- **users** - пользователи
- **reviews** - отзывы

## 📝 КАК РЕДАКТИРОВАТЬ ДАННЫЕ В NEON

### Добавить товар:
1. Выберите таблицу `products`
2. Нажмите "Insert row"
3. Заполните поля:
   ```
   name: "Название товара"
   slug: "url-tovara"
   price: 1000 (в центах, это $10)
   description: "Описание"
   images: ["https://url-kartinki.jpg"]
   inStock: true
   status: "active"
   ```
4. Нажмите "Insert"

### Изменить товар:
1. Найдите товар в таблице
2. Кликните на ячейку
3. Измените значение
4. Нажмите Enter

### SQL редактор (для продвинутых):
1. Нажмите "SQL Editor" 
2. Пишите любые SQL запросы:
   ```sql
   -- Все активные товары
   SELECT * FROM products WHERE status = 'active';
   
   -- Изменить цену
   UPDATE products SET price = 2000 WHERE id = '123';
   
   -- Добавить категорию
   INSERT INTO categories (name, slug) 
   VALUES ('Новая категория', 'new-category');
   ```

## 🌐 ДЛЯ ДРУГИХ ПОЛЬЗОВАТЕЛЕЙ

### Вариант 1: Дать доступ к Neon
1. В Neon Console → Settings → Team
2. Invite member
3. Введите email пользователя
4. Выберите роль (Viewer - только смотреть, Editor - редактировать)

### Вариант 2: Создать отдельного пользователя БД
```sql
-- В SQL Editor Neon
CREATE USER manager WITH PASSWORD 'безопасный-пароль';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO manager;
```

Затем пользователь может подключиться через:
- TablePlus
- DBeaver  
- pgAdmin
- Любой PostgreSQL клиент

## 📱 МОБИЛЬНЫЙ ДОСТУП

### TablePlus для iOS/Android:
1. Скачайте приложение
2. New connection → PostgreSQL
3. Данные подключения:
   ```
   Host: ep-lively-hat-a1aqblz3.ap-southeast-1.aws.neon.tech
   Database: vobvorot
   User: vobvorot_owner
   Password: WUJUYkjHT68V
   SSL Mode: Require
   ```

## 💡 ПОЛЕЗНЫЕ SQL ЗАПРОСЫ

```sql
-- Посмотреть все заказы за сегодня
SELECT * FROM orders 
WHERE DATE(created_at) = CURRENT_DATE;

-- Товары которых мало на складе
SELECT * FROM products 
WHERE quantity < 10;

-- Статистика продаж по категориям
SELECT c.name, COUNT(oi.id) as sales, SUM(oi.price * oi.quantity) as revenue
FROM categories c
JOIN products p ON p.category_id = c.id
JOIN order_items oi ON oi.product_id = p.id
GROUP BY c.name
ORDER BY revenue DESC;

-- Найти дубликаты товаров
SELECT name, COUNT(*) 
FROM products 
GROUP BY name 
HAVING COUNT(*) > 1;
```

## ⚠️ ВАЖНАЯ ИНФОРМАЦИЯ

**Ваша база данных:**
- Провайдер: Neon (https://neon.tech)
- Регион: ap-southeast-1 (Сингапур)
- Проект: vobvorot
- SSL: Обязательно включен

**Бэкапы:**
- Neon делает автоматические бэкапы
- Можно восстановить на любой момент за последние 7 дней
- В консоли: History → выберите момент → Restore

## 🆘 ПРОБЛЕМЫ?

1. **Не могу войти в Neon?**
   - Проверьте email от создания БД
   - Используйте "Forgot password"

2. **Не вижу данные?**
   - Убедитесь что выбрали правильный проект
   - Проверьте что смотрите правильную схему (public)

3. **Изменения не появляются на сайте?**
   - Подождите 1-2 минуты (кэш Prisma Accelerate)
   - Очистите кэш браузера