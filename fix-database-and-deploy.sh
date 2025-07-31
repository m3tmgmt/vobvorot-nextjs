#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С БОТОМ"
echo "================================"

echo "1️⃣ Применяем миграцию..."
npx prisma migrate deploy

echo "2️⃣ Деплоим на Vercel..."
npx vercel --prod --token yGHkW9HSoepeo4Q8ZnSBEKwn

echo "✅ ГОТОВО! Бот должен заработать!"
echo ""
echo "Если миграция не сработала, выполните SQL вручную:"
echo "cat fix-emoji-column.sql"