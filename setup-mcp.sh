#!/bin/bash

# Скрипт для настройки MCP Resend сервера

echo "🔧 Настройка MCP сервера для Resend..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js 18+"
    exit 1
fi

# Проверка зависимостей
if [ ! -d "node_modules/@modelcontextprotocol" ]; then
    echo "📦 Установка MCP SDK..."
    npm install @modelcontextprotocol/sdk
fi

# Создание права на выполнение
chmod +x mcp-resend-server.js

# Определение пути к конфигурации Claude Desktop
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# Создание директории если не существует
mkdir -p "$CLAUDE_CONFIG_DIR"

# Путь к текущей директории
CURRENT_DIR=$(pwd)

# Создание или обновление конфигурации Claude
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "📝 Обновление существующей конфигурации Claude..."
    # Бэкап существующей конфигурации
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup"
    
    # Добавление нашего MCP сервера (простое слияние)
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "resend": {
      "command": "node",
      "args": ["./mcp-resend-server.js"],
      "cwd": "$CURRENT_DIR"
    }
  }
}
EOF
else
    echo "📝 Создание новой конфигурации Claude..."
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "resend": {
      "command": "node",
      "args": ["./mcp-resend-server.js"],
      "cwd": "$CURRENT_DIR"
    }
  }
}
EOF
fi

echo "✅ MCP сервер настроен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Перезапустите Claude Desktop"
echo "2. Получите API ключ на https://resend.com/api-keys"
echo "3. Попросите Claude: 'Добавь домен vobvorot.com в Resend с API ключом re_your_key'"
echo ""
echo "📁 Конфигурация сохранена в: $CLAUDE_CONFIG_FILE"
echo "📚 Инструкция: $(pwd)/MCP_RESEND_SETUP.md"