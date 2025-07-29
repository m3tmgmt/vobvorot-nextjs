import { Bot } from 'grammy'
import { webhookCallback } from 'grammy'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_IDS = ['316593422', '1837334996']

// Простой анализатор команд без AI
function parseCommand(text: string) {
  const lower = text.toLowerCase()
  
  // Заказы
  if (lower.includes('заказ') || lower.includes('order')) {
    if (lower.includes('сегодня') || lower.includes('today')) {
      return { action: 'view_orders', filter: 'today' }
    }
    if (lower.includes('вчера') || lower.includes('yesterday')) {
      return { action: 'view_orders', filter: 'yesterday' }
    }
    return { action: 'view_orders', filter: 'all' }
  }
  
  // Товары
  if (lower.includes('добав') && lower.includes('товар')) {
    // Извлекаем название и цену
    const priceMatch = text.match(/(\d+)/g)
    const price = priceMatch ? parseInt(priceMatch[priceMatch.length - 1]) : 0
    const name = text.replace(/добав\w*\s+товар\s*/i, '').replace(/\d+/g, '').trim()
    
    return { action: 'add_product', name, price }
  }
  
  // Возврат
  if (lower.includes('возврат') || lower.includes('refund')) {
    const numberMatch = text.match(/\d+/)
    return { action: 'refund', orderId: numberMatch ? numberMatch[0] : null }
  }
  
  // Статистика
  if (lower.includes('статистик') || lower.includes('stats')) {
    return { action: 'stats' }
  }
  
  // Помощь
  return { action: 'help' }
}

async function createBot() {
  const bot = new Bot(BOT_TOKEN)
  await bot.init()
  // prisma уже импортирован глобально

  // Проверка админа
  function isAdmin(userId: string): boolean {
    return ADMIN_IDS.includes(userId)
  }

  // Команда старт
  bot.command('start', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) {
      await ctx.reply('⛔ У вас нет доступа к этому боту')
      return
    }

    await ctx.reply(
      '👋 *Умный ассистент VOBVOROT*\\n\\n' +
      'Просто пишите, что нужно сделать:\\n\\n' +
      '📦 "Покажи заказы за сегодня"\\n' +
      '🛍 "Добавь товар Платье красное 2500"\\n' +
      '💳 "Оформи возврат для заказа 123"\\n' +
      '📊 "Покажи статистику"\\n\\n' +
      '_Бот понимает естественный язык!_',
      { parse_mode: 'Markdown' }
    )
  })

  // Обработчик текста
  bot.on('message:text', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id.toString())) {
      await ctx.reply('⛔ У вас нет доступа')
      return
    }

    const command = parseCommand(ctx.message.text)
    
    try {
      switch (command.action) {
        case 'view_orders':
          let whereClause = {}
          const now = new Date()
          
          if (command.filter === 'today') {
            const startOfDay = new Date(now)
            startOfDay.setHours(0, 0, 0, 0)
            whereClause = {
              createdAt: { gte: startOfDay }
            }
          } else if (command.filter === 'yesterday') {
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            yesterday.setHours(0, 0, 0, 0)
            const endOfYesterday = new Date(yesterday)
            endOfYesterday.setHours(23, 59, 59, 999)
            
            whereClause = {
              createdAt: {
                gte: yesterday,
                lte: endOfYesterday
              }
            }
          }
          
          const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
              orderItems: { include: { product: true } },
              customer: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          })
          
          if (orders.length === 0) {
            await ctx.reply('📦 Заказов не найдено')
            return
          }
          
          let message = `📦 *Найдено заказов: ${orders.length}*\\n\\n`
          
          for (const order of orders) {
            const items = order.orderItems.slice(0, 3).map(item => 
              `  • ${item.product.name}`
            ).join('\\n')
            
            message += `🛍 *Заказ #${order.orderNumber}*\\n`
            message += `👤 ${order.customer.name}\\n`
            message += `💰 $${order.totalAmount} | 📦 ${order.status}\\n`
            if (order.orderItems.length > 0) {
              message += `Товары:\\n${items}\\n`
              if (order.orderItems.length > 3) {
                message += `  _...и еще ${order.orderItems.length - 3}_\\n`
              }
            }
            message += '\\n'
          }
          
          await ctx.reply(message, { parse_mode: 'Markdown' })
          break

        case 'add_product':
          if (!command.name || !command.price) {
            await ctx.reply(
              '❌ Не могу разобрать команду\\n\\n' +
              'Попробуйте так:\\n' +
              '"Добавь товар Платье красное 2500"'
            )
            return
          }
          
          const product = await prisma.product.create({
            data: {
              name: command.name,
              description: '',
              price: command.price,
              stock: 1,
              brandName: 'VOBVOROT',
              categoryId: 1,
              status: 'active'
            }
          })
          
          await ctx.reply(
            `✅ *Товар добавлен!*\\n\\n` +
            `📦 ${product.name}\\n` +
            `💰 Цена: $${product.price}\\n` +
            `🆔 ID: ${product.id}\\n\\n` +
            `_Отправьте фото товара ответом на это сообщение_`,
            { parse_mode: 'Markdown' }
          )
          break

        case 'refund':
          if (!command.orderId) {
            await ctx.reply('❌ Укажите номер заказа. Например: "Возврат для заказа 123"')
            return
          }
          
          const order = await prisma.order.findFirst({
            where: { orderNumber: command.orderId },
            include: { customer: true }
          })
          
          if (!order) {
            await ctx.reply(`❌ Заказ #${command.orderId} не найден`)
            return
          }
          
          await ctx.reply(
            `💳 *Подтверждение возврата*\\n\\n` +
            `Заказ: #${order.orderNumber}\\n` +
            `Клиент: ${order.customer.name}\\n` +
            `Сумма: $${order.totalAmount}\\n\\n` +
            `Оформить полный возврат?`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[
                  { text: '✅ Да, вернуть', callback_data: `refund_${order.id}` },
                  { text: '❌ Отмена', callback_data: 'cancel' }
                ]]
              }
            }
          )
          break

        case 'stats':
          const stats = await prisma.$transaction([
            prisma.order.count(),
            prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
            prisma.product.count({ where: { status: 'active' } }),
            prisma.customer.count(),
            prisma.order.aggregate({ _sum: { totalAmount: true } })
          ])
          
          await ctx.reply(
            `📊 *Статистика магазина*\\n\\n` +
            `📦 Всего заказов: ${stats[0]}\\n` +
            `📅 Заказов сегодня: ${stats[1]}\\n` +
            `🛍 Активных товаров: ${stats[2]}\\n` +
            `👥 Клиентов: ${stats[3]}\\n` +
            `💰 Общая сумма: $${stats[4]._sum.totalAmount || 0}`,
            { parse_mode: 'Markdown' }
          )
          break

        default:
          await ctx.reply(
            '💡 *Примеры команд:*\\n\\n' +
            '📦 Покажи заказы\\n' +
            '📦 Заказы за сегодня\\n' +
            '📦 Заказы за вчера\\n\\n' +
            '🛍 Добавь товар Платье синее 3000\\n' +
            '🛍 Добавь товар Сумка кожаная 5500\\n\\n' +
            '💳 Оформи возврат для заказа 123\\n\\n' +
            '📊 Покажи статистику',
            { parse_mode: 'Markdown' }
          )
      }
    } catch (error) {
      console.error('Error:', error)
      await ctx.reply('❌ Ошибка при выполнении команды')
    }
  })

  // Обработчик callback
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data
    
    if (data.startsWith('refund_')) {
      const orderId = data.replace('refund_', '')
      
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: 'refunded',
            refundedAt: new Date()
          }
        })
        
        await ctx.answerCallbackQuery('✅ Возврат оформлен')
        await ctx.editMessageText('✅ Возврат успешно оформлен!')
      } catch (error) {
        await ctx.answerCallbackQuery('❌ Ошибка')
      }
    }
    
    if (data === 'cancel') {
      await ctx.answerCallbackQuery('❌ Отменено')
      await ctx.editMessageText('❌ Операция отменена')
    }
  })

  // Обработчик фото
  bot.on('message:photo', async (ctx) => {
    await ctx.reply(
      '📸 Фото получено!\\n\\n' +
      '_Загрузка фото в разработке. Используйте админку сайта для полного управления._',
      { parse_mode: 'Markdown' }
    )
  })

  return bot
}

// Webhook handler
const handler = async (req: NextRequest) => {
  try {
    const bot = await createBot()
    const handleUpdate = webhookCallback(bot, 'std/http')
    
    return handleUpdate(req)
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}

export const POST = handler