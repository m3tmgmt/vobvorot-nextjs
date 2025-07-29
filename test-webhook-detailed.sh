#!/bin/bash

# Детальное тестирование webhook с разными вариантами токена

URL="https://vobvorot.shop/api/telegram/ai-assistant"

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

echo "=== Testing webhook authentication ==="
echo ""

# Test 1: With correct token
echo "Test 1: With correct token 'vobvorot_webhook_secret_2025'"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d "$PAYLOAD")
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')
echo "Status: $http_status"
echo "Body: $body"
echo ""

# Test 2: Without token
echo "Test 2: Without token header"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')
echo "Status: $http_status"
echo "Body: $body"
echo ""

# Test 3: With wrong token
echo "Test 3: With wrong token"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: wrong_token" \
  -d "$PAYLOAD")
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')
echo "Status: $http_status"
echo "Body: $body"
echo ""

# Test 4: Check headers with verbose
echo "Test 4: Verbose request to see all headers"
echo "Running: curl -v -X POST..."
curl -v -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d "$PAYLOAD" 2>&1 | grep -E "(< HTTP|< x-|< X-|401|200)"