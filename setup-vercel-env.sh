#!/bin/bash
# Скрипт настройки переменных окружения в Vercel

echo "🔧 Настройка переменных окружения в Vercel..."

# Получаем значения из локального .env файла и устанавливаем в Vercel

# TELEGRAM_BOT_TOKEN
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  vercel env rm TELEGRAM_BOT_TOKEN production --yes 2>/dev/null || true
  echo "$TELEGRAM_BOT_TOKEN" | vercel env add TELEGRAM_BOT_TOKEN production
  echo "✅ Установлена TELEGRAM_BOT_TOKEN"
else
  echo "⚠️  TELEGRAM_BOT_TOKEN не найдена в локальном окружении"
fi

# TELEGRAM_OWNER_CHAT_ID
if [ -n "$TELEGRAM_OWNER_CHAT_ID" ]; then
  vercel env rm TELEGRAM_OWNER_CHAT_ID production --yes 2>/dev/null || true
  echo "$TELEGRAM_OWNER_CHAT_ID" | vercel env add TELEGRAM_OWNER_CHAT_ID production
  echo "✅ Установлена TELEGRAM_OWNER_CHAT_ID"
else
  echo "⚠️  TELEGRAM_OWNER_CHAT_ID не найдена в локальном окружении"
fi

# GEMINI_API_KEY
if [ -n "$GEMINI_API_KEY" ]; then
  vercel env rm GEMINI_API_KEY production --yes 2>/dev/null || true
  echo "$GEMINI_API_KEY" | vercel env add GEMINI_API_KEY production
  echo "✅ Установлена GEMINI_API_KEY"
else
  echo "⚠️  GEMINI_API_KEY не найдена в локальном окружении"
fi

# DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  vercel env rm DATABASE_URL production --yes 2>/dev/null || true
  echo "$DATABASE_URL" | vercel env add DATABASE_URL production
  echo "✅ Установлена DATABASE_URL"
else
  echo "⚠️  DATABASE_URL не найдена в локальном окружении"
fi

# NEXTAUTH_URL
if [ -n "$NEXTAUTH_URL" ]; then
  vercel env rm NEXTAUTH_URL production --yes 2>/dev/null || true
  echo "$NEXTAUTH_URL" | vercel env add NEXTAUTH_URL production
  echo "✅ Установлена NEXTAUTH_URL"
else
  echo "⚠️  NEXTAUTH_URL не найдена в локальном окружении"
fi

# TELEGRAM_WEBHOOK_SECRET
if [ -n "$TELEGRAM_WEBHOOK_SECRET" ]; then
  vercel env rm TELEGRAM_WEBHOOK_SECRET production --yes 2>/dev/null || true
  echo "$TELEGRAM_WEBHOOK_SECRET" | vercel env add TELEGRAM_WEBHOOK_SECRET production
  echo "✅ Установлена TELEGRAM_WEBHOOK_SECRET"
else
  echo "⚠️  TELEGRAM_WEBHOOK_SECRET не найдена в локальном окружении"
fi

echo "✅ Настройка переменных завершена"
echo "🚀 Запускаем deployment..."
vercel --prod
