# Настройка DNS в GoDaddy для vobvorot.com

## 🔍 Текущее состояние
- ✅ SPF: Есть, но для GoDaddy (`secureserver.net`)
- ❌ DKIM: Отсутствует
- ✅ DMARC: Есть, но строгий

## 📋 Что нужно изменить в GoDaddy

### 1. Войдите в GoDaddy DNS Management
1. Перейдите на https://dcc.godaddy.com/manage/dns
2. Выберите домен `vobvorot.com`
3. Нажмите на DNS

### 2. Обновите SPF запись
**Найдите существующую TXT запись со значением:**
```
v=spf1 include:secureserver.net -all
```

**Замените её на:**
```
v=spf1 include:secureserver.net include:_spf.resend.com ~all
```

*Это позволит и GoDaddy, и Resend отправлять письма*

### 3. Добавьте DKIM запись
**Добавьте новую TXT запись:**
- **Type:** TXT
- **Name:** `resend._domainkey`
- **Value:** `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB`
- **TTL:** 1 Hour

### 4. Обновите DMARC (опционально)
**Измените существующую DMARC запись с:**
```
v=DMARC1; p=reject; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;
```

**На более мягкую:**
```
v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:admin@vobvorot.com;
```

*Это позволит письмам проходить при настройке*

## 📱 Пошаговые инструкции для GoDaddy

### Изменение SPF:
1. В DNS Management найдите TXT запись с `v=spf1`
2. Нажмите на карандаш (Edit)
3. Измените Value на: `v=spf1 include:secureserver.net include:_spf.resend.com ~all`
4. Нажмите Save

### Добавление DKIM:
1. Нажмите "Add" в DNS Management
2. Выберите Type: TXT
3. Name: `resend._domainkey`
4. Value: вставьте длинную DKIM строку
5. TTL: 1 Hour
6. Нажмите Save

## ⏱️ Время распространения
- GoDaddy: обычно 1-2 часа
- Может занять до 24 часов

## 🧪 Проверка после изменений
```bash
# Проверьте DNS через 30 минут
node check-dns.js

# Если всё ОК, тестируйте email
node test-resend.js vobvorot.work@gmail.com
```

## 🔧 Альтернативный подход
Если не хотите менять SPF, можете создать поддомен:
1. Добавьте `mail.vobvorot.com` в Resend
2. Используйте `noreply@mail.vobvorot.com`