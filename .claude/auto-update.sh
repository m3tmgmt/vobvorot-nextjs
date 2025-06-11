#!/bin/bash

# Claude AI Auto-Update Context Script  
# Автоматически обновляет контекст перед критическими операциями

CLAUDE_DIR=".claude"
SESSION_FILE="$CLAUDE_DIR/session-memory.md"
DECISIONS_FILE="$CLAUDE_DIR/decisions-log.md"

# Функция обновления session memory
update_session_memory() {
    local current_branch=$(git branch --show-current)
    local last_commit=$(git log -1 --oneline)
    local timestamp=$(date)
    
    cat > "$SESSION_FILE" << EOF
# Claude AI Session Memory System

## ТЕКУЩАЯ СЕССИЯ - VobVorot Project
**Дата:** $timestamp
**Проект:** VobVorot E-commerce Store  
**Ветка:** $current_branch
**Последний коммит:** $last_commit
**Деплой:** https://vobvorot-nextjs-ncppwx5u3-m3tmgmt-gmailcoms-projects.vercel.app

---

## 🎯 ОСНОВНЫЕ ДОСТИЖЕНИЯ СЕССИИ

### ✅ WesternBid Payment Integration (ЗАВЕРШЕНО)
- **Учетные данные:** wb_login=159008, secret=oVsVCgu  
- **Тип интеграции:** Form-based (согласно документации WesternBid)
- **Поддерживаемые методы:** Stripe (2.9%), PayPal (2.9%), WesternBid (3.4%)
- **Ключевые файлы:**
  - \`src/components/PaymentMethodSelector.tsx\` - компонент выбора платежей
  - \`src/app/api/payment/westernbid/redirect/route.ts\` - редирект на WesternBid
  - \`src/lib/westernbid.ts\` - основная логика интеграции
  - \`src/app/api/webhooks/westernbid/route.ts\` - обработка уведомлений

---

## 🚀 СТАТУС ПРОЕКТА

### Завершенные компоненты:
- [x] Полная интеграция WesternBid с реальными данными
- [x] Компонент выбора платежных методов  
- [x] Форм-based интеграция с автоотправкой
- [x] Webhook обработчик для form-data и JSON
- [x] Деплой на Vercel production
- [x] Система сохранения контекста Claude AI

### Следующие приоритеты:
1. Тестирование полного цикла оплаты
2. Мониторинг webhook responses
3. Верификация успешных платежей

---

## 🧠 КОНТЕКСТ ДЛЯ ВОССТАНОВЛЕНИЯ

### Ключевые решения:
- Использована form-based интеграция WesternBid (не API)
- Создан универсальный PaymentMethodSelector для всех методов
- Webhook поддерживает и JSON и form-encoded данные
- Добавлены real credentials в production environment
- Реализована система автосохранения контекста Claude

### Архитектурные решения:
- Автоматическое переключение на следующий шаг после выбора метода оплаты
- Signature verification для безопасности webhooks  
- Fallback на mock payments в development режиме
- Comprehensive error handling с логированием
- Multi-layer context preservation system

---

## 📋 НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ ПРИ ВОССТАНОВЛЕНИИ

1. **Проверить ветку:** \`git status\` → $current_branch
2. **Последний коммит:** \`git log -1 --oneline\` → $last_commit
3. **Среда разработки:** Next.js 15.3.3 + TypeScript + Prisma + PostgreSQL  
4. **Тестовый URL:** https://vobvorot-nextjs-ncppwx5u3-m3tmgmt-gmailcoms-projects.vercel.app
5. **Восстановление контекста:** \`./.claude/context-recovery.sh\`

---

*Автоматически обновлено: $timestamp*
EOF

    echo "✅ Session memory updated: $timestamp"
}

# Функция логирования новых решений
log_decision() {
    local decision="$1"
    local reasoning="$2"
    local files="$3"
    local timestamp=$(date)
    
    cat >> "$DECISIONS_FILE" << EOF

### $decision
**Дата:** $timestamp  
**Решение:** $decision
**Обоснование:** $reasoning  
**Файлы:** $files  
**Статус:** ⏳ В процессе

EOF

    echo "📝 Decision logged: $decision"
}

# Основная функция
main() {
    case "$1" in
        "session")
            update_session_memory
            ;;
        "decision")
            log_decision "$2" "$3" "$4"
            ;;
        "auto")
            update_session_memory
            echo "🤖 Auto-update completed"
            ;;
        *)
            echo "Usage: $0 {session|decision|auto}"
            echo "  session  - Update session memory"
            echo "  decision - Log new decision"  
            echo "  auto     - Auto update (for hooks)"
            ;;
    esac
}

main "$@"