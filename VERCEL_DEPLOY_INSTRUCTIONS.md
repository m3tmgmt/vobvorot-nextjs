# ИНСТРУКЦИИ ДЛЯ ДЕПЛОЯ НА VERCEL

## КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ПРИМЕНЕНО!

✅ **Исправление готово к деплою**
- Файл `src/app/products/[slug]/page.tsx` заменён на исправленную версию
- Коммит создан: `9f07ac5`
- Build протестирован и работает

## СПОСОБЫ ДЕПЛОЯ:

### Вариант 1: Автоматический деплой через Git (Рекомендуется)
1. Перейти в GitHub репозиторий `m3tmgmt/vobvorot-nextjs`
2. Загрузить изменения любым способом (web interface, git push)
3. Vercel автоматически развернёт изменения

### Вариант 2: Прямой деплой через Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### Вариант 3: Ручной деплой через Vercel Dashboard
1. Перейти на https://vercel.com/dashboard
2. Найти проект `vobvorot-nextjs`
3. Нажать "Redeploy" или "Import Git Repository"

### Вариант 4: Zip-файл для ручной загрузки
```bash
# Создать архив проекта
tar -czf vobvorot-nextjs-fixed.tar.gz --exclude=node_modules --exclude=.git --exclude=.next .
```

## ПРОВЕРКА ПОСЛЕ ДЕПЛОЯ:

1. **Товар API**: https://vobvorot.com/api/test-product?slug=1111-1749750637988
2. **Страница товара**: https://vobvorot.com/products/1111-1749750637988
3. **Список товаров**: https://vobvorot.com/products

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
✅ Товары будут отображаться на сайте
✅ Ссылки из бота будут работать
✅ Страницы товаров загрузятся без ошибок

## ВРЕМЯ ДЕПЛОЯ:
Обычно 2-5 минут после загрузки в Git