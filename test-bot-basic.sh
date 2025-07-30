#!/bin/bash

# Простой тест основных функций бота

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 Базовый тест Telegram Bot API${NC}"
echo "================================="

# Токен бота
BOT_TOKEN="7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI"
WEBHOOK_URL="http://localhost:3001/api/telegram/ai-assistant"

# Проверяем статус сервера
echo -e "\n${BLUE}Проверка сервера...${NC}"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Сервер запущен${NC}"
else
    echo -e "${RED}❌ Сервер не отвечает${NC}"
    exit 1
fi

# Тестируем простые команды
echo -e "\n${BLUE}Тестирование базовых команд:${NC}\n"

# Команда /start
echo -e "${BLUE}1. Команда /start${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d '{
    "update_id": 100,
    "message": {
      "message_id": 100,
      "from": {"id": 316593422, "first_name": "Admin"},
      "chat": {"id": 316593422, "type": "private"},
      "date": 1000000000,
      "text": "/start",
      "entities": [{"type": "bot_command", "offset": 0, "length": 6}]
    }
  }' -s -w "\nHTTP Status: %{http_code}\n" | grep -E "(HTTP Status|✅|❌|⛔)"

sleep 1

# Статистика (быстрая команда)
echo -e "\n${BLUE}2. Быстрая команда 'статистика'${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d '{
    "update_id": 101,
    "message": {
      "message_id": 101,
      "from": {"id": 316593422, "first_name": "Admin"},
      "chat": {"id": 316593422, "type": "private"},
      "date": 1000000001,
      "text": "статистика"
    }
  }' -s -w "\nHTTP Status: %{http_code}\n" | grep -E "(HTTP Status|✅|❌|⛔)"

echo -e "\n${GREEN}✅ Базовый тест завершен${NC}"
echo -e "\nПроверьте логи сервера для просмотра подробных ответов."