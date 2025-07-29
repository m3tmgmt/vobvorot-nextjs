# 🚀 БЫСТРЫЙ СТАРТ: AI АГЕНТ ЗА 1 ДЕНЬ

## 📌 ШАГ 1: Получение Gemini API ключа (5 минут)

### 1. Перейдите на [Google AI Studio](https://makersuite.google.com/app/apikey)
### 2. Нажмите "Create API Key"
### 3. Выберите проект или создайте новый
### 4. Скопируйте ключ

**Лимиты бесплатного плана:**
- 60 запросов в минуту
- 1,500 запросов в день
- Полностью бесплатно!

---

## 📌 ШАГ 2: Минимальная рабочая версия (30 минут)

### 1. Создайте файл структуры:
```bash
mkdir -p src/app/api/telegram/ai-assistant
cd src/app/api/telegram/ai-assistant
```

### 2. Основной файл (route.ts):
```typescript
import { Bot, webhookCallback } from 'grammy'
import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getPrismaClient } from '@/lib/prisma'

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// System prompt
const SYSTEM_PROMPT = `Ты AI ассистент магазина VOBVOROT. Анализируй сообщения и возвращай JSON:
{
  "action": "view_orders|add_product|search_customer|stats|unknown",
  "params": { "filter": "today", "name": "...", "price": 123 },
  "needConfirm": true/false
}

Примеры:
"покажи заказы" → {"action":"view_orders","params":{},"needConfirm":false}
"заказы за сегодня" → {"action":"view_orders","params":{"filter":"today"},"needConfirm":false}
"добавь платье за 2000" → {"action":"add_product","params":{"name":"платье","price":2000},"needConfirm":false}
"найди марию" → {"action":"search_customer","params":{"query":"мария"},"needConfirm":false}`

async function createBot() {
  const bot = new Bot(BOT_TOKEN)
  await bot.init()
  const prisma = getPrismaClient()

  // Check admin
  function isAdmin(userId: string): boolean {
    return ADMIN_IDS.includes(userId)
  }

  // AI analysis
  async function analyzeMessage(text: string) {
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nСообщение: "${text}"\n\nJSON:`
      const result = await model.generateContent(prompt)
      const response = await result.response
      return JSON.parse(response.text())
    } catch (error) {
      console.error('AI error:', error)
      return { action: 'unknown', params: {}, needConfirm: false }
    }
  }

  // Start command
  bot.command('start', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) {
      await ctx.reply('⛔ Нет доступа')
      return
    }

    await ctx.reply(
      '👋 *AI Ассистент VOBVOROT*\\n\\n' +
      'Просто пишите, что нужно:\\n' +
      '• Покажи заказы за сегодня\\n' +
      '• Добавь товар Платье 2500\\n' +
      '• Найди клиента Мария\\n' +
      '• Статистика за неделю',
      { parse_mode: 'Markdown' }
    )
  })

  // Message handler
  bot.on('message:text', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) return

    const typing = ctx.replyWithChatAction('typing')
    
    try {
      const result = await analyzeMessage(ctx.message.text)
      
      switch (result.action) {
        case 'view_orders':
          await handleViewOrders(ctx, result.params, prisma)
          break
        case 'add_product':
          await handleAddProduct(ctx, result.params, prisma)
          break
        case 'search_customer':
          await handleSearchCustomer(ctx, result.params, prisma)
          break
        case 'stats':
          await handleStats(ctx, result.params, prisma)
          break
        default:
          await ctx.reply('🤔 Не понял. Попробуйте иначе.')
      }
    } catch (error) {
      await ctx.reply('❌ Ошибка. Попробуйте позже.')
    } finally {
      typing.then(t => t.delete().catch(() => {}))
    }
  })

  return bot
}

// Action handlers
async function handleViewOrders(ctx: any, params: any, prisma: any) {
  const where: any = {}
  
  if (params.filter === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    where.createdAt = { gte: today }
  }

  const orders = await prisma.order.findMany({
    where,
    include: { customer: true, orderItems: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  if (orders.length === 0) {
    await ctx.reply('📦 Заказов не найдено')
    return
  }

  for (const order of orders) {
    await ctx.reply(
      `🛍 *Заказ #${order.orderNumber}*\\n` +
      `👤 ${order.customer.name}\\n` +
      `💰 $${order.totalAmount}\\n` +
      `📦 ${order.status}\\n` +
      `🕐 ${order.createdAt.toLocaleString('ru')}`,
      { parse_mode: 'Markdown' }
    )
  }
}

async function handleAddProduct(ctx: any, params: any, prisma: any) {
  if (!params.name || !params.price) {
    await ctx.reply('❌ Укажите название и цену товара')
    return
  }

  const product = await prisma.product.create({
    data: {
      name: params.name,
      price: params.price,
      description: '',
      stock: 1,
      brandName: 'VOBVOROT',
      categoryId: 1,
      status: 'active'
    }
  })

  await ctx.reply(
    `✅ Товар создан!\\n\\n` +
    `📦 ${product.name}\\n` +
    `💰 ${product.price} руб.\\n` +
    `🆔 ID: ${product.id}`,
    { parse_mode: 'Markdown' }
  )
}

async function handleSearchCustomer(ctx: any, params: any, prisma: any) {
  if (!params.query) {
    await ctx.reply('❌ Укажите имя, email или телефон')
    return
  }

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: params.query, mode: 'insensitive' } },
        { email: { contains: params.query, mode: 'insensitive' } },
        { phone: { contains: params.query } }
      ]
    },
    include: { orders: true },
    take: 3
  })

  if (customers.length === 0) {
    await ctx.reply('👤 Клиент не найден')
    return
  }

  for (const customer of customers) {
    await ctx.reply(
      `👤 *${customer.name}*\\n` +
      `📧 ${customer.email}\\n` +
      `📱 ${customer.phone || 'нет'}\\n` +
      `🛍 Заказов: ${customer.orders.length}\\n` +
      `💰 Сумма: $${customer.orders.reduce((sum, o) => sum + o.totalAmount, 0)}`,
      { parse_mode: 'Markdown' }
    )
  }
}

async function handleStats(ctx: any, params: any, prisma: any) {
  const stats = await prisma.$transaction([
    prisma.order.count(),
    prisma.order.count({ 
      where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } 
    }),
    prisma.product.count({ where: { status: 'active' } }),
    prisma.customer.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } })
  ])

  await ctx.reply(
    `📊 *Статистика магазина*\\n\\n` +
    `📦 Всего заказов: ${stats[0]}\\n` +
    `📅 Сегодня: ${stats[1]}\\n` +
    `🛍 Товаров: ${stats[2]}\\n` +
    `👥 Клиентов: ${stats[3]}\\n` +
    `💰 Общая сумма: $${stats[4]._sum.totalAmount || 0}`,
    { parse_mode: 'Markdown' }
  )
}

// Webhook handler
export async function POST(req: NextRequest) {
  try {
    const bot = await createBot()
    const handleUpdate = webhookCallback(bot, 'std/http')
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}
```

### 3. Добавьте в .env:
```env
GEMINI_API_KEY=ваш_ключ_от_google_ai_studio
```

### 4. Обновите middleware.ts:
```typescript
// Добавьте в список исключений
'/api/telegram/ai-assistant'
```

### 5. Установите зависимости:
```bash
npm install @google/generative-ai
```

### 6. Деплой:
```bash
npx vercel --prod --token yGHkW9HSoepeo4Q8ZnSBEKwn
```

### 7. Установите webhook:
```bash
curl -X POST https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://vobvorot.com/api/telegram/ai-assistant"}'
```

---

## 📌 ШАГ 3: Проверка работы

1. Откройте бот @VobvorotAdminBot
2. Отправьте /start
3. Попробуйте команды:
   - "Покажи заказы"
   - "Заказы за сегодня"
   - "Добавь товар Платье синее 2500"
   - "Найди клиента Мария"
   - "Статистика"

---

## 📌 РАСШИРЕНИЕ ФУНКЦИОНАЛА

### Добавление новых действий:

1. Добавьте в SYSTEM_PROMPT новый action
2. Добавьте примеры
3. Создайте handler функцию
4. Добавьте case в switch

### Пример - добавление категорий:
```typescript
// В SYSTEM_PROMPT добавить:
"создай категорию одежда" → {"action":"create_category","params":{"name":"одежда"},"needConfirm":false}

// Новый handler:
async function handleCreateCategory(ctx: any, params: any, prisma: any) {
  if (!params.name) {
    await ctx.reply('❌ Укажите название категории')
    return
  }

  const category = await prisma.category.create({
    data: {
      name: params.name,
      emoji: '📦',
      order: 999
    }
  })

  await ctx.reply(`✅ Категория "${category.name}" создана!`)
}

// В switch добавить:
case 'create_category':
  await handleCreateCategory(ctx, result.params, prisma)
  break
```

---

## 🎯 ИТОГ

### ✅ Что получаем за 1 день:
- Полностью рабочий AI бот
- Основные функции CRM
- Естественный язык
- Бесплатный хостинг и AI

### 📈 Дальнейшее развитие:
1. Добавить больше actions
2. Улучшить промпты
3. Добавить контекст диалога
4. Интегрировать медиа загрузку
5. Добавить подтверждения для критичных операций

### 💡 Советы:
- Начните с базовых функций
- Тестируйте каждое добавление
- Логируйте AI ответы для отладки
- Следите за лимитами Gemini API

---

**🚀 Готово к запуску!**