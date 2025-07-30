#!/bin/bash

# Запуск простого теста API бота через локальный сервер

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 Тестирование Telegram Bot API${NC}"
echo "================================="

# Проверяем, запущен ли сервер
echo -e "\n${BLUE}1. Проверка сервера...${NC}"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Сервер запущен на порту 3001${NC}"
else
    echo -e "${RED}❌ Сервер не запущен. Запустите 'PORT=3001 npm run dev' в другом терминале.${NC}"
    exit 1
fi

# Токен бота
BOT_TOKEN="7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI"
WEBHOOK_URL="http://localhost:3001/api/telegram/ai-assistant"

# Тестовые команды
echo -e "\n${BLUE}2. Отправка тестовых команд...${NC}\n"

# Тест 1: Показать товары
echo -e "${BLUE}Тест 1: Показать товары${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: $BOT_TOKEN" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "from": {"id": 316593422, "first_name": "Test", "username": "testuser"},
      "chat": {"id": 316593422, "type": "private"},
      "date": 1000000000,
      "text": "покажи товары"
    }
  }' -s -w "\nHTTP Status: %{http_code}\n\n"

# Тест 2: Показать заказы
echo -e "${BLUE}Тест 2: Показать заказы${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: $BOT_TOKEN" \
  -d '{
    "update_id": 2,
    "message": {
      "message_id": 2,
      "from": {"id": 316593422, "first_name": "Test", "username": "testuser"},
      "chat": {"id": 316593422, "type": "private"},
      "date": 1000000001,
      "text": "покажи заказы"
    }
  }' -s -w "\nHTTP Status: %{http_code}\n\n"

# Тест 3: Статистика
echo -e "${BLUE}Тест 3: Статистика системы${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: $BOT_TOKEN" \
  -d '{
    "update_id": 3,
    "message": {
      "message_id": 3,
      "from": {"id": 316593422, "first_name": "Test", "username": "testuser"},
      "chat": {"id": 316593422, "type": "private"},
      "date": 1000000002,
      "text": "статистика"
    }
  }' -s -w "\nHTTP Status: %{http_code}\n\n"

# Тест 4: Товары с низким остатком
echo -e "${BLUE}Тест 4: Товары с низким остатком${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: $BOT_TOKEN" \
  -d '{
    "update_id": 4,
    "message": {
      "message_id": 4,
      "from": {"id": 316593422, "first_name": "Test", "username": "testuser"},
      "chat": {"id": 316593422, "type": "private"},
      "date": 1000000003,
      "text": "товары с низким остатком"
    }
  }' -s -w "\nHTTP Status: %{http_code}\n\n"

echo -e "${GREEN}✅ Тесты завершены!${NC}"
echo -e "\n${BLUE}Примечание:${NC} Проверьте консоль сервера для просмотра ответов бота."