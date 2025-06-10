# Ручная настройка домена vobvorot.com в Resend

## Шаг 1: Войдите в Resend
1. Откройте https://resend.com/login
2. Войдите в аккаунт с API ключом `re_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH`

## Шаг 2: Добавьте домен
1. Перейдите на https://resend.com/domains
2. Нажмите **"Add Domain"**
3. Введите: `vobvorot.com`
4. Нажмите **"Add"**

## Шаг 3: Получите DNS записи
После добавления домена Resend покажет DNS записи, которые нужно добавить:

### SPF запись
```
Type: TXT
Name: @ (или root/apex)
Value: v=spf1 include:_spf.resend.com ~all
```

### DKIM запись
```
Type: CNAME
Name: resend._domainkey
Value: [будет показан в панели Resend]
```

## Шаг 4: Добавьте DNS записи
Добавьте полученные записи в DNS настройки vobvorot.com:

### Где добавлять:
- **Cloudflare**: DNS → Records
- **GoDaddy**: DNS Management
- **Namecheap**: Advanced DNS
- **Google Domains**: DNS настройки

### Пример для Cloudflare:
1. Войдите в Cloudflare
2. Выберите домен vobvorot.com
3. Перейдите в DNS → Records
4. Добавьте записи:

**SPF запись:**
- Type: TXT
- Name: @
- Content: `v=spf1 include:_spf.resend.com ~all`
- TTL: Auto

**DKIM запись:**
- Type: CNAME
- Name: resend._domainkey
- Target: [значение из Resend панели]
- TTL: Auto

## Шаг 5: Верифицируйте домен
1. Вернитесь в Resend панель
2. Нажмите **"Verify"** рядом с vobvorot.com
3. Дождитесь подтверждения (может занять до 24 часов)

## Шаг 6: Протестируйте
После верификации запустите:
```bash
node test-resend.js vobvorot.work@gmail.com
```

## Быстрый тест API (работает уже сейчас)
```bash
node test-owner-email.js
```

## Проверка статуса
После добавления DNS записей можно проверить их командой:
```bash
# Проверка SPF
dig TXT vobvorot.com

# Проверка DKIM
dig CNAME resend._domainkey.vobvorot.com
```

## Альтернативные решения
Если верификация домена задерживается, можно временно:
1. Использовать поддомен: `mail.vobvorot.com`
2. Настроить SMTP через другой сервис
3. Использовать Resend только для уведомлений админу

---

**📞 Нужна помощь?**
- Resend поддержка: support@resend.com
- Документация: https://resend.com/docs/send-with-nextjs