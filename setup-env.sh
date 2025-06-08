#!/bin/bash

echo "Настройка переменных окружения для Vercel..."

# Добавляем переменные для production
echo "Добавление TELEGRAM_BOT_TOKEN..."
echo "7274106590:AAFVUDX05v5FgvhzfAPJmfVOWVbfporRnMY" | npx vercel env add TELEGRAM_BOT_TOKEN production

echo "Добавление TELEGRAM_BOT_USERNAME..."
echo "VobvorotecomAdminBot" | npx vercel env add TELEGRAM_BOT_USERNAME production

echo "Добавление OWNER_TELEGRAM_ID..."
echo "316593422" | npx vercel env add OWNER_TELEGRAM_ID production

echo "Добавление TELEGRAM_WEBHOOK_SECRET..."
echo "TG_vobvorot_webhook_secret_2024_secure_key_xyz789" | npx vercel env add TELEGRAM_WEBHOOK_SECRET production

echo "Добавление ADMIN_API_KEY..."
echo "ADMIN_vobvorot_api_key_2024_ultra_secure_access_token_abc123xyz" | npx vercel env add ADMIN_API_KEY production

echo "Добавление NEXTAUTH_SECRET..."
echo "nextauth-secret-production-key-change-this-2024" | npx vercel env add NEXTAUTH_SECRET production

echo "Добавление NEXTAUTH_URL..."
echo "https://vobvorot-nextjs-q2b88aykt-m3tmgmt-gmailcoms-projects.vercel.app" | npx vercel env add NEXTAUTH_URL production

echo "Переменные окружения добавлены! Запускаем повторный деплой..."
npx vercel --prod