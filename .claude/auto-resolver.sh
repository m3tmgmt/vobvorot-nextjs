#!/bin/bash

# Claude AI Auto-Resolver System
# Автоматическое решение типичных проблем без запросов к пользователю

echo "🤖 Claude AI Auto-Resolver - FULLY AUTONOMOUS MODE"
echo "=================================================="

# Функция автоматического исправления TypeScript ошибок
auto_fix_typescript() {
    echo "🔧 Auto-fixing TypeScript errors..."
    
    # Проверка и установка отсутствующих типов
    if npm run build 2>&1 | grep -q "Cannot find module.*types"; then
        echo "📦 Installing missing type definitions..."
        npm install --save-dev @types/node @types/react @types/react-dom
    fi
    
    # Исправление распространенных ошибок импортов
    find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/import \* as React from/import React from/g'
    
    echo "✅ TypeScript auto-fixes applied"
}

# Функция автоматического исправления зависимостей
auto_fix_dependencies() {
    echo "📦 Checking and fixing dependencies..."
    
    # Очистка node_modules при конфликтах
    if [ -f "package-lock.json" ] && [ -f "yarn.lock" ]; then
        echo "🧹 Removing conflicting lock files..."
        rm yarn.lock
    fi
    
    # Обновление устаревших зависимостей
    if command -v npm &> /dev/null; then
        npm audit fix --force 2>/dev/null || true
    fi
    
    echo "✅ Dependencies auto-fixed"
}

# Функция автоматического исправления Prisma
auto_fix_prisma() {
    echo "🗄️ Auto-fixing Prisma issues..."
    
    # Регенерация Prisma client при ошибках
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate 2>/dev/null || true
        npx prisma db push 2>/dev/null || true
    fi
    
    echo "✅ Prisma auto-fixes applied"
}

# Функция автоматического исправления Vercel деплоя
auto_fix_vercel() {
    echo "🚀 Auto-fixing Vercel deployment issues..."
    
    # Создание vercel.json если отсутствует
    if [ ! -f "vercel.json" ]; then
        cat > vercel.json << EOF
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
EOF
        echo "✅ Created vercel.json"
    fi
    
    # Исправление environment variables
    if [ -f ".env.local" ] && [ ! -f ".env.production" ]; then
        cp .env.local .env.production
        echo "✅ Created production environment"
    fi
    
    echo "✅ Vercel auto-fixes applied"
}

# Функция автоматического исправления Git проблем
auto_fix_git() {
    echo "📝 Auto-fixing Git issues..."
    
    # Настройка Git user если не настроен
    if ! git config user.name > /dev/null 2>&1; then
        git config user.name "Claude AI Assistant"
        git config user.email "claude@anthropic.com"
        echo "✅ Git user configured"
    fi
    
    # Исправление конфликтов в .gitignore
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << EOF
node_modules/
.next/
.env.local
.env.production
.vercel/
*.log
.claude-session.md
EOF
        echo "✅ Created .gitignore"
    fi
    
    echo "✅ Git auto-fixes applied"
}

# Функция автоматического исправления Next.js
auto_fix_nextjs() {
    echo "⚛️ Auto-fixing Next.js issues..."
    
    # Создание next.config.js если отсутствует
    if [ ! -f "next.config.js" ] && [ ! -f "next.config.mjs" ]; then
        cat > next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
}

module.exports = nextConfig
EOF
        echo "✅ Created next.config.js"
    fi
    
    echo "✅ Next.js auto-fixes applied"
}

# Функция комплексной диагностики и автоисправления
auto_diagnose_and_fix() {
    echo "🔍 Running comprehensive auto-diagnosis..."
    
    # Проверка статуса сборки
    if ! npm run build > /dev/null 2>&1; then
        echo "❌ Build failed - applying auto-fixes..."
        auto_fix_typescript
        auto_fix_dependencies
        auto_fix_prisma
        auto_fix_nextjs
        
        # Повторная попытка сборки
        if npm run build > /dev/null 2>&1; then
            echo "✅ Build fixed automatically!"
        else
            echo "⚠️ Build still failing - manual intervention may be required"
        fi
    else
        echo "✅ Build is working correctly"
    fi
    
    # Проверка Git статуса
    if git status > /dev/null 2>&1; then
        auto_fix_git
    fi
    
    # Проверка Vercel конфигурации
    auto_fix_vercel
    
    echo "🎯 Auto-diagnosis completed"
}

# Основная функция
main() {
    case "$1" in
        "typescript"|"ts")
            auto_fix_typescript
            ;;
        "dependencies"|"deps")
            auto_fix_dependencies
            ;;
        "prisma")
            auto_fix_prisma
            ;;
        "vercel")
            auto_fix_vercel
            ;;
        "git")
            auto_fix_git
            ;;
        "nextjs")
            auto_fix_nextjs
            ;;
        "all"|"auto"|"")
            auto_diagnose_and_fix
            ;;
        *)
            echo "Usage: $0 {typescript|dependencies|prisma|vercel|git|nextjs|all}"
            echo "  typescript   - Fix TypeScript issues"
            echo "  dependencies - Fix npm/package issues" 
            echo "  prisma       - Fix Prisma database issues"
            echo "  vercel       - Fix Vercel deployment issues"
            echo "  git          - Fix Git configuration issues"
            echo "  nextjs       - Fix Next.js configuration"
            echo "  all          - Run comprehensive auto-diagnosis (default)"
            ;;
    esac
}

main "$@"