# 🌐 Настройка домена vobvorot.com

## ✅ Домен добавлен в Vercel
Домен `vobvorot.com` успешно добавлен к проекту VobVorot Store на Vercel.

## 🔧 Требуется: DNS настройка

### 📍 Ваши текущие настройки:
- **Регистратор**: Third Party (сторонний)
- **DNS провайдер**: Cloudflare
- **Nameservers**: april.ns.cloudflare.com, john.ns.cloudflare.com

### 🎯 Два способа настройки:

## 🚀 Способ 1: A Record (РЕКОМЕНДУЕТСЯ)

### В панели Cloudflare:
1. Зайти в [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Выбрать домен `vobvorot.com`
3. Перейти в раздел **DNS > Records**
4. Добавить/изменить A record:

```
Type: A
Name: @ (или vobvorot.com)
Content: 76.76.21.21
Proxy status: 🟡 Proxied (рекомендуется)
TTL: Auto
```

5. Если есть существующие A records для @ - удалить их
6. Сохранить изменения

### ⏱️ Время активации: 5-10 минут

---

## 🔄 Способ 2: Nameservers (альтернативный)

### Изменить nameservers на:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**⚠️ Внимание**: Это отключит Cloudflare CDN и защиту

---

## 🧪 Проверка настройки

После настройки DNS можно проверить:

### Командой:
```bash
npx vercel domains inspect vobvorot.com
```

### Или онлайн:
- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://whatsmydns.net)

## 📧 Уведомления
Vercel отправит email когда домен будет настроен правильно.

---

## 🎯 После настройки DNS

Домен автоматически получит:
- ✅ SSL сертификат (HTTPS)
- ✅ CDN ускорение
- ✅ Автоматическое перенаправление www → без www
- ✅ HTTP → HTTPS редирект

### 🌐 Результат:
- **https://vobvorot.com** - основной домен
- **https://www.vobvorot.com** - авторедирект

---

## ❓ Нужна помощь?

**Текущий рабочий URL**: https://vobvorot-nextjs-9k4ylkr3g-m3tmgmt-gmailcoms-projects.vercel.app

**DNS настройки для Cloudflare**:
```
A record: @ → 76.76.21.21
```

**Cloudflare настройки**: Proxy включен (🟡 оранжевое облако)

---

*Инструкции созданы автоматически для vobvorot.com*