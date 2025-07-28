#!/bin/bash

echo "🚀 Запуск vobvorot сайта..."

# Устанавливаем правильный NODE_ENV
export NODE_ENV=development

# Убиваем существующие процессы
pkill -f "next dev" 2>/dev/null || true

# Ждем немного
sleep 2

# Запускаем сервер
echo "📡 Запуск Next.js сервера на порту 3000..."
npx next dev --port 3000 --hostname 0.0.0.0

echo "✅ Сервер готов: http://localhost:3000"