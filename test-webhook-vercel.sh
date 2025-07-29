#!/bin/bash

# Тестирование webhook через Vercel URL

# Используем URL последнего deployment
URL="https://vobvorot-nextjs-1uvkt39gn-m3tmgmt-gmailcoms-projects.vercel.app/api/telegram/ai-assistant"

# Тестовый payload
PAYLOAD='{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 316593422,
      "is_bot": false,
      "first_name": "Test",
      "username": "testuser"
    },
    "chat": {
      "id": 316593422,
      "first_name": "Test",
      "username": "testuser", 
      "type": "private"
    },
    "date": 1753793000,
    "text": "/start"
  }
}'

echo "=== Testing webhook via Vercel URL ==="
echo "URL: $URL"
echo ""

# Test with correct token
echo "Test with token: vobvorot_webhook_secret_2025"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d "$PAYLOAD")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $http_status"
echo "Response:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo ""

if [ "$http_status" = "200" ]; then
  echo "✅ Webhook работает правильно!"
elif [ "$http_status" = "401" ]; then
  echo "❌ Ошибка аутентификации - проверьте TELEGRAM_WEBHOOK_SECRET в Vercel"
else
  echo "⚠️ Неожиданный статус: $http_status"
fi