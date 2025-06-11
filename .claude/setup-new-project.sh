#!/bin/bash

# Claude AI Context System - New Project Setup
# Быстрая установка системы в новый проект

PROJECT_NAME="$1"
PROJECT_TYPE="$2"

if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: $0 <project-name> [project-type]"
    echo "Types: nextjs, react, node, python, general"
    exit 1
fi

echo "🚀 Setting up Claude Context System for: $PROJECT_NAME"
echo "📦 Project type: ${PROJECT_TYPE:-general}"

# Создание .claude структуры
mkdir -p .claude

# Определение source директории (откуда копировать)
CLAUDE_SOURCE_DIR="/Users/matty/exvicpmour-store/vobvorot-nextjs/.claude"

# Базовая session-memory для нового проекта
cat > .claude/session-memory.md << EOF
# Claude AI Session Memory System

## ТЕКУЩАЯ СЕССИЯ - $PROJECT_NAME
**Дата:** $(date)
**Проект:** $PROJECT_NAME
**Тип:** ${PROJECT_TYPE:-"General"}
**Ветка:** $(git branch --show-current 2>/dev/null || echo "main")
**Последний коммит:** $(git log -1 --oneline 2>/dev/null || echo "No commits yet")

---

## 🎯 СТАТУС ПРОЕКТА

### Инициализация:
- [x] Claude Context System установлена
- [x] FULLY AUTONOMOUS MODE активирован
- [x] AUTO-COMPACT RECOVERY включен
- [ ] Основная архитектура определена
- [ ] Зависимости настроены
- [ ] Development environment готов

### Следующие шаги:
1. Анализ существующего кода (если есть)
2. Определение архитектуры и технологического стека
3. Настройка среды разработки
4. Создание базовой структуры проекта

---

## 🧠 КОНТЕКСТ ДЛЯ ВОССТАНОВЛЕНИЯ

### Проектные решения:
- Тип проекта: ${PROJECT_TYPE:-"Определяется"}
- Среда разработки: Настраивается
- Архитектура: Планируется

### Автономные возможности:
- ✅ **ДЕЙСТВИЕ ЛУЧШЕ БЕЗДЕЙСТВИЯ** - всегда пробую решение
- ✅ **АВТОНОМНОЕ ИСПРАВЛЕНИЕ** - исправляю ошибки самостоятельно
- ✅ **BYPASS PERMISSIONS** - предполагаю наличие разрешений
- ✅ **API/MCP FIRST** - использую все доступные инструменты
- ✅ **MINIMAL USER REQUESTS** - прошу помощь только при крайней необходимости

---

*FULLY AUTONOMOUS MODE: ACTIVATED* 🤖
*AUTO-COMPACT RECOVERY: ENABLED* 🔄
EOF

# Копирование core файлов системы
if [ -d "$CLAUDE_SOURCE_DIR" ]; then
    echo "📋 Copying Claude system files..."
    
    # Основные компоненты системы
    cp "$CLAUDE_SOURCE_DIR/autonomous-mode.md" .claude/ 2>/dev/null
    cp "$CLAUDE_SOURCE_DIR/capability-matrix.md" .claude/ 2>/dev/null
    cp "$CLAUDE_SOURCE_DIR/auto-compact-recovery.md" .claude/ 2>/dev/null
    cp "$CLAUDE_SOURCE_DIR/auto-compact-flow.md" .claude/ 2>/dev/null
    
    # Исполняемые скрипты
    cp "$CLAUDE_SOURCE_DIR/context-recovery.sh" .claude/ 2>/dev/null
    cp "$CLAUDE_SOURCE_DIR/auto-update.sh" .claude/ 2>/dev/null
    cp "$CLAUDE_SOURCE_DIR/auto-resolver.sh" .claude/ 2>/dev/null
    
    # Документация
    cp "$CLAUDE_SOURCE_DIR/README.md" .claude/ 2>/dev/null
    cp "$CLAUDE_SOURCE_DIR/USAGE.md" .claude/ 2>/dev/null
    
    echo "✅ Core files copied"
else
    echo "⚠️ Source directory not found, creating minimal setup"
fi

# Создание decisions-log для нового проекта
cat > .claude/decisions-log.md << EOF
# Журнал Технических Решений - $PROJECT_NAME

## 🎯 ИНИЦИАЛИЗАЦИЯ ПРОЕКТА

### Project Setup
**Дата:** $(date)
**Решение:** Инициализация Claude Context System
**Обоснование:** Максимальная автономия и сохранение контекста
**Файлы:** .claude/ система
**Статус:** ✅ Завершено

---

## 📚 АРХИТЕКТУРНЫЕ PATTERNS

### Auto-Recovery Pattern
```bash
# Автоматическое восстановление контекста
./.claude/context-recovery.sh
```

### Autonomous Decision Pattern  
```typescript
// Принцип: действие лучше ожидания разрешений
if (canSolveAutonomously) {
  executeSolution()
} else {
  requestMinimalHelp()
}
```

---

*Сохраняется для исторического контекста и быстрого восстановления решений*
EOF

# Настройка прав доступа
chmod 700 .claude
chmod 600 .claude/*.md 2>/dev/null
chmod 755 .claude/*.sh 2>/dev/null

# Добавление в .gitignore
if [ ! -f ".gitignore" ]; then
    touch .gitignore
fi

# Проверка что .claude/ еще не в .gitignore
if ! grep -q "\.claude" .gitignore; then
    cat >> .gitignore << EOF

# Claude AI Context System  
.claude/
.claude-session.md
*.claude-backup
EOF
    echo "✅ Added .claude/ to .gitignore"
fi

# Project-specific настройки
case "$PROJECT_TYPE" in
    "nextjs")
        echo "⚛️ Configuring for Next.js project..."
        # Добавить Next.js специфичные настройки
        ;;
    "react")
        echo "⚛️ Configuring for React project..."
        # Добавить React специфичные настройки
        ;;
    "node")
        echo "🟢 Configuring for Node.js project..."
        # Добавить Node.js специфичные настройки
        ;;
    "python")
        echo "🐍 Configuring for Python project..."
        # Добавить Python специфичные настройки
        ;;
    *)
        echo "📦 General project configuration..."
        ;;
esac

# Финальные шаги
echo ""
echo "✅ Claude Context System успешно установлена для $PROJECT_NAME!"
echo ""
echo "🤖 FULLY AUTONOMOUS MODE: АКТИВИРОВАН"
echo "🔄 AUTO-COMPACT RECOVERY: ВКЛЮЧЕН" 
echo "🔐 SECURITY: Максимальная (локальное хранение)"
echo ""
echo "📋 Готов к работе! Просто начни ставить задачи Claude."
echo ""
echo "🔧 Доступные команды:"
echo "  ./.claude/context-recovery.sh  # Восстановление контекста"
echo "  ./.claude/auto-update.sh       # Обновление состояния"
echo "  ./.claude/auto-resolver.sh     # Автоисправление проблем"
echo ""
echo "📖 Документация: .claude/README.md"
echo "👤 Инструкция: .claude/USAGE.md"