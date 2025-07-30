
# Обновление webhook URL в Telegram
BOT_TOKEN="7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI"
WEBHOOK_URL="https://vobvorot.com/api/telegram/ai-assistant"
WEBHOOK_SECRET="vobvorot_webhook_secret_2025"

echo "🔗 Обновление Telegram webhook..."
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"secret_token\": \"$WEBHOOK_SECRET\",
    \"allowed_updates\": [\"message\", \"callback_query\"]
  }"

echo ""
echo "✅ Webhook обновлен"
