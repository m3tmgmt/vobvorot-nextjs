import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from '../utils'

// === CRM ФУНКЦИИ ===

export async function handleSearchCustomer(ctx: any, params: any) {
  try {
    const { query } = params
    
    if (!query) {
      await ctx.reply('❌ Укажите имя, email или телефон для поиска')
      return
    }
    
    const customers = await prisma.order.findMany({
      where: {
        OR: [
          { shippingName: { contains: query, mode: 'insensitive' } },
          { shippingEmail: { contains: query, mode: 'insensitive' } },
          { shippingPhone: { contains: query } }
        ]
      },
      select: {
        shippingName: true,
        shippingEmail: true,
        shippingPhone: true,
        createdAt: true,
        total: true,
        status: true
      },
      distinct: ['shippingEmail'],
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    if (customers.length === 0) {
      await ctx.reply('❌ Клиенты не найдены')
      return
    }
    
    let message = `🔍 *Найденные клиенты:*\\n\\n`
    
    for (const customer of customers) {
      message += `👤 *${escapeMarkdownV2(customer.shippingName)}*\\n`
      message += `📧 ${escapeMarkdownV2(customer.shippingEmail)}\\n`
      message += `📞 ${escapeMarkdownV2(customer.shippingPhone)}\\n`
      message += `📅 Последний заказ: ${formatDate(customer.createdAt)}\\n`
      message += `💰 Сумма: ${formatPrice(customer.total)}\\n\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error searching customers:', error)
    await ctx.reply('❌ Ошибка при поиске клиентов')
  }
}

export async function handleCustomerHistory(ctx: any, params: any) {
  try {
    const { email } = params
    
    if (!email) {
      await ctx.reply('❌ Укажите email клиента')
      return
    }
    
    const orders = await prisma.order.findMany({
      where: { shippingEmail: email },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (orders.length === 0) {
      await ctx.reply(`❌ Заказов для ${email} не найдено`)
      return
    }
    
    const customer = orders[0]
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    
    let message = `📁 *История клиента:*\\n\\n`
    message += `👤 ${escapeMarkdownV2(customer.shippingName)}\\n`
    message += `📧 ${escapeMarkdownV2(customer.shippingEmail)}\\n`
    message += `📞 ${escapeMarkdownV2(customer.shippingPhone)}\\n\\n`
    
    message += `📈 *Статистика:*\\n`
    message += `📋 Всего заказов: ${totalOrders}\\n`
    message += `💰 Общая сумма: ${formatPrice(totalSpent)}\\n`
    message += `💵 Средний чек: ${formatPrice(totalSpent / totalOrders)}\\n\\n`
    
    message += `📋 *Последние 5 заказов:*\\n`
    
    for (const order of orders.slice(0, 5)) {
      const statusEmoji = {
        PENDING: '⏳',
        PROCESSING: '🔄',
        CONFIRMED: '✅',
        SHIPPED: '📦',
        DELIVERED: '✅',
        CANCELLED: '❌',
        REFUNDED: '💸'
      }[order.status] || '❓'
      
      message += `${statusEmoji} \\#${escapeMarkdownV2(order.id)} \\- ${formatPrice(order.total)}\\n`
      message += `   📅 ${formatDate(order.createdAt)}\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting customer history:', error)
    await ctx.reply('❌ Ошибка при получении истории клиента')
  }
}

export async function handleTopCustomers(ctx: any, params: any) {
  try {
    const { period = 'all', limit = 10 } = params
    
    let where: any = {}
    const now = new Date()
    
    switch (period) {
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        where.createdAt = { gte: monthAgo }
        break
      case 'quarter':
        const quarterAgo = new Date(now)
        quarterAgo.setMonth(quarterAgo.getMonth() - 3)
        where.createdAt = { gte: quarterAgo }
        break
      case 'year':
        const yearAgo = new Date(now)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        where.createdAt = { gte: yearAgo }
        break
    }
    
    const topCustomers = await prisma.order.groupBy({
      by: ['shippingEmail', 'shippingName'],
      where,
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit
    })
    
    if (topCustomers.length === 0) {
      await ctx.reply('❌ Нет данных о клиентах')
      return
    }
    
    let message = `🏆 *ТОП клиентов \\(${period}\\):*\\n\\n`
    
    let rank = 1
    for (const customer of topCustomers) {
      const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}️⃣`
      
      message += `${medal} *${escapeMarkdownV2(customer.shippingName)}*\\n`
      message += `   💰 Общая сумма: ${formatPrice(customer._sum.total || 0)}\\n`
      message += `   📋 Заказов: ${customer._count.id}\\n`
      message += `   💵 Средний чек: ${formatPrice((customer._sum.total || 0) / customer._count.id)}\\n\\n`
      
      rank++
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting top customers:', error)
    await ctx.reply('❌ Ошибка при получении топа клиентов')
  }
}

export async function handleCustomerSegmentation(ctx: any, params: any) {
  try {
    // Разделяем клиентов по сегментам
    
    // 1. Новые клиенты (первый заказ за последние 30 дней)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const newCustomers = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "shippingEmail") as count
      FROM "Order" o1
      WHERE o1."createdAt" >= ${thirtyDaysAgo}
      AND NOT EXISTS (
        SELECT 1 FROM "Order" o2 
        WHERE o2."shippingEmail" = o1."shippingEmail" 
        AND o2."createdAt" < ${thirtyDaysAgo}
      )
    `
    
    // 2. Постоянные клиенты (более 3 заказов)
    const loyalCustomers = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM (
        SELECT "shippingEmail"
        FROM "Order"
        GROUP BY "shippingEmail"
        HAVING COUNT(*) > 3
      ) as loyal
    `
    
    // 3. Неактивные (нет заказов более 90 дней)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const inactiveCustomers = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "shippingEmail") as count
      FROM "Order" o1
      WHERE o1."shippingEmail" NOT IN (
        SELECT DISTINCT "shippingEmail"
        FROM "Order"
        WHERE "createdAt" >= ${ninetyDaysAgo}
      )
    `
    
    // 4. VIP клиенты (сумма покупок > 10000 грн)
    const vipCustomers = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM (
        SELECT "shippingEmail"
        FROM "Order"
        GROUP BY "shippingEmail"
        HAVING SUM(total) > 10000
      ) as vip
    `
    
    // 5. Общее количество уникальных клиентов
    const totalCustomers = await prisma.order.findMany({
      select: { shippingEmail: true },
      distinct: ['shippingEmail']
    })
    
    let message = `📈 *Сегментация клиентов:*\\n\\n`
    
    message += `👥 *Общая статистика:*\\n`
    message += `   Всего клиентов: ${totalCustomers.length}\\n\\n`
    
    message += `🌟 *По сегментам:*\\n`
    message += `🆕 Новые \\(30 дней\\): ${(newCustomers as any)[0]?.count || 0}\\n`
    message += `💖 Постоянные \\(3\\+ заказов\\): ${(loyalCustomers as any)[0]?.count || 0}\\n`
    message += `💰 VIP \\(10\\+ тыс\\. грн\\): ${(vipCustomers as any)[0]?.count || 0}\\n`
    message += `⏸ Неактивные \\(90\\+ дней\\): ${(inactiveCustomers as any)[0]?.count || 0}\\n\\n`
    
    // Процентное соотношение
    const total = totalCustomers.length
    if (total > 0) {
      message += `📉 *Процентное соотношение:*\\n`
      message += `   Новые: ${(((newCustomers as any)[0]?.count || 0) / total * 100).toFixed(1)}%\\n`
      message += `   Постоянные: ${(((loyalCustomers as any)[0]?.count || 0) / total * 100).toFixed(1)}%\\n`
      message += `   VIP: ${(((vipCustomers as any)[0]?.count || 0) / total * 100).toFixed(1)}%\\n`
      message += `   Неактивные: ${(((inactiveCustomers as any)[0]?.count || 0) / total * 100).toFixed(1)}%`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting customer segmentation:', error)
    await ctx.reply('❌ Ошибка при сегментации клиентов')
  }
}

export async function handleCustomerRetention(ctx: any, params: any) {
  try {
    // Анализ удержания клиентов
    
    // Клиенты с повторными покупками
    const repeatCustomers = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat_customers,
        AVG(order_count) as avg_orders_per_customer
      FROM (
        SELECT "shippingEmail", COUNT(*) as order_count
        FROM "Order"
        GROUP BY "shippingEmail"
      ) as customer_orders
    `
    
    // Средний интервал между покупками
    const avgInterval = await prisma.$queryRaw`
      SELECT AVG(days_between_orders) as avg_days
      FROM (
        SELECT 
          "shippingEmail",
          "createdAt" - LAG("createdAt") OVER (PARTITION BY "shippingEmail" ORDER BY "createdAt") as days_between_orders
        FROM "Order"
      ) as intervals
      WHERE days_between_orders IS NOT NULL
    `
    
    // Клиенты по количеству покупок
    const customerDistribution = await prisma.$queryRaw`
      SELECT 
        order_count,
        COUNT(*) as customers
      FROM (
        SELECT "shippingEmail", COUNT(*) as order_count
        FROM "Order"
        GROUP BY "shippingEmail"
      ) as customer_orders
      GROUP BY order_count
      ORDER BY order_count
    `
    
    const data = (repeatCustomers as any)[0]
    const intervalData = (avgInterval as any)[0]
    
    let message = `🔄 *Анализ удержания:*\\n\\n`
    
    if (data) {
      const retentionRate = data.repeat_customers / data.total_customers * 100
      
      message += `📈 *Основные метрики:*\\n`
      message += `   Всего клиентов: ${data.total_customers}\\n`
      message += `   Повторные покупки: ${data.repeat_customers}\\n`
      message += `   Коэффициент удержания: ${retentionRate.toFixed(1)}%\\n`
      message += `   Среднее заказов на клиента: ${parseFloat(data.avg_orders_per_customer).toFixed(1)}\\n\\n`
    }
    
    if (intervalData && intervalData.avg_days) {
      const avgDays = Math.round(intervalData.avg_days / (1000 * 60 * 60 * 24))
      message += `⏱ Средний интервал между покупками: ${avgDays} дней\\n\\n`
    }
    
    message += `📉 *Распределение по количеству заказов:*\\n`
    
    for (const item of (customerDistribution as any).slice(0, 10)) {
      message += `   ${item.order_count} заказ: ${item.customers} клиентов\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error analyzing customer retention:', error)
    await ctx.reply('❌ Ошибка при анализе удержания')
  }
}

export async function handleAddCustomerNote(ctx: any, params: any) {
  try {
    const { email, note } = params
    
    if (!email || !note) {
      await ctx.reply('❌ Укажите email клиента и текст заметки')
      return
    }
    
    // Находим последний заказ клиента
    const lastOrder = await prisma.order.findFirst({
      where: { shippingEmail: email },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!lastOrder) {
      await ctx.reply(`❌ Клиент с email ${email} не найден`)
      return
    }
    
    // Добавляем заметку к последнему заказу
    const existingNotes = lastOrder.notes || ''
    const newNotes = existingNotes + (existingNotes ? '\n' : '') + `[CRM ${new Date().toISOString()}] ${note}`
    
    await prisma.order.update({
      where: { id: lastOrder.id },
      data: { notes: newNotes }
    })
    
    await ctx.reply(
      `✅ Заметка добавлена\\!\\n\\n` +
      `👤 Клиент: ${escapeMarkdownV2(lastOrder.shippingName)}\\n` +
      `📧 Email: ${escapeMarkdownV2(email)}\\n` +
      `📝 Заметка: ${escapeMarkdownV2(note)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error adding customer note:', error)
    await ctx.reply('❌ Ошибка при добавлении заметки')
  }
}

export async function handleCustomerLifetimeValue(ctx: any, params: any) {
  try {
    const { email } = params
    
    let where: any = {}
    if (email) {
      where.shippingEmail = email
    }
    
    // Общая статистика LTV
    const customerStats = await prisma.order.groupBy({
      by: ['email'],
      where,
      _sum: { total: true },
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true }
    })
    
    if (customerStats.length === 0) {
      await ctx.reply('❌ Нет данных о клиентах')
      return
    }
    
    if (email) {
      // Детально о конкретном клиенте
      const customer = customerStats[0]
      const firstOrder = customer._min.createdAt
      const lastOrder = customer._max.createdAt
      const daysBetween = Math.ceil((lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24))
      
      let message = `💰 *LTV клиента:*\\n\\n`
      message += `📧 Email: ${escapeMarkdownV2(email)}\\n`
      message += `💵 Общая стоимость: ${formatPrice(customer._sum.total || 0)}\\n`
      message += `📋 Количество заказов: ${customer._count.id}\\n`
      message += `💸 Средний чек: ${formatPrice((customer._sum.total || 0) / customer._count.id)}\\n`
      message += `📅 Первый заказ: ${formatDate(firstOrder)}\\n`
      message += `📅 Последний заказ: ${formatDate(lastOrder)}\\n`
      message += `⏱ Период клиента: ${daysBetween} дней`
      
      await ctx.reply(message, { parse_mode: 'MarkdownV2' })
    } else {
      // Общая статистика LTV
      const totalLTV = customerStats.reduce((sum, customer) => sum + (customer._sum.total || 0), 0)
      const avgLTV = totalLTV / customerStats.length
      
      // Клиенты с наибольшим LTV
      const topLTV = customerStats
        .sort((a, b) => (b._sum.total || 0) - (a._sum.total || 0))
        .slice(0, 5)
      
      let message = `💰 *Общая статистика LTV:*\\n\\n`
      message += `👥 Всего клиентов: ${customerStats.length}\\n`
      message += `💵 Общий LTV: ${formatPrice(totalLTV)}\\n`
      message += `💸 Средний LTV: ${formatPrice(avgLTV)}\\n\\n`
      
      message += `🏆 *ТОП 5 по LTV:*\\n`
      let rank = 1
      for (const customer of topLTV) {
        const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}️⃣`
        message += `${medal} ${formatPrice(customer._sum.total || 0)} \\(${customer._count.id} заказов\\)\\n`
        rank++
      }
      
      await ctx.reply(message, { parse_mode: 'MarkdownV2' })
    }
  } catch (error) {
    console.error('Error calculating customer LTV:', error)
    await ctx.reply('❌ Ошибка при расчете LTV')
  }
}

export async function handleCustomerReactivation(ctx: any, params: any) {
  try {
    const { days = 90 } = params
    
    // Находим клиентов, которые не делали заказы более N дней
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)
    
    const inactiveCustomers = await prisma.$queryRaw`
      SELECT 
        o1."shippingEmail" as email,
        o1."shippingName" as "fullName",
        o1."shippingPhone" as phone,
        MAX(o1."createdAt") as last_order_date,
        COUNT(o1.id) as total_orders,
        SUM(o1.total) as total_spent
      FROM "Order" o1
      WHERE o1."shippingEmail" NOT IN (
        SELECT DISTINCT "shippingEmail"
        FROM "Order"
        WHERE "createdAt" >= ${daysAgo}
      )
      GROUP BY o1."shippingEmail", o1."shippingName", o1."shippingPhone"
      HAVING COUNT(o1.id) > 1
      ORDER BY MAX(o1."createdAt") DESC
      LIMIT 20
    `
    
    if ((inactiveCustomers as any).length === 0) {
      await ctx.reply(`✅ Нет неактивных клиентов \\(${days} дней\\)`)
      return
    }
    
    let message = `🔄 *Клиенты для реактивации:*\\n`
    message += `_Не делали заказы более ${days} дней_\\n\\n`
    
    for (const customer of (inactiveCustomers as any)) {
      const daysSinceLastOrder = Math.ceil((new Date().getTime() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
      
      message += `👤 *${escapeMarkdownV2(customer.fullName)}*\\n`
      message += `   📧 ${escapeMarkdownV2(customer.email)}\\n`
      message += `   📞 ${escapeMarkdownV2(customer.phone)}\\n`
      message += `   📅 Последний заказ: ${daysSinceLastOrder} дней назад\\n`
      message += `   📋 Всего заказов: ${customer.total_orders}\\n`
      message += `   💰 Общая сумма: ${formatPrice(parseFloat(customer.total_spent))}\\n\\n`
    }
    
    message += `🎁 *Рекомендации по реактивации:*\\n`
    message += `   • Персональная скидка 10\\-15%\\n`
    message += `   • Новинки в любимых категориях\\n`
    message += `   • Бесплатная доставка\\n`
    message += `   • Лимитированное предложение`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error finding customers for reactivation:', error)
    await ctx.reply('❌ Ошибка при поиске клиентов для реактивации')
  }
}

export async function handleCustomerFeedback(ctx: any, params: any) {
  try {
    const { email, feedback, rating } = params
    
    if (!email || !feedback) {
      await ctx.reply('❌ Укажите email клиента и текст отзыва')
      return
    }
    
    // Находим клиента
    const customer = await prisma.order.findFirst({
      where: { shippingEmail: email },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!customer) {
      await ctx.reply(`❌ Клиент с email ${email} не найден`)
      return
    }
    
    // Сохраняем отзыв в заметки последнего заказа
    const ratingText = rating ? ` (⭐ ${rating}/5)` : ''
    const feedbackNote = `[FEEDBACK ${new Date().toISOString()}]${ratingText} ${feedback}`
    const existingNotes = customer.notes || ''
    const newNotes = existingNotes + (existingNotes ? '\n' : '') + feedbackNote
    
    await prisma.order.update({
      where: { id: customer.id },
      data: { notes: newNotes }
    })
    
    // Отправляем подтверждение
    let message = `✅ Отзыв сохранен\\!\\n\\n`
    message += `👤 Клиент: ${escapeMarkdownV2(customer.fullName)}\\n`
    message += `📧 Email: ${escapeMarkdownV2(email)}\\n`
    if (rating) {
      message += `⭐ Оценка: ${rating}/5\\n`
    }
    message += `📝 Отзыв: ${escapeMarkdownV2(feedback)}`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error saving customer feedback:', error)
    await ctx.reply('❌ Ошибка при сохранении отзыва')
  }
}

export async function handleExportCustomers(ctx: any, params: any) {
  try {
    const { segment = 'all' } = params
    
    let query: any = {}
    let filename = 'customers_export'
    
    switch (segment) {
      case 'vip':
        // VIP клиенты (сумма > 10000 грн)
        const vipEmails = await prisma.order.groupBy({
          by: ['email'],
          _sum: { total: true },
          having: { total: { _sum: { gt: 10000 } } }
        })
        query.shippingEmail = { in: vipEmails.map(v => v.shippingEmail) }
        filename = 'vip_customers_export'
        break
      
      case 'inactive':
        // Неактивные (более 90 дней)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        
        const activeEmails = await prisma.order.findMany({
          where: { createdAt: { gte: ninetyDaysAgo } },
          select: { shippingEmail: true },
          distinct: ['shippingEmail']
        })
        
        query.shippingEmail = { notIn: activeEmails.map(a => a.shippingEmail) }
        filename = 'inactive_customers_export'
        break
    }
    
    // Получаем данные клиентов
    const customers = await prisma.order.findMany({
      where: query,
      select: {
        shippingName: true,
        shippingEmail: true,
        shippingPhone: true,
        createdAt: true,
        total: true,
        shippingCity: true,
        shippingCountry: true
      },
      distinct: ['shippingEmail'],
      orderBy: { createdAt: 'desc' }
    })
    
    if (customers.length === 0) {
      await ctx.reply('❌ Нет клиентов для экспорта')
      return
    }
    
    // Формируем CSV
    let csv = 'Имя,Email,Телефон,Город,Страна,Первый заказ,Последняя сумма\n'
    
    for (const customer of customers) {
      csv += `"${customer.shippingName}","${customer.shippingEmail}","${customer.shippingPhone}","${customer.shippingCity || ''}","${customer.shippingCountry || ''}","${customer.createdAt.toISOString().split('T')[0]}","${customer.total}"\n`
    }
    
    // Отправляем как документ
    await ctx.replyWithDocument(
      Buffer.from(csv, 'utf-8'),
      {
        filename: `${filename}_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📄 Экспорт клиентов (${customers.length} шт.)`
      }
    )
  } catch (error) {
    console.error('Error exporting customers:', error)
    await ctx.reply('❌ Ошибка при экспорте клиентов')
  }
}

export async function handleCustomerBirthdays(ctx: any, params: any) {
  try {
    const { upcoming = true } = params
    
    // Пока что в схеме нет поля для дня рождения
    // Отправляем сообщение о том, что функция в разработке
    await ctx.reply(
      `🎂 *Функция отслеживания дней рождения*\\n\\n` +
      `⚠️ В разработке\\n\\n` +
      `📝 Для реализации нужно:`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error handling customer birthdays:', error)
    await ctx.reply('❌ Ошибка при обработке дней рождения')
  }
}

export async function handleCustomerTags(ctx: any, params: any) {
  try {
    const { email, tags, action = 'add' } = params
    
    if (!email) {
      await ctx.reply('❌ Укажите email клиента')
      return
    }
    
    // Пока что теги сохраняем в заметки заказа
    const customer = await prisma.order.findFirst({
      where: { shippingEmail: email },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!customer) {
      await ctx.reply(`❌ Клиент с email ${email} не найден`)
      return
    }
    
    if (action === 'view') {
      // Показываем текущие теги из заметок
      const notes = customer.notes || ''
      const tagMatches = notes.match(/\[TAGS\]([^\n]*)/g) || []
      const currentTags = tagMatches.map(match => match.replace('[TAGS]', '').trim()).join(', ')
      
      await ctx.reply(
        `🏷 *Теги клиента:*\\n\\n` +
        `👤 ${escapeMarkdownV2(customer.fullName)}\\n` +
        `📧 ${escapeMarkdownV2(email)}\\n` +
        `🏷 Теги: ${currentTags || 'Нет тегов'}`,
        { parse_mode: 'MarkdownV2' }
      )
      return
    }
    
    if (!tags) {
      await ctx.reply('❌ Укажите теги через запятую')
      return
    }
    
    // Добавляем теги
    const tagNote = `[TAGS] ${tags}`
    const existingNotes = customer.notes || ''
    const newNotes = existingNotes + (existingNotes ? '\n' : '') + tagNote
    
    await prisma.order.update({
      where: { id: customer.id },
      data: { notes: newNotes }
    })
    
    await ctx.reply(
      `✅ Теги добавлены\\!\\n\\n` +
      `👤 Клиент: ${escapeMarkdownV2(customer.fullName)}\\n` +
      `🏷 Теги: ${escapeMarkdownV2(tags)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error managing customer tags:', error)
    await ctx.reply('❌ Ошибка при управлении тегами')
  }
}

export async function handleCustomerCommunication(ctx: any, params: any) {
  try {
    const { email, message, type = 'note' } = params
    
    if (!email || !message) {
      await ctx.reply('❌ Укажите email клиента и сообщение')
      return
    }
    
    const customer = await prisma.order.findFirst({
      where: { shippingEmail: email },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!customer) {
      await ctx.reply(`❌ Клиент с email ${email} не найден`)
      return
    }
    
    // Сохраняем сообщение в заметки
    const typeEmoji = {
      'note': '📝',
      'call': '📞',
      'email': '📧',
      'meeting': '🤝'
    }[type] || '📝'
    
    const commNote = `[${type.toUpperCase()} ${new Date().toISOString()}] ${typeEmoji} ${message}`
    const existingNotes = customer.notes || ''
    const newNotes = existingNotes + (existingNotes ? '\n' : '') + commNote
    
    await prisma.order.update({
      where: { id: customer.id },
      data: { notes: newNotes }
    })
    
    await ctx.reply(
      `✅ Коммуникация зафиксирована\\!\\n\\n` +
      `👤 Клиент: ${escapeMarkdownV2(customer.fullName)}\\n` +
      `${typeEmoji} Тип: ${escapeMarkdownV2(type)}\\n` +
      `📝 Сообщение: ${escapeMarkdownV2(message)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error recording customer communication:', error)
    await ctx.reply('❌ Ошибка при фиксации коммуникации')
  }
}