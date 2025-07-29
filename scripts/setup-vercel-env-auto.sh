#!/bin/bash

# Автоматическая настройка переменных окружения Vercel
TOKEN="yGHkW9HSoepeo4Q8ZnSBEKwn"

echo "🔐 Настройка переменных окружения для AI ассистента..."

# Функция для добавления переменной
add_env() {
  echo "$2" | vercel env add "$1" production --token "$TOKEN" --force 2>&1
  echo "✅ $1 добавлен"
}

# Telegram Bot
add_env "TELEGRAM_BOT_TOKEN" "7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI"
add_env "NEXT_PUBLIC_ADMIN_ID" "316593422"
add_env "TELEGRAM_BOT_USERNAME" "VobvorotAdminBot"
add_env "TELEGRAM_OWNER_CHAT_ID" "316593422,1837334996"
add_env "OWNER_TELEGRAM_ID" "316593422"
add_env "TELEGRAM_WEBHOOK_SECRET" "vobvorot_webhook_secret_2025"

# AI
add_env "GEMINI_API_KEY" "AIzaSyAYSLsD4XW40XJm5uv6w71bYoZkTAeoU7Y"

# База данных
add_env "DATABASE_URL" "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWEI3R1JQOEFBQTZUODk4REFOTlI4QVgiLCJ0ZW5hbnRfaWQiOiI5NjAwOGM1MDMyZTg0ZTE3NjUzNWM2MzlmOTQ4ODkxZGMzZTU2YmFjYTJiZWNlOGRkNWI0ZGViOTFlMjcyNGYxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNzgwMDFkNjgtNWI1Zi00ZmQzLWFkMTMtYmRkMDRlN2U3MDU2In0.MaCYMs1qji8lEoIuwP5sjrR7SdpjBqK_RUbd3nOD3Rs"
add_env "DIRECT_DATABASE_URL" "postgresql://vobvorot_owner:WUJUYkjHT68V@ep-lively-hat-a1aqblz3.ap-southeast-1.aws.neon.tech/vobvorot?sslmode=require"

# Cloudinary
add_env "CLOUDINARY_URL" "cloudinary://576232937933712:51NC1qSag-XbWCsRPi2-Lr0iW1E@dqi4iuyo1"
add_env "CLOUDINARY_CLOUD_NAME" "dqi4iuyo1"
add_env "CLOUDINARY_API_KEY" "576232937933712"
add_env "CLOUDINARY_API_SECRET" "51NC1qSag-XbWCsRPi2-Lr0iW1E"

# Email
add_env "RESEND_API_KEY" "re_duDcZGcm4a7eFCDUEpJr2D4zxCtPbuild"
add_env "FROM_EMAIL" "support@vobvorot.com"

# WesternBid
add_env "WESTERNBID_MERCHANT_ID" "159008"
add_env "WESTERNBID_SECRET_KEY" "oVsVCgu"
add_env "WESTERNBID_API_URL" "https://westernbid.com"
add_env "WESTERNBID_USERNAME" ""
add_env "WESTERNBID_PASSWORD" ""

# NextAuth
add_env "NEXTAUTH_URL" "https://vobvorot.com"
add_env "NEXTAUTH_SECRET" "af15d8b63d97bb34186432741dfec30a4c5ba201fd95dac5c1f90e92019c1631"

# Admin API
add_env "ADMIN_API_KEY" "f6fef89ba9756e14e153aaa972dfa42bc21b64f858f084a59ae882107f41e7a5"
add_env "INTERNAL_API_KEY" "b42f73cad3bcaeb0536aca2643a5059f1f04901bbf794e461ab393d78ad2a4f9"

# Environment
add_env "NODE_ENV" "production"
add_env "NEXT_PUBLIC_SITE_URL" "https://vobvorot.com"

echo ""
echo "✅ Все переменные окружения настроены!"
echo ""
echo "🚀 Перезапуск deployment..."
vercel --prod --token "$TOKEN" --force

echo ""
echo "✅ Deployment запущен!"