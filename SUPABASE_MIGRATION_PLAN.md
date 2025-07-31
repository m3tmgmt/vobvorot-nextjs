# 🚀 ПЛАН МИГРАЦИИ НА SUPABASE

## ⏱️ Время: 30-40 минут

## 📝 ШАГ 1: Создание Supabase проекта (5 мин)
1. Зайти на https://supabase.com
2. Создать аккаунт (можно через GitHub)
3. Создать новый проект:
   - Название: vobvorot
   - Пароль БД: (запишите!)
   - Регион: Singapore (ближайший)

## 🗄️ ШАГ 2: Экспорт данных из Railway (10 мин)
```bash
# Экспортируем структуру БД
npx prisma db pull

# Генерируем SQL для Supabase
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > supabase-init.sql
```

## 📥 ШАГ 3: Импорт в Supabase (5 мин)
1. В Supabase Dashboard → SQL Editor
2. Вставить содержимое supabase-init.sql
3. Выполнить

## 🔄 ШАГ 4: Перенос данных (10 мин)
```bash
# Запустить скрипт миграции
node migrate-to-supabase.js
```

## 🔧 ШАГ 5: Обновление проекта (5 мин)
1. Заменить DATABASE_URL в .env на Supabase URL
2. Удалить DIRECT_DATABASE_URL (больше не нужен)
3. Обновить на Vercel:
```bash
npx vercel env rm DATABASE_URL production
npx vercel env add DATABASE_URL production
# Вставить новый URL от Supabase
```

## 🚀 ШАГ 6: Деплой (5 мин)
```bash
npx vercel --prod --token yGHkW9HSoepeo4Q8ZnSBEKwn
```

## ✅ РЕЗУЛЬТАТ:
- БД доступна через веб-интерфейс
- Можно редактировать с телефона
- Автоматические бекапы
- SQL редактор встроенный
- Прямой доступ без проблем

## 🎁 БОНУСЫ SUPABASE:
- Встроенная аутентификация
- Хранилище файлов (для фото товаров)
- Realtime подписки
- Edge Functions
- Векторная БД для AI

## ⚠️ ВАЖНО:
- Бесплатный план: 500MB БД, 1GB хранилище
- Для магазина этого более чем достаточно
- Если понадобится больше - $25/месяц