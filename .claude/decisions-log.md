# Журнал Технических Решений - VobVorot Project

## 🎯 КРИТИЧЕСКИЕ РЕШЕНИЯ АРХИТЕКТУРЫ

### WesternBid Integration Strategy
**Дата:** $(date)  
**Решение:** Form-based интеграция вместо прямого API  
**Обоснование:** Документация WesternBid требует form POST метод  
**Файлы:** `src/lib/westernbid.ts`, `src/app/api/payment/westernbid/redirect/route.ts`  
**Статус:** ✅ Реализовано и задеплоено

### Payment Method Architecture  
**Решение:** Единый PaymentMethodSelector компонент  
**Обоснование:** Централизованная логика выбора + расчет комиссий  
**Поддерживаемые методы:** Stripe, PayPal, WesternBid  
**Файл:** `src/components/PaymentMethodSelector.tsx`  
**Статус:** ✅ Завершено

### Webhook Processing Strategy
**Решение:** Dual support для JSON и form-encoded данных  
**Обоснование:** WesternBid отправляет form data, другие системы - JSON  
**Файл:** `src/app/api/webhooks/westernbid/route.ts`  
**Статус:** ✅ Протестировано

---

## 🔧 КОНФИГУРАЦИЯ ОКРУЖЕНИЯ

### Production WesternBid Credentials
```
WESTERNBID_MERCHANT_ID=159008
WESTERNBID_SECRET_KEY=oVsVCgu  
WESTERNBID_API_URL=https://shop.westernbid.info
WESTERNBID_ENVIRONMENT=production
```

### Key Environment Variables
- `NEXT_PUBLIC_SITE_URL` - для return/cancel URLs
- `WESTERNBID_WEBHOOK_SECRET` - для верификации подписей
- `DATABASE_URL` - PostgreSQL connection

---

## 📚 ВАЖНЫЕ PATTERNS

### Error Handling Pattern
```typescript
// Используется везде для consistent error handling
try {
  // operation
} catch (error) {
  logger.error('Operation failed', error)
  return { success: false, error: error.message }
}
```

### Signature Verification Pattern  
```typescript
// WesternBid MD5 signature для form data
const signature = createHash('md5').update(queryString + secretKey).digest('hex')
```

### Auto-redirect Pattern
```typescript
// Auto-submit form после 2 секунд
setTimeout(() => document.getElementById('form').submit(), 2000)
```

---

*Сохраняется для исторического контекста и быстрого восстановления решений*