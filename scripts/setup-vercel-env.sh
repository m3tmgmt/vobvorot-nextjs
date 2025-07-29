#!/bin/bash

# ======================================
# Настройка переменных окружения Vercel
# ======================================

echo "🔐 Настройка переменных окружения для AI ассистента VOBVOROT"
echo "================================================"

# Список необходимых переменных
REQUIRED_VARS=(
  "TELEGRAM_BOT_TOKEN"
  "GEMINI_API_KEY"
  "DATABASE_URL"
  "CLOUDINARY_URL"
  "CLOUDINARY_CLOUD_NAME"
  "CLOUDINARY_API_KEY"
  "CLOUDINARY_API_SECRET"
  "RESEND_API_KEY"
  "WESTERNBID_USERNAME"
  "WESTERNBID_PASSWORD"
  "WESTERNBID_API_URL"
  "NEXT_PUBLIC_ADMIN_ID"
)

echo ""
echo "⚠️  ВАЖНО: Убедитесь, что у вас есть все необходимые ключи API"
echo ""
echo "Необходимые переменные окружения:"
for var in "${REQUIRED_VARS[@]}"; do
  echo "  - $var"
done

echo ""
echo "📝 Пример команд для установки переменных в Vercel:"
echo ""
echo "# Установка переменных через CLI (замените значения на реальные):"
for var in "${REQUIRED_VARS[@]}"; do
  echo "vercel env add $var production"
done

echo ""
echo "🔗 Или используйте веб-интерфейс Vercel:"
echo "   https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs/settings/environment-variables"
echo ""
echo "✅ После установки всех переменных, перезапустите deployment:"
echo "   vercel --prod --force"
echo ""