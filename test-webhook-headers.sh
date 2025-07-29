#!/bin/bash

# Test webhook to see exact headers and response
URL="https://vobvorot-nextjs-1uvkt39gn-m3tmgmt-gmailcoms-projects.vercel.app/api/telegram/ai-assistant"

echo "=== Testing webhook headers ==="
echo ""

# Make request and capture all headers
echo "Making request to: $URL"
echo ""

response=$(curl -i -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d '{"update_id": 123, "message": {"text": "test"}}')

echo "$response"
echo ""
echo "=== End of response ==="