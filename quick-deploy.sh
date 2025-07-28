#!/bin/bash

# 🚀 VOBVOROT BOT FIX - QUICK DEPLOY
# Автоматический деплой исправления Telegram бота

echo "🤖 VobVorot Bot Fix - Quick Deploy"
echo "=================================="

# Проверяем наличие файлов
if [ ! -f "src/lib/telegram-bot-simple.ts" ]; then
    echo "❌ Файл telegram-bot-simple.ts не найден!"
    exit 1
fi

echo "✅ Исправление найдено в telegram-bot-simple.ts"

# Проверяем Vercel CLI
if command -v vercel >/dev/null 2>&1; then
    echo "🚀 Vercel CLI найден - пытаемся деплоить..."
    
    # Проверяем авторизацию
    if vercel whoami >/dev/null 2>&1; then
        echo "✅ Vercel авторизован - начинаем деплой..."
        vercel --prod --yes
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!"
            echo ""
            echo "🧪 ТЕСТИРУЙТЕ БОТА:"
            echo "1. Откройте Telegram"
            echo "2. Найдите @VobvorotAdminBot"
            echo "3. Отправьте /start"
            echo "4. Бот должен ответить с меню команд"
            echo ""
            exit 0
        else
            echo "❌ Ошибка деплоя через Vercel CLI"
        fi
    else
        echo "❌ Vercel не авторизован - запустите: vercel login"
    fi
else
    echo "❌ Vercel CLI не найден"
fi

echo ""
echo "📋 АЛЬТЕРНАТИВНЫЕ СПОСОБЫ ДЕПЛОЯ:"
echo "1. Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Найдите проект vobvorot-nextjs"
echo "3. Нажмите Redeploy"
echo ""
echo "📦 Архив готов: bot-fix-ready-*.tar.gz"
echo ""
echo "ℹ️  Подробности в: DEPLOY_BOT_FIX.md"