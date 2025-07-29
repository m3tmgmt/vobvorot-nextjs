# 🛠️ ТЕХНИЧЕСКОЕ РУКОВОДСТВО ПО РЕАЛИЗАЦИИ AI АГЕНТА

## 📁 СТРУКТУРА ПРОЕКТА

```
/src/app/api/telegram/ai-agent/
├── route.ts                        # Main webhook handler
├── config/
│   ├── constants.ts               # Bot token, admin IDs, etc
│   └── gemini.ts                  # Gemini API configuration
├── lib/
│   ├── ai-engine/
│   │   ├── gemini-client.ts      # Gemini API wrapper
│   │   ├── intent-analyzer.ts    # Intent recognition
│   │   └── prompt-builder.ts     # Dynamic prompt generation
│   ├── context/
│   │   ├── context-manager.ts    # Conversation state
│   │   ├── session-store.ts      # Redis/in-memory storage
│   │   └── context-types.ts      # TypeScript interfaces
│   ├── telegram/
│   │   ├── bot-instance.ts       # Grammy bot setup
│   │   ├── message-handler.ts    # Message processing
│   │   └── callback-handler.ts   # Button callbacks
│   └── database/
│       ├── prisma-client.ts      # Prisma instance
│       └── query-builder.ts      # Dynamic queries
├── actions/
│   ├── orders/
│   │   ├── view-orders.ts        # List orders
│   │   ├── update-order.ts       # Update status
│   │   ├── process-refund.ts     # Handle refunds
│   │   └── order-utils.ts        # Helper functions
│   ├── products/
│   │   ├── add-product.ts        # Create product
│   │   ├── update-product.ts     # Edit product
│   │   ├── delete-product.ts     # Remove product
│   │   └── product-search.ts     # Search products
│   ├── customers/
│   │   ├── search-customer.ts    # Find customers
│   │   ├── customer-stats.ts     # Customer analytics
│   │   └── mailing.ts            # Bulk messages
│   ├── categories/
│   │   ├── manage-categories.ts  # CRUD operations
│   │   └── category-utils.ts     # Helpers
│   ├── media/
│   │   ├── cloudinary-upload.ts  # Media upload
│   │   ├── video-manager.ts      # Video operations
│   │   └── image-processor.ts    # Image handling
│   └── stats/
│       ├── generate-stats.ts     # Statistics
│       └── export-reports.ts     # Report generation
├── utils/
│   ├── validators/
│   │   ├── input-validator.ts    # Input sanitization
│   │   ├── permission-check.ts   # Access control
│   │   └── rate-limiter.ts       # Rate limiting
│   ├── formatters/
│   │   ├── message-formatter.ts  # Telegram formatting
│   │   ├── data-formatter.ts     # Data presentation
│   │   └── error-formatter.ts    # Error messages
│   └── helpers/
│       ├── date-utils.ts         # Date operations
│       ├── price-utils.ts        # Price formatting
│       └── string-utils.ts       # String helpers
├── prompts/
│   ├── system-prompt.ts          # Main system prompt
│   ├── examples/
│   │   ├── orders.ts             # Order examples
│   │   ├── products.ts           # Product examples
│   │   └── customers.ts          # Customer examples
│   └── templates/
│       ├── confirmation.ts       # Confirmation messages
│       └── clarification.ts      # Clarification requests
└── types/
    ├── telegram.d.ts             # Telegram types
    ├── gemini.d.ts               # Gemini response types
    └── actions.d.ts              # Action interfaces
```

## 💻 ПОШАГОВАЯ РЕАЛИЗАЦИЯ

### STEP 1: Базовая настройка

#### 1.1 Установка зависимостей
```bash
npm install grammy @google/generative-ai cloudinary ioredis
npm install -D @types/node
```

#### 1.2 Environment переменные (.env)
```env
# Telegram
TELEGRAM_BOT_TOKEN=7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI
TELEGRAM_ADMIN_IDS=316593422,1837334996

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=postgresql://user:pass@host:5432/vobvorot

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### STEP 2: Core модули

#### 2.1 Конфигурация (/config/constants.ts)
```typescript
export const BOT_CONFIG = {
  token: process.env.TELEGRAM_BOT_TOKEN!,
  adminIds: process.env.TELEGRAM_ADMIN_IDS!.split(','),
  webhookDomain: process.env.VERCEL_URL || 'https://vobvorot.com',
  maxMessageLength: 4096,
  sessionTTL: 3600, // 1 hour
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 30, // requests per window
}

export const AI_CONFIG = {
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 2048,
  topK: 1,
  topP: 1,
}

export const INTENTS = {
  // Orders
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER: 'update_order',
  PROCESS_REFUND: 'process_refund',
  
  // Products
  ADD_PRODUCT: 'add_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  SEARCH_PRODUCTS: 'search_products',
  
  // Customers
  SEARCH_CUSTOMER: 'search_customer',
  VIEW_CUSTOMER_STATS: 'view_customer_stats',
  SEND_MAILING: 'send_mailing',
  
  // Categories
  MANAGE_CATEGORIES: 'manage_categories',
  
  // Stats
  VIEW_STATS: 'view_stats',
  EXPORT_REPORT: 'export_report',
  
  // System
  CLARIFICATION_NEEDED: 'clarification_needed',
  HELP: 'help',
  UNKNOWN: 'unknown',
}
```

#### 2.2 Gemini Client (/lib/ai-engine/gemini-client.ts)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from '@/config/constants'
import { systemPrompt } from '@/prompts/system-prompt'
import { getExamples } from '@/prompts/examples'

class GeminiClient {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({
      model: AI_CONFIG.model,
      generationConfig: {
        temperature: AI_CONFIG.temperature,
        topK: AI_CONFIG.topK,
        topP: AI_CONFIG.topP,
        maxOutputTokens: AI_CONFIG.maxTokens,
      },
    })
  }

  async analyzeIntent(
    message: string,
    context?: any
  ): Promise<IntentResult> {
    try {
      const prompt = this.buildPrompt(message, context)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Parse JSON response
      const parsed = JSON.parse(text)
      
      // Validate response
      if (!this.isValidResponse(parsed)) {
        throw new Error('Invalid AI response format')
      }
      
      return parsed
    } catch (error) {
      console.error('Gemini error:', error)
      return {
        action: INTENTS.UNKNOWN,
        entities: {},
        confidence: 0,
        requiresConfirmation: false,
        error: error.message,
      }
    }
  }

  private buildPrompt(message: string, context?: any): string {
    const examples = getExamples(context?.lastAction)
    const contextInfo = context ? this.formatContext(context) : ''
    
    return `${systemPrompt}

${examples}

CONTEXT:
${contextInfo}

USER MESSAGE: "${message}"

RESPONSE (JSON only):
`
  }

  private formatContext(context: any): string {
    return `
Last Action: ${context.lastAction || 'none'}
Last Entity: ${JSON.stringify(context.lastEntity || {})}
Conversation Mode: ${context.mode || 'general'}
History: ${context.history?.slice(-3).join(' -> ') || 'none'}
`
  }

  private isValidResponse(response: any): boolean {
    return (
      response &&
      typeof response.action === 'string' &&
      typeof response.entities === 'object' &&
      typeof response.confidence === 'number' &&
      typeof response.requiresConfirmation === 'boolean'
    )
  }
}

export const geminiClient = new GeminiClient()
```

#### 2.3 Context Manager (/lib/context/context-manager.ts)
```typescript
import { Redis } from 'ioredis'
import { BOT_CONFIG } from '@/config/constants'

interface UserContext {
  userId: string
  lastAction?: string
  lastEntity?: any
  mode?: string
  history: string[]
  tempData?: any
  createdAt: number
  updatedAt: number
}

class ContextManager {
  private redis?: Redis
  private memoryStore: Map<string, UserContext>

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL)
    } else {
      this.memoryStore = new Map()
    }
  }

  async getContext(userId: string): Promise<UserContext | null> {
    try {
      if (this.redis) {
        const data = await this.redis.get(`context:${userId}`)
        return data ? JSON.parse(data) : null
      } else {
        return this.memoryStore.get(userId) || null
      }
    } catch (error) {
      console.error('Context get error:', error)
      return null
    }
  }

  async setContext(userId: string, context: Partial<UserContext>): Promise<void> {
    try {
      const existing = await this.getContext(userId)
      const updated: UserContext = {
        userId,
        history: existing?.history || [],
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
        ...existing,
        ...context,
      }

      // Keep only last 10 history items
      if (updated.history.length > 10) {
        updated.history = updated.history.slice(-10)
      }

      if (this.redis) {
        await this.redis.setex(
          `context:${userId}`,
          BOT_CONFIG.sessionTTL,
          JSON.stringify(updated)
        )
      } else {
        this.memoryStore.set(userId, updated)
      }
    } catch (error) {
      console.error('Context set error:', error)
    }
  }

  async addToHistory(userId: string, action: string): Promise<void> {
    const context = await this.getContext(userId)
    const history = context?.history || []
    history.push(action)
    
    await this.setContext(userId, { history })
  }

  async clearContext(userId: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(`context:${userId}`)
      } else {
        this.memoryStore.delete(userId)
      }
    } catch (error) {
      console.error('Context clear error:', error)
    }
  }
}

export const contextManager = new ContextManager()
```

### STEP 3: Action Handlers

#### 3.1 View Orders (/actions/orders/view-orders.ts)
```typescript
import { Context } from 'grammy'
import { getPrismaClient } from '@/lib/database/prisma-client'
import { formatOrder } from '@/utils/formatters/data-formatter'
import { parseTimeFilter } from '@/utils/helpers/date-utils'

export async function viewOrders(
  ctx: Context,
  entities: any
): Promise<void> {
  const prisma = getPrismaClient()
  
  try {
    // Build query
    const where: any = {}
    
    // Time filter
    if (entities.filter) {
      const dateRange = parseTimeFilter(entities.filter)
      if (dateRange) {
        where.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      }
    }
    
    // Status filter
    if (entities.status) {
      where.status = entities.status
    }
    
    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: entities.limit || 10,
    })
    
    // Format response
    if (orders.length === 0) {
      await ctx.reply('📦 Заказов не найдено по указанным критериям')
      return
    }
    
    // Send each order as separate message
    for (const order of orders) {
      const message = formatOrder(order)
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 Изменить статус', callback_data: `order_status_${order.id}` },
              { text: '💳 Возврат', callback_data: `order_refund_${order.id}` },
            ],
            [
              { text: '📋 Детали', callback_data: `order_details_${order.id}` },
              { text: '📨 Трек-номер', callback_data: `order_track_${order.id}` },
            ],
          ],
        },
      })
    }
    
    // Summary
    await ctx.reply(
      `📊 Показано заказов: ${orders.length}\\n` +
      `Используйте кнопки для управления заказами`,
      { parse_mode: 'Markdown' }
    )
    
  } catch (error) {
    console.error('View orders error:', error)
    await ctx.reply('❌ Ошибка при загрузке заказов. Попробуйте позже.')
  }
}
```

#### 3.2 Add Product (/actions/products/add-product.ts)
```typescript
import { Context } from 'grammy'
import { getPrismaClient } from '@/lib/database/prisma-client'
import { contextManager } from '@/lib/context/context-manager'

interface ProductData {
  name: string
  price: number
  description?: string
  category?: string
  stock?: number
  brand?: string
}

export async function addProduct(
  ctx: Context,
  entities: ProductData
): Promise<void> {
  const prisma = getPrismaClient()
  const userId = ctx.from?.id.toString()
  
  try {
    // Validate required fields
    if (!entities.name || !entities.price) {
      await ctx.reply(
        '❌ Не хватает данных для создания товара\\n\\n' +
        'Минимально необходимо:\\n' +
        '• Название товара\\n' +
        '• Цена\\n\\n' +
        'Пример: "Добавь товар Платье синее за 2500"',
        { parse_mode: 'Markdown' }
      )
      return
    }
    
    // Find or create category
    let categoryId = 1 // Default category
    if (entities.category) {
      const category = await prisma.category.findFirst({
        where: {
          name: {
            contains: entities.category,
            mode: 'insensitive',
          },
        },
      })
      
      if (category) {
        categoryId = category.id
      }
    }
    
    // Create product
    const product = await prisma.product.create({
      data: {
        name: entities.name,
        description: entities.description || '',
        price: entities.price,
        stock: entities.stock || 1,
        brandName: entities.brand || 'VOBVOROT',
        categoryId,
        status: 'active',
      },
    })
    
    // Save to context for potential image upload
    await contextManager.setContext(userId!, {
      lastAction: 'add_product',
      lastEntity: { type: 'product', id: product.id },
      tempData: { productId: product.id },
    })
    
    // Send confirmation
    await ctx.reply(
      `✅ *Товар успешно создан!*\\n\\n` +
      `📦 *${product.name}*\\n` +
      `💰 Цена: ${product.price} руб.\\n` +
      `📊 На складе: ${product.stock} шт.\\n` +
      `🆔 ID: ${product.id}\\n\\n` +
      `📸 Отправьте фото товара следующим сообщением или введите новую команду`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✏️ Редактировать', callback_data: `edit_product_${product.id}` },
              { text: '📸 Пропустить фото', callback_data: 'skip_photo' },
            ],
          ],
        },
      }
    )
    
  } catch (error) {
    console.error('Add product error:', error)
    await ctx.reply('❌ Ошибка при создании товара. Попробуйте позже.')
  }
}
```

### STEP 4: Main Route Handler

#### 4.1 Webhook Route (/route.ts)
```typescript
import { Bot, webhookCallback } from 'grammy'
import { NextRequest, NextResponse } from 'next/server'
import { BOT_CONFIG, INTENTS } from './config/constants'
import { geminiClient } from './lib/ai-engine/gemini-client'
import { contextManager } from './lib/context/context-manager'
import { handleAction } from './lib/action-dispatcher'
import { isAdmin } from './utils/validators/permission-check'
import { rateLimiter } from './utils/validators/rate-limiter'

// Create bot instance
async function createBot() {
  const bot = new Bot(BOT_CONFIG.token)
  await bot.init()
  
  // Middleware
  bot.use(async (ctx, next) => {
    // Admin check
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) {
      await ctx.reply('⛔ У вас нет доступа к этому боту')
      return
    }
    
    // Rate limiting
    const limited = await rateLimiter.check(ctx.from.id.toString())
    if (limited) {
      await ctx.reply('⏳ Слишком много запросов. Подождите минуту.')
      return
    }
    
    await next()
  })
  
  // Command handlers
  bot.command('start', async (ctx) => {
    await ctx.reply(
      `👋 *Привет! Я AI ассистент VOBVOROT*\\n\\n` +
      `Я понимаю естественный язык. Просто напишите, что нужно сделать:\\n\\n` +
      `📦 "Покажи заказы за сегодня"\\n` +
      `🛍 "Добавь товар Платье за 3000"\\n` +
      `👥 "Найди клиента Мария"\\n` +
      `📊 "Статистика за неделю"\\n` +
      `💳 "Оформи возврат для заказа 123"\\n\\n` +
      `Для справки используйте /help`,
      { parse_mode: 'Markdown' }
    )
  })
  
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📚 *Справка по командам*\\n\\n` +
      `*Заказы:*\\n` +
      `• Покажи заказы (за сегодня/вчера/неделю)\\n` +
      `• Измени статус заказа X на отправлен\\n` +
      `• Оформи возврат для заказа X\\n\\n` +
      `*Товары:*\\n` +
      `• Добавь товар [название] за [цена]\\n` +
      `• Измени цену товара X на Y\\n` +
      `• Покажи все товары\\n\\n` +
      `*Клиенты:*\\n` +
      `• Найди клиента [email/телефон/имя]\\n` +
      `• Покажи топ клиентов\\n\\n` +
      `*Другое:*\\n` +
      `• Статистика за [период]\\n` +
      `• Создай категорию [название]`,
      { parse_mode: 'Markdown' }
    )
  })
  
  // Message handler
  bot.on('message:text', async (ctx) => {
    const userId = ctx.from!.id.toString()
    const message = ctx.message.text
    
    // Show typing indicator
    const typing = ctx.replyWithChatAction('typing')
    
    try {
      // Get user context
      const context = await contextManager.getContext(userId)
      
      // Analyze intent with AI
      const intent = await geminiClient.analyzeIntent(message, context)
      
      // Handle clarification
      if (intent.action === INTENTS.CLARIFICATION_NEEDED) {
        await ctx.reply(
          `❓ ${intent.clarificationNeeded}`,
          { parse_mode: 'Markdown' }
        )
        return
      }
      
      // Handle unknown intent
      if (intent.action === INTENTS.UNKNOWN || intent.confidence < 0.5) {
        await ctx.reply(
          '🤔 Не понял команду. Попробуйте переформулировать или используйте /help'
        )
        return
      }
      
      // Update context
      await contextManager.setContext(userId, {
        lastAction: intent.action,
        lastEntity: intent.entities,
      })
      await contextManager.addToHistory(userId, intent.action)
      
      // Execute action
      await handleAction(ctx, intent)
      
    } catch (error) {
      console.error('Message handling error:', error)
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
    } finally {
      // Cancel typing indicator
      typing.then(t => t.delete().catch(() => {}))
    }
  })
  
  // Photo handler
  bot.on('message:photo', async (ctx) => {
    const userId = ctx.from!.id.toString()
    const context = await contextManager.getContext(userId)
    
    // Check if we're expecting a photo
    if (context?.lastAction === 'add_product' && context.tempData?.productId) {
      // Handle photo upload for product
      await handleProductPhoto(ctx, context.tempData.productId)
    } else {
      await ctx.reply('📸 Для загрузки фото сначала создайте или выберите товар')
    }
  })
  
  // Callback query handler
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data
    
    // Route callbacks
    if (data.startsWith('order_')) {
      await handleOrderCallback(ctx, data)
    } else if (data.startsWith('product_')) {
      await handleProductCallback(ctx, data)
    } else if (data.startsWith('confirm_')) {
      await handleConfirmation(ctx, data)
    }
    
    await ctx.answerCallbackQuery()
  })
  
  return bot
}

// Webhook handler
export async function POST(req: NextRequest) {
  try {
    const bot = await createBot()
    const handleUpdate = webhookCallback(bot, 'std/http')
    
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## 🚀 DEPLOYMENT CHECKLIST

### ✅ Pre-deployment
- [ ] Получить Gemini API ключ
- [ ] Настроить environment переменные
- [ ] Проверить database connection
- [ ] Настроить Cloudinary
- [ ] Добавить endpoint в middleware.ts

### ✅ Testing
- [ ] Unit тесты для intent analyzer
- [ ] Integration тесты для actions
- [ ] E2E тесты с реальным ботом
- [ ] Load testing (60 req/min)

### ✅ Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Usage analytics
- [ ] Cost tracking (Gemini API)

### ✅ Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Admin manual
- [ ] Troubleshooting guide

## 📈 ОПТИМИЗАЦИИ

### Производительность
1. **Response caching** - кешировать частые запросы
2. **Batch operations** - группировать DB запросы
3. **Lazy loading** - загружать данные по требованию
4. **Query optimization** - индексы и оптимизация запросов

### Масштабируемость
1. **Horizontal scaling** - multiple instances
2. **Queue system** - для тяжелых операций
3. **CDN для медиа** - Cloudinary optimization
4. **Database pooling** - connection management

### User Experience
1. **Quick replies** - предлагать частые команды
2. **Auto-complete** - подсказки при вводе
3. **Progress indicators** - для долгих операций
4. **Error recovery** - восстановление после ошибок