# Пошаговая миграция DNS на Cloudflare

## 📋 Весь процесс занимает 15 минут

### Шаг 1: Создаем Cloudflare аккаунт (3 минуты)
```
1. Открываем https://cloudflare.com/
2. Sign Up → вводим email/пароль
3. Подтверждаем email
```

### Шаг 2: Добавляем домен в Cloudflare (5 минут) 
```
1. Dashboard → "Add a Site"
2. Вводим: vobvorot.com
3. Выбираем FREE план (0$)
4. Cloudflare сканирует существующие DNS записи
5. Подтверждаем импорт записей
```

### Шаг 3: Получаем новые nameservers (1 минута)
```
Cloudflare покажет что-то вроде:
- alice.ns.cloudflare.com
- bob.ns.cloudflare.com

⚠️ ВАЖНО: запишите эти адреса!
```

### Шаг 4: Обновляем nameservers в GoDaddy (3 минуты)
```
1. Идем в https://dcc.godaddy.com/manage/dns
2. Находим раздел "Nameservers" 
3. Меняем с:
   - ns13.domaincontrol.com
   - ns14.domaincontrol.com
   
   На новые от Cloudflare:
   - alice.ns.cloudflare.com  
   - bob.ns.cloudflare.com
4. Сохраняем
```

### Шаг 5: Получаем API токен (2 минуты)
```
1. Cloudflare Dashboard → My Profile (справа вверху)
2. API Tokens → Create Token
3. Custom token:
   - Permissions: Zone:Edit, DNS:Edit
   - Zone Resources: All zones
4. Копируем токен
```

### Шаг 6: Добавляем токен в проект (1 минута)
```
Добавляем в .env.local:
CLOUDFLARE_API_TOKEN=ваш_токен_здесь
```

## 🎯 Результат:
- ✅ Домен остается ваш
- ✅ Работает точно так же для пользователей  
- ✅ Я получаю полный API доступ
- ✅ Автоматическая настройка DNS
- ✅ Лучшая производительность
- ✅ Дополнительная безопасность

## ⚠️ Что НЕ изменится:
- Домен остается зарегистрирован в GoDaddy
- Сайт работает как прежде
- Email работает как прежде
- Никто не заметит изменений

## 🚀 Что получаем:
- Полная автономия для настройки DNS
- Автоматическое управление записями
- Лучшая производительность сайта
- Бесплатные продвинутые функции