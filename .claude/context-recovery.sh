#!/bin/bash

# Claude AI Context Recovery Script
# Автоматическое восстановление контекста сессии

echo "🧠 Claude AI Context Recovery System"
echo "===================================="

# Проверка текущей ветки и статуса
echo ""
echo "📋 GIT STATUS:"
git branch --show-current
git status --porcelain
echo ""

# Последние коммиты для контекста
echo "📝 RECENT COMMITS:"
git log --oneline -5
echo ""

# Структура проекта (ключевые файлы)
echo "🏗️  KEY PROJECT FILES:"
find . -name "*.tsx" -o -name "*.ts" | grep -E "(payment|westernbid|checkout)" | head -10
echo ""

# Переменные окружения (безопасно)
echo "⚙️  ENVIRONMENT STATUS:"
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    grep -c "WESTERNBID" .env.local && echo "✅ WesternBid configured"
else
    echo "❌ .env.local missing"
fi
echo ""

# Последний деплой
echo "🚀 DEPLOYMENT STATUS:"
if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI available"
else
    echo "❌ Vercel CLI not found"
fi
echo ""

# Содержимое session memory
echo "💾 SESSION MEMORY:"
if [ -f ".claude/session-memory.md" ]; then
    echo "✅ Session memory found"
    head -20 .claude/session-memory.md
else
    echo "❌ Session memory not found"
fi
echo ""

echo "🎯 Quick Recovery Commands:"
echo "npm run dev          # Start development server"
echo "npm run build        # Build project"  
echo "npx vercel --prod    # Deploy to production"
echo "git log --oneline    # See recent commits"
echo ""
echo "Context recovery completed! 🚀"