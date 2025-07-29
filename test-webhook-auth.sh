#!/bin/bash

# Тестирование webhook с правильной аутентификацией

URL="https://vobvorot.shop/api/telegram/ai-assistant"
SECRET="vobvorot_webhook_secret_2025"

echo "Testing webhook authentication..."
echo "URL: $URL"
echo "Secret: $SECRET"
echo ""

# Тестовый update от Telegram
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

echo "Sending test webhook request..."
echo ""

# Отправляем запрос с правильным header
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: $SECRET" \
  -d "$PAYLOAD")

# Извлекаем статус и тело ответа
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $http_status"
echo "Response body:"
echo "$body"
echo ""

if [ "$http_status" = "200" ]; then
  echo "✅ Webhook authentication successful!"
elif [ "$http_status" = "401" ]; then
  echo "❌ Authentication failed (401 Unauthorized)"
  echo "Check that TELEGRAM_WEBHOOK_SECRET environment variable is set correctly in Vercel"
else
  echo "⚠️ Unexpected status code: $http_status"
fi