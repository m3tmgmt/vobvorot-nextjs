# DNS записи для vobvorot.com

## 📋 Записи которые нужно добавить

### 1. SPF запись (для основного домена)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: Auto
```

### 2. DKIM запись
```
Type: TXT  
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB
TTL: Auto
```

### 3. DMARC запись (рекомендуется)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
TTL: Auto
```

## 🔧 Где добавлять записи

### Если домен на Cloudflare:
1. Войдите в Cloudflare
2. Выберите vobvorot.com
3. DNS → Records
4. Add record для каждой записи

### Если домен на другом провайдере:
- **GoDaddy**: DNS Management
- **Namecheap**: Advanced DNS  
- **Google Domains**: DNS

## ⚠️ Важно
- Используйте `@` для основного домена (не `send`)
- DKIM запись: тип `TXT`, не `CNAME`
- Дождитесь распространения DNS (до 24 часов)

## 🧪 После добавления записей
Запустите проверку:
```bash
node test-resend.js vobvorot.work@gmail.com
```