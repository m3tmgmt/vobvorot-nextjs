#!/bin/bash

# 🧹 Скрипт оптимизации MCP серверов для AI агента VOBVOROT

echo "🔧 Оптимизация MCP серверов для реализации AI агента..."
echo ""

# Функция для безопасной остановки процесса
stop_mcp_server() {
    local server_name=$1
    echo -n "  Остановка $server_name... "
    
    # Пытаемся найти и остановить процесс
    if pgrep -f "mcp-server-$server_name" > /dev/null 2>&1; then
        pkill -TERM -f "mcp-server-$server_name" 2>/dev/null
        echo "✅"
    else
        echo "⏭️  (не запущен)"
    fi
}

echo "📊 Текущее использование памяти:"
vm_stat | grep -E "Pages (free|active|inactive|speculative|wired)" | head -5
echo ""

echo "🛑 Остановка ненужных MCP серверов:"
echo ""

# Массив ненужных для AI агента серверов
unnecessary_servers=(
    "brave-search"
    "youtube-data"
    "docker"
    "terraform"
    "vercel"
    "sentry"
    "supabase"
    "figma"
    "playwright"
    "browser-tools"
    "context7"
    "riza-code-interpreter"
    "jira"
    "serena"
    "ref"
)

# Останавливаем каждый ненужный сервер
for server in "${unnecessary_servers[@]}"; do
    stop_mcp_server "$server"
done

echo ""
echo "✅ Оптимизация завершена!"
echo ""
echo "🔵 Активные MCP серверы для AI агента:"
echo "  • filesystem - работа с файлами проекта"
echo "  • github - версионный контроль и деплой"
echo "  • gemini - AI обработка сообщений"
echo "  • postgres - база данных магазина"
echo "  • memory - контекст и состояние разговоров"
echo ""

echo "💾 Использование памяти после оптимизации:"
vm_stat | grep -E "Pages (free|active|inactive|speculative|wired)" | head -5
echo ""

# Дополнительная очистка
echo "🧹 Дополнительная очистка:"
echo -n "  Очистка npm кеша... "
npm cache clean --force > /dev/null 2>&1
echo "✅"

echo -n "  Очистка системного кеша... "
sudo purge > /dev/null 2>&1 || echo "⚠️  (требуются права sudo)"

echo ""
echo "💡 Рекомендации:"
echo "  1. Перезапустите Claude Code для применения изменений"
echo "  2. Используйте минимальный набор компонентов 4OZEN"
echo "  3. Активируйте Context Engineering для оптимизации токенов"
echo ""
echo "🚀 Готово к реализации AI агента!"