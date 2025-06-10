# Получение API ключей GoDaddy

## 1. Войдите в GoDaddy Developer Portal
Откройте: https://developer.godaddy.com/keys

## 2. Создайте Production API Key
1. Нажмите "Create New API Key"
2. Выберите "Production" (не Testing)
3. Назовите ключ: "Resend DNS Automation"
4. Нажмите "Next"

## 3. Скопируйте ключи
Вы получите:
- **API Key** (например: `dUQzPlPv_46pxT6xmN1Dka3...`)
- **API Secret** (например: `46pxT6xmN1DkaBc7_GDC8`)

⚠️ **Важно**: Сохраните их сейчас - секрет больше не покажут!

## 4. Добавьте ключи в окружение
```bash
# В .env.local добавьте:
GODADDY_API_KEY=your_api_key_here
GODADDY_SECRET=your_secret_here
```

## 5. После получения ключей
Запустите автоматизацию:
```bash
node godaddy-dns-automation.js
```