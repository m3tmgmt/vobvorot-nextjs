# Исправление SPF записи для vobvorot.com

## Проблема:
У вас есть несколько SPF записей, что вызывает проблемы с доставкой email. Должна быть только одна SPF запись.

## Решение:

### 1. Зайдите в GoDaddy DNS управление:
- Войдите в GoDaddy аккаунт
- Перейдите в "My Products"
- Найдите домен vobvorot.com
- Нажмите "DNS"

### 2. Найдите все TXT записи с SPF:
Ищите записи, которые начинаются с `v=spf1`

### 3. Удалите ВСЕ SPF записи кроме одной

### 4. Создайте ОДНУ правильную SPF запись:

**Type:** TXT  
**Host:** @  
**Value:** `v=spf1 include:secureserver.net include:spf.godaddy.com include:amazonses.com ~all`

Эта запись включает:
- `include:secureserver.net` - для GoDaddy email
- `include:spf.godaddy.com` - для GoDaddy сервисов
- `include:amazonses.com` - для Resend (использует Amazon SES)
- `~all` - soft fail для остальных

### 5. Проверьте DNS записи для Resend:

Убедитесь, что у вас есть эти записи для Resend:

**DKIM записи (если Resend их предоставил):**
- Type: CNAME или TXT
- Host: как указано в Resend
- Value: как указано в Resend

### 6. Подождите пропагацию DNS:
Изменения могут занять от 15 минут до 48 часов

### 7. Проверьте SPF запись:
Используйте онлайн инструменты:
- https://mxtoolbox.com/spf.aspx
- https://www.mail-tester.com/

## Важно:
- У вас должна быть ТОЛЬКО ОДНА SPF запись
- Все сервисы должны быть включены в эту одну запись через `include:`
- Не создавайте несколько SPF записей!