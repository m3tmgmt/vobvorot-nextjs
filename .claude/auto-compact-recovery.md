# 🔄 Auto-Compact Recovery System

## Автоматическое восстановление контекста при /compact

### 🎯 ПРИНЦИП РАБОТЫ:

Когда пользователь выполняет `/compact` или auto-compact, Claude автоматически:

1. **Сохраняет текущее состояние** перед compacting
2. **После compact** автоматически восстанавливает контекст
3. **Продолжает работу** с того же места без потери информации

### 🤖 АВТОМАТИЧЕСКИЙ АЛГОРИТМ:

```
ОБНАРУЖЕНИЕ /compact:
├── Триггер: уменьшение доступного контекста
├── Действие 1: Авто-сохранение текущего состояния
├── Действие 2: Выполнение compact операции  
├── Действие 3: Автоматическое восстановление
└── Результат: Продолжение работы без потерь
```

### 📋 AUTO-RECOVERY CHECKLIST:

При автоматическом восстановлении Claude выполняет:

1. ✅ **Context Recovery Script**
   ```bash
   ./.claude/context-recovery.sh
   ```

2. ✅ **Session Memory Read**
   ```bash
   cat .claude/session-memory.md
   ```

3. ✅ **MCP Memory Check**
   ```
   mcp__memory__read_graph()
   mcp__memory__search_nodes("VobVorot")
   ```

4. ✅ **Project Status Verification**
   ```bash
   git status
   git log -1 --oneline  
   npm run build --dry-run
   ```

5. ✅ **Environment Validation**
   ```bash
   # Проверка .env.local
   # Проверка package.json
   # Проверка key files
   ```

### 🔍 DETECTION PATTERNS:

Claude автоматически определяет необходимость восстановления по:

- **Прямой команде:** "восстанови контекст"
- **Косвенным признакам:** потеря понимания проекта
- **Context switches:** переход между сессиями
- **Memory gaps:** отсутствие recent memory
- **AUTO-COMPACT TRIGGER:** автоматическое сжатие при достижении лимита контекста
- **POST-COMPACT STATE:** состояние после любого compact (manual/auto)

### 💬 ФРАЗЫ-ТРИГГЕРЫ:

Эти фразы автоматически запускают восстановление:

- "восстанови контекст"
- "продолжи работу" 
- "где мы остановились"
- "вернемся к проекту"
- "продолжим разработку"
- "восстанови память"
- "загрузи проект"

### 🚀 SILENT RECOVERY MODE:

При обнаружении потери контекста Claude:

1. **Молча выполняет** recovery процедуры
2. **Восстанавливает** полное понимание проекта  
3. **Отвечает** уже с полным контекстом
4. **Продолжает** работу без упоминания recovery

### 📊 RECOVERY SUCCESS METRICS:

Успешное восстановление означает:

- ✅ Знание текущей ветки и последнего коммита
- ✅ Понимание статуса WesternBid интеграции
- ✅ Память о FULLY AUTONOMOUS MODE
- ✅ Доступ к session decisions и архитектуре
- ✅ Готовность продолжить с того же места

### 🔧 MANUAL OVERRIDE:

Если автоматическое восстановление не сработало:

```bash
# Ручное восстановление
./.claude/context-recovery.sh

# Полный reset контекста
./.claude/auto-update.sh session

# Диагностика проблем
./.claude/auto-resolver.sh all
```

---

## 💡 ПРИМЕР РАБОТЫ:

**Сценарий:** Пользователь выполнил `/compact`

**Claude автоматически:**
```
[SILENT] Обнаружен compact/context loss
[SILENT] Выполняю ./.claude/context-recovery.sh
[SILENT] Читаю session-memory.md  
[SILENT] Проверяю MCP Memory граф
[SILENT] Восстанавливаю VobVorot project context
[SILENT] FULLY AUTONOMOUS MODE: активирован
[READY] Готов продолжить работу с WesternBid тестированием
```

**Пользователь видит:**
```
"Контекст восстановлен! Продолжаю работу с VobVorot проектом. 
Последний статус: WesternBid интеграция завершена, готов к тестированию."
```

---

*Система работает автономно и прозрачно для пользователя* 🤖