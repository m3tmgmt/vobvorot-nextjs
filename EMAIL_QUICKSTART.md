# Email Service - Быстрый старт

## 1. Настройка переменных окружения

Скопируйте `.env.example` в `.env.local` и заполните email настройки:

```bash
cp .env.example .env.local
```

Отредактируйте `.env.local`:

```env
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=store@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

## 2. Получение Resend API ключа

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Добавьте ваш домен в панели управления
3. Создайте API ключ
4. Скопируйте ключ в `RESEND_API_KEY`

## 3. Тестирование

### Через браузер (рекомендуется для первого раза)

1. Запустите проект: `npm run dev`
2. Перейдите на `http://localhost:3000/admin/email-test`
3. Войдите как администратор
4. Выберите тип письма и укажите ваш email
5. Нажмите "Send Test Email"

### Через API

```bash
# Запустите сервер
npm run dev

# В другом терминале
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "email": "your-email@example.com"}'
```

### Через скрипт

```bash
node scripts/test-email.js test your-email@example.com
```

## 4. Проверка интеграции

После настройки email будут автоматически отправляться:

- ✅ При создании заказа (подтверждение клиенту + уведомление админу)
- ✅ При изменении статуса заказа
- ✅ При тестировании через админ панель

## 5. Устранение проблем

### Email не отправляются

1. Проверьте переменные окружения в `.env.local`
2. Убедитесь что домен подтвержден в Resend
3. Проверьте консоль браузера/сервера на ошибки
4. Попробуйте простой тест: `/admin/email-test`

### 401 Unauthorized

- Войдите в систему как администратор
- Проверьте что у пользователя роль ADMIN в базе данных

### 500 Server Error

- Проверьте логи сервера
- Убедитесь что все переменные окружения установлены
- Проверьте правильность API ключа Resend

## 6. Следующие шаги

После успешного тестирования:

1. Настройте production домен в Resend
2. Обновите переменные для production
3. Кастомизируйте email шаблоны в `/src/lib/email.ts`
4. Настройте мониторинг отправки писем

## Готово! 🎉

Email сервис настроен и готов к использованию.