import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from '../utils'

// === АНАЛИТИКА И СТАТИСТИКА ===

export async function handleGeneralStats(ctx: any, params: any) {
  try {
    const { period = 'all' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'today':
        dateFilter.createdAt = {
          gte: new Date(now.setHours(0, 0, 0, 0))
        }
        break
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        dateFilter.createdAt = {
          gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          lt: new Date(now.setHours(0, 0, 0, 0))
        }
        break
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.createdAt = { gte: monthAgo }
        break
    }
    
    // Основные метрики
    const [orders, products, customers] = await Promise.all([
      prisma.order.findMany({
        where: dateFilter,
        select: {
          total: true,
          status: true,
          createdAt: true,
          shippingEmail: true
        }
      }),
      prisma.product.count(),
      prisma.order.findMany({
        where: dateFilter,
        select: { shippingEmail: true },
        distinct: ['shippingEmail']
      })
    ])
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const uniqueCustomers = customers.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Статистика по статусам
    const statusStats = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    let message = `📈 *Общая статистика \\(${period}\\):*\\n\\n`
    
    message += `💰 *Доход:*\\n`
    message += `   Общий доход: ${formatPrice(totalRevenue)}\\n`
    message += `   Средний чек: ${formatPrice(averageOrderValue)}\\n\\n`
    
    message += `📋 *Заказы:*\\n`
    message += `   Всего заказов: ${totalOrders}\\n`
    
    const statusEmojis = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      PROCESSING: '🔄',
      SHIPPED: '📦',
      DELIVERED: '✅',
      CANCELLED: '❌',
      REFUNDED: '💸'
    }
    
    for (const [status, count] of Object.entries(statusStats)) {
      const emoji = statusEmojis[status as keyof typeof statusEmojis] || '❓'
      message += `   ${emoji} ${status}: ${count}\\n`
    }
    
    message += `\\n👥 *Клиенты:*\\n`
    message += `   Уникальные клиенты: ${uniqueCustomers}\\n\\n`
    
    message += `📦 *Товары:*\\n`
    message += `   Всего товаров: ${products}`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting general stats:', error)
    await ctx.reply('❌ Ошибка при получении статистики')
  }
}

export async function handleSalesReport(ctx: any, params: any) {
  try {
    const { period = 'month', groupBy = 'day' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.createdAt = { gte: monthAgo }
        break
      case 'quarter':
        const quarterAgo = new Date(now)
        quarterAgo.setMonth(quarterAgo.getMonth() - 3)
        dateFilter.createdAt = { gte: quarterAgo }
        break
      case 'year':
        const yearAgo = new Date(now)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        dateFilter.createdAt = { gte: yearAgo }
        break
    }
    
    const orders = await prisma.order.findMany({
      where: {
        ...dateFilter,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
      },
      select: {
        total: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    if (orders.length === 0) {
      await ctx.reply(`❌ Нет данных о продажах за ${period}`)
      return
    }
    
    // Группируем по дням/неделям/месяцам
    const salesByPeriod = new Map<string, { revenue: number, orders: number }>()
    
    for (const order of orders) {
      let key: string
      
      if (groupBy === 'day') {
        key = order.createdAt.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const weekStart = new Date(order.createdAt)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      }
      
      const existing = salesByPeriod.get(key) || { revenue: 0, orders: 0 }
      salesByPeriod.set(key, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1
      })
    }
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalRevenue / totalOrders
    
    let message = `📈 *Отчет по продажам \\(${period}\\):*\\n\\n`
    
    message += `📈 *Общая статистика:*\\n`
    message += `   Общий доход: ${formatPrice(totalRevenue)}\\n`
    message += `   Количество заказов: ${totalOrders}\\n`
    message += `   Средний чек: ${formatPrice(averageOrderValue)}\\n\\n`
    
    message += `📊 *По ${groupBy === 'day' ? 'дням' : groupBy === 'week' ? 'неделям' : 'месяцам'}:*\\n`
    
    const sortedPeriods = Array.from(salesByPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10) // Последние 10 периодов
    
    for (const [period, data] of sortedPeriods) {
      message += `   📅 ${period}: ${formatPrice(data.revenue)} \\(${data.orders} заказов\\)\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error generating sales report:', error)
    await ctx.reply('❌ Ошибка при генерации отчета по продажам')
  }
}

export async function handleTopProducts(ctx: any, params: any) {
  try {
    const { period = 'month', metric = 'revenue', limit = 10 } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter['order.createdAt'] = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter['order.createdAt'] = { gte: monthAgo }
        break
      case 'quarter':
        const quarterAgo = new Date(now)
        quarterAgo.setMonth(quarterAgo.getMonth() - 3)
        dateFilter['order.createdAt'] = { gte: quarterAgo }
        break
    }
    
    const orderItems = await prisma.orderItem.findMany({
      where: dateFilter,
      include: {
        sku: {
          include: {
            product: true
          }
        },
        order: {
          select: {
            createdAt: true,
            status: true
          }
        }
      }
    })
    
    // Фильтруем только оплаченные заказы
    const paidItems = orderItems.filter(item => 
      ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(item.order.status)
    )
    
    if (paidItems.length === 0) {
      await ctx.reply(`❌ Нет данных о продажах за ${period}`)
      return
    }
    
    // Группируем по товарам
    const productStats = new Map<string, {
      name: string,
      revenue: number,
      quantity: number,
      orders: number
    }>()
    
    for (const item of paidItems) {
      const productId = item.sku.productId
      const existing = productStats.get(productId) || {
        name: item.sku.product.name,
        revenue: 0,
        quantity: 0,
        orders: 0
      }
      
      productStats.set(productId, {
        name: item.sku.product.name,
        revenue: existing.revenue + (item.price * item.quantity),
        quantity: existing.quantity + item.quantity,
        orders: existing.orders + 1
      })
    }
    
    // Сортируем по выбранной метрике
    const sortedProducts = Array.from(productStats.values())
      .sort((a, b) => {
        if (metric === 'quantity') return b.quantity - a.quantity
        if (metric === 'orders') return b.orders - a.orders
        return b.revenue - a.revenue
      })
      .slice(0, limit)
    
    const metricName = {
      revenue: 'доходу',
      quantity: 'количеству',
      orders: 'заказам'
    }[metric] || 'доходу'
    
    let message = `🏆 *ТОП товаров по ${metricName} \\(${period}\\):*\\n\\n`
    
    let rank = 1
    for (const product of sortedProducts) {
      const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}️⃣`
      
      message += `${medal} *${escapeMarkdownV2(product.name)}*\\n`
      message += `   💰 Доход: ${formatPrice(product.revenue)}\\n`
      message += `   📦 Продано: ${product.quantity} шт\\.\\n`
      message += `   📋 Заказов: ${product.orders}\\n\\n`
      
      rank++
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting top products:', error)
    await ctx.reply('❌ Ошибка при получении топа товаров')
  }
}

export async function handleRevenueAnalysis(ctx: any, params: any) {
  try {
    const { comparison = true } = params
    
    const now = new Date()
    
    // Текущий месяц
    const currentMonth = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        },
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
      },
      select: { total: true, createdAt: true }
    })
    
    // Прошлый месяц
    const previousMonth = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: new Date(now.getFullYear(), now.getMonth(), 1)
        },
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
      },
      select: { total: true, createdAt: true }
    })
    
    const currentRevenue = currentMonth.reduce((sum, order) => sum + order.total, 0)
    const previousRevenue = previousMonth.reduce((sum, order) => sum + order.total, 0)
    
    const currentOrders = currentMonth.length
    const previousOrders = previousMonth.length
    
    const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0
    const previousAOV = previousOrders > 0 ? previousRevenue / previousOrders : 0
    
    let message = `📈 *Анализ дохода:*\\n\\n`
    
    message += `📅 *Текущий месяц:*\\n`
    message += `   💰 Доход: ${formatPrice(currentRevenue)}\\n`
    message += `   📋 Заказов: ${currentOrders}\\n`
    message += `   💵 Средний чек: ${formatPrice(currentAOV)}\\n\\n`
    
    if (comparison && previousOrders > 0) {
      const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue * 100)
      const ordersGrowth = ((currentOrders - previousOrders) / previousOrders * 100)
      const aovGrowth = ((currentAOV - previousAOV) / previousAOV * 100)
      
      message += `📅 *Прошлый месяц:*\\n`
      message += `   💰 Доход: ${formatPrice(previousRevenue)}\\n`
      message += `   📋 Заказов: ${previousOrders}\\n`
      message += `   💵 Средний чек: ${formatPrice(previousAOV)}\\n\\n`
      
      message += `📈 *Изменения:*\\n`
      
      const revenueEmoji = revenueGrowth >= 0 ? '⬆️' : '⬇️'
      const ordersEmoji = ordersGrowth >= 0 ? '⬆️' : '⬇️'
      const aovEmoji = aovGrowth >= 0 ? '⬆️' : '⬇️'
      
      message += `   ${revenueEmoji} Доход: ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%\\n`
      message += `   ${ordersEmoji} Заказы: ${ordersGrowth >= 0 ? '+' : ''}${ordersGrowth.toFixed(1)}%\\n`
      message += `   ${aovEmoji} Средний чек: ${aovGrowth >= 0 ? '+' : ''}${aovGrowth.toFixed(1)}%\\n\\n`
    }
    
    // Прогноз на конец месяца
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysPassed = now.getDate()
    const dailyAverage = currentRevenue / daysPassed
    const projectedRevenue = dailyAverage * daysInMonth
    
    message += `🔮 *Прогноз на месяц:*\\n`
    message += `   Прошло дней: ${daysPassed} из ${daysInMonth}\\n`
    message += `   Средний доход в день: ${formatPrice(dailyAverage)}\\n`
    message += `   Прогноз на месяц: ${formatPrice(projectedRevenue)}`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error analyzing revenue:', error)
    await ctx.reply('❌ Ошибка при анализе дохода')
  }
}

export async function handleInventoryReport(ctx: any, params: any) {
  try {
    const { sortBy = 'quantity', showOutOfStock = true } = params
    
    // Основная статистика склада через ProductSku
    const [totalProducts, activeProducts, lowStockSkus, outOfStockSkus, totalValue] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productSku.count({ where: { stock: { lte: 10 }, isActive: true } }),
      prisma.productSku.count({ where: { stock: 0, isActive: true } }),
      prisma.productSku.aggregate({
        _sum: {
          price: true
        },
        where: { isActive: true }
      })
    ])
    
    let message = `📦 *Отчет по складу:*\\n\\n`
    
    message += `📈 *Общая статистика:*\\n`
    message += `   Всего товаров: ${totalProducts}\\n`
    message += `   Активных: ${activeProducts}\\n`
    message += `   SKU с низким остатком \\(≤ 10\\): ${lowStockSkus}\\n`
    message += `   SKU нет в наличии: ${outOfStockSkus}\\n`
    message += `   Общая стоимость: ${formatPrice(totalValue._sum.price || 0)}\\n\\n`
    
    // Статистика по категориям через отношения
    const categoryStats = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: {
            skus: {
              where: { isActive: true },
              select: {
                stock: true,
                price: true
              }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        products: { _count: 'desc' }
      },
      take: 5
    })
    
    if (categoryStats.length > 0) {
      message += `🏷 *ТОП 5 категорий:*\\n`
      for (const cat of categoryStats) {
        const totalStock = cat.products.reduce((sum, product) => 
          sum + product.skus.reduce((skuSum, sku) => skuSum + sku.stock, 0), 0
        )
        message += `   • ${escapeMarkdownV2(cat.name)}: ${cat._count.products} товаров \\(${totalStock} шт\\)\\n`
      }
      message += '\\n'
    }
    
    // Показываем SKU с низким остатком
    if (lowStockSkus > 0) {
      const lowStockProducts = await prisma.productSku.findMany({
        where: {
          stock: { lte: 10 },
          isActive: true
        },
        include: {
          product: {
            select: {
              name: true
            }
          }
        },
        orderBy: { stock: 'asc' },
        take: 10
      })
      
      message += `⚠️ *SKU с низким остатком:*\\n`
      for (const sku of lowStockProducts) {
        const skuName = sku.size || sku.color ? `${sku.product.name} \\(${[sku.size, sku.color].filter(Boolean).join(', ')}\\)` : sku.product.name
        message += `   • ${escapeMarkdownV2(skuName)}: ${sku.stock} шт\\.\\n`
      }
      message += '\\n'
    }
    
    // Показываем SKU не в наличии
    if (showOutOfStock && outOfStockSkus > 0) {
      const outOfStockProducts = await prisma.productSku.findMany({
        where: { stock: 0, isActive: true },
        include: {
          product: {
            select: {
              name: true
            }
          }
        },
        take: 5
      })
      
      message += `❌ *SKU нет в наличии \\(первые 5\\):*\\n`
      for (const sku of outOfStockProducts) {
        const skuName = sku.size || sku.color ? `${sku.product.name} \\(${[sku.size, sku.color].filter(Boolean).join(', ')}\\)` : sku.product.name
        message += `   • ${escapeMarkdownV2(skuName)}\\n`
      }
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error generating inventory report:', error)
    await ctx.reply('❌ Ошибка при генерации отчета по складу')
  }
}

export async function handleConversionAnalysis(ctx: any, params: any) {
  try {
    const { period = 'month' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.createdAt = { gte: monthAgo }
        break
    }
    
    // Получаем все заказы за период
    const orders = await prisma.order.findMany({
      where: dateFilter,
      select: {
        status: true,
        total: true,
        createdAt: true,
        shippingEmail: true
      }
    })
    
    if (orders.length === 0) {
      await ctx.reply(`❌ Нет данных за ${period}`)
      return
    }
    
    const totalOrders = orders.length
    const paidOrders = orders.filter(o => ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)).length
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length
    const refundedOrders = orders.filter(o => o.status === 'REFUNDED').length
    
    const conversionRate = (paidOrders / totalOrders * 100)
    const cancellationRate = (cancelledOrders / totalOrders * 100)
    const refundRate = (refundedOrders / totalOrders * 100)
    
    // Статистика по статусам
    const statusStats = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    let message = `📊 *Анализ конверсии \\(${period}\\):*\\n\\n`
    
    message += `📈 *Основные метрики:*\\n`
    message += `   Всего заказов: ${totalOrders}\\n`
    message += `   Конверсия в оплату: ${conversionRate.toFixed(1)}%\\n`
    message += `   Уровень отмен: ${cancellationRate.toFixed(1)}%\\n`
    message += `   Уровень возвратов: ${refundRate.toFixed(1)}%\\n\\n`
    
    message += `📊 *Распределение по статусам:*\\n`
    
    const statusEmojis = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      PROCESSING: '🔄',
      SHIPPED: '📦',
      DELIVERED: '✅',
      CANCELLED: '❌',
      REFUNDED: '💸'
    }
    
    for (const [status, count] of Object.entries(statusStats)) {
      const emoji = statusEmojis[status as keyof typeof statusEmojis] || '❓'
      const percentage = (count / totalOrders * 100).toFixed(1)
      message += `   ${emoji} ${status}: ${count} \\(${percentage}%\\)\\n`
    }
    
    // Рекомендации
    message += `\\n🎁 *Рекомендации:*\\n`
    
    if (conversionRate < 70) {
      message += `   ⚠️ Низкая конверсия \\(${conversionRate.toFixed(1)}%\\)\\n`
      message += `   • Проверьте процесс оплаты\\n`
    }
    
    if (cancellationRate > 15) {
      message += `   ⚠️ Высокий уровень отмен \\(${cancellationRate.toFixed(1)}%\\)\\n`
      message += `   • Улучшите описание товаров\\n`
    }
    
    if (refundRate > 10) {
      message += `   ⚠️ Высокие возвраты \\(${refundRate.toFixed(1)}%\\)\\n`
      message += `   • Проверьте качество товара\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error analyzing conversion:', error)
    await ctx.reply('❌ Ошибка при анализе конверсии')
  }
}

export async function handlePeakHoursAnalysis(ctx: any, params: any) {
  try {
    const { period = 'month' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.createdAt = { gte: monthAgo }
        break
    }
    
    const orders = await prisma.order.findMany({
      where: {
        ...dateFilter,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
      },
      select: { createdAt: true, total: true }
    })
    
    if (orders.length === 0) {
      await ctx.reply(`❌ Нет данных за ${period}`)
      return
    }
    
    // Анализ по часам
    const hourlyStats = new Array(24).fill(0).map(() => ({ orders: 0, revenue: 0 }))
    
    for (const order of orders) {
      const hour = order.createdAt.getHours()
      hourlyStats[hour].orders++
      hourlyStats[hour].revenue += order.total
    }
    
    // Находим пиковые часы
    const topHours = hourlyStats
      .map((stats, hour) => ({ hour, ...stats }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
    
    // Анализ по дням недели
    const weekdayStats = new Array(7).fill(0).map(() => ({ orders: 0, revenue: 0 }))
    const weekdayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    
    for (const order of orders) {
      const weekday = order.createdAt.getDay()
      weekdayStats[weekday].orders++
      weekdayStats[weekday].revenue += order.total
    }
    
    const topWeekdays = weekdayStats
      .map((stats, day) => ({ day, name: weekdayNames[day], ...stats }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 3)
    
    let message = `🕰 *Анализ пиковых часов \\(${period}\\):*\\n\\n`
    
    message += `🌅 *ТОП 5 часов по заказам:*\\n`
    
    for (let i = 0; i < topHours.length; i++) {
      const { hour, orders, revenue } = topHours[i]
      const rank = i + 1
      const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}️⃣`
      
      message += `${medal} ${hour}:00\\-${hour + 1}:00: ${orders} заказов \\(${formatPrice(revenue)}\\)\\n`
    }
    
    message += `\\n📅 *ТОП 3 дня недели:*\\n`
    
    for (let i = 0; i < topWeekdays.length; i++) {
      const { name, orders, revenue } = topWeekdays[i]
      const rank = i + 1
      const medal = ['🥇', '🥈', '🥉'][rank - 1]
      
      message += `${medal} ${name}: ${orders} заказов \\(${formatPrice(revenue)}\\)\\n`
    }
    
    // Рекомендации
    message += `\\n🎥 *Рекомендации:*\\n`
    message += `   • Пиковое время: ${topHours[0].hour}:00\\-${topHours[0].hour + 1}:00\\n`
    message += `   • Лучший день: ${topWeekdays[0].name}\\n`
    message += `   • Размещайте рекламу в пиковые часы`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error analyzing peak hours:', error)
    await ctx.reply('❌ Ошибка при анализе пиковых часов')
  }
}

export async function handleGeographicAnalysis(ctx: any, params: any) {
  try {
    const { period = 'month', metric = 'orders' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.createdAt = { gte: monthAgo }
        break
    }
    
    // Статистика по странам
    const countryStats = await prisma.order.groupBy({
      by: ['shippingCountry'],
      where: {
        ...dateFilter,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        shippingCountry: { not: null }
      },
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })
    
    // Статистика по городам
    const cityStats = await prisma.order.groupBy({
      by: ['shippingCity'],
      where: {
        ...dateFilter,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        shippingCity: { not: null }
      },
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })
    
    if (countryStats.length === 0 && cityStats.length === 0) {
      await ctx.reply(`❌ Нет географических данных за ${period}`)
      return
    }
    
    let message = `🌍 *Географическая аналитика \\(${period}\\):*\\n\\n`
    
    if (countryStats.length > 0) {
      message += `🏁 *ТОП стран по заказам:*\\n`
      
      let rank = 1
      for (const country of countryStats) {
        const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}️⃣`
        
        message += `${medal} ${escapeMarkdownV2(country.shippingCountry || 'Неизвестно')}: ${country._count.id} заказов\\n`
        message += `   💰 Доход: ${formatPrice(country._sum.total || 0)}\\n`
        message += `   💵 Средний чек: ${formatPrice((country._sum.total || 0) / country._count.id)}\\n\\n`
        
        rank++
      }
    }
    
    if (cityStats.length > 0) {
      message += `🏢 *ТОП городов по заказам:*\\n`
      
      let rank = 1
      for (const city of cityStats.slice(0, 5)) {
        const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}️⃣`
        
        message += `${medal} ${escapeMarkdownV2(city.shippingCity || 'Неизвестно')}: ${city._count.id} заказов\\n`
        message += `   💰 ${formatPrice(city._sum.total || 0)}\\n\\n`
        
        rank++
      }
    }
    
    // Общая статистика
    const totalCountries = countryStats.length
    const totalCities = cityStats.length
    const totalOrders = countryStats.reduce((sum, country) => sum + country._count.id, 0)
    const totalRevenue = countryStats.reduce((sum, country) => sum + (country._sum.total || 0), 0)
    
    message += `📈 *Общая статистика:*\\n`
    message += `   Стран: ${totalCountries}\\n`
    message += `   Городов: ${totalCities}\\n`
    message += `   Всего заказов: ${totalOrders}\\n`
    message += `   Общий доход: ${formatPrice(totalRevenue)}`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error analyzing geographic data:', error)
    await ctx.reply('❌ Ошибка при географическом анализе')
  }
}

export async function handleExportAnalytics(ctx: any, params: any) {
  try {
    const { reportType = 'summary', period = 'month', format = 'csv' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.createdAt = { gte: monthAgo }
        break
      case 'quarter':
        const quarterAgo = new Date(now)
        quarterAgo.setMonth(quarterAgo.getMonth() - 3)
        dateFilter.createdAt = { gte: quarterAgo }
        break
    }
    
    let data: any[] = []
    let filename = 'analytics_export'
    let headers = ''
    
    if (reportType === 'orders') {
      // Экспорт детальных данных о заказах
      data = await prisma.order.findMany({
        where: dateFilter,
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      filename = 'orders_analytics'
      headers = 'ID,Дата,Клиент,Email,Сумма,Статус,Товаров,Город,Страна\n'
      
    } else if (reportType === 'products') {
      // Экспорт аналитики по товарам
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: dateFilter
        },
        include: {
          sku: {
            include: {
              product: true
            }
          },
          order: {
            select: {
              createdAt: true,
              status: true
            }
          }
        }
      })
      
      // Группируем по товарам
      const productStats = new Map<string, any>()
      
      for (const item of orderItems) {
        if (!['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(item.order.status)) continue
        
        const productId = item.sku.productId
        const existing = productStats.get(productId) || {
          name: item.sku.product.name,
          category: item.sku.product.categoryId,
          revenue: 0,
          quantity: 0,
          orders: 0
        }
        
        productStats.set(productId, {
          ...existing,
          revenue: existing.revenue + (item.price * item.quantity),
          quantity: existing.quantity + item.quantity,
          orders: existing.orders + 1
        })
      }
      
      data = Array.from(productStats.values())
      filename = 'products_analytics'
      headers = 'Название,Категория,Доход,Продано,Заказов,Средняя цена\n'
      
    } else {
      // Общая сводка
      const orders = await prisma.order.findMany({
        where: dateFilter,
        select: {
          createdAt: true,
          total: true,
          status: true,
          shippingCountry: true,
          shippingCity: true
        }
      })
      
      // Формируем сводку по дням
      const dailyStats = new Map<string, any>()
      
      for (const order of orders) {
        const date = order.createdAt.toISOString().split('T')[0]
        const existing = dailyStats.get(date) || {
          date,
          orders: 0,
          revenue: 0,
          paid_orders: 0,
          cancelled_orders: 0
        }
        
        dailyStats.set(date, {
          ...existing,
          orders: existing.orders + 1,
          revenue: existing.revenue + order.total,
          paid_orders: existing.paid_orders + (['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 1 : 0),
          cancelled_orders: existing.cancelled_orders + (order.status === 'CANCELLED' ? 1 : 0)
        })
      }
      
      data = Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date))
      filename = 'daily_summary'
      headers = 'Дата,Заказов,Доход,Оплачено,Отменено,Конверсия\n'
    }
    
    if (data.length === 0) {
      await ctx.reply('❌ Нет данных для экспорта')
      return
    }
    
    // Формируем CSV
    let csv = headers
    
    for (const item of data) {
      if (reportType === 'orders') {
        const itemsCount = item.items?.length || 0
        csv += `"${item.id}","${item.createdAt.toISOString().split('T')[0]}","${item.shippingName}","${item.shippingEmail}","${item.total}","${item.status}","${itemsCount}","${item.shippingCity || ''}","${item.shippingCountry || ''}"\n`
      } else if (reportType === 'products') {
        const avgPrice = item.quantity > 0 ? (item.revenue / item.quantity).toFixed(2) : '0'
        csv += `"${item.name}","${item.category}","${item.revenue}","${item.quantity}","${item.orders}","${avgPrice}"\n`
      } else {
        const conversion = item.orders > 0 ? (item.paid_orders / item.orders * 100).toFixed(1) : '0'
        csv += `"${item.date}","${item.orders}","${item.revenue}","${item.paid_orders}","${item.cancelled_orders}","${conversion}%"\n`
      }
    }
    
    // Отправляем как документ
    await ctx.replyWithDocument(
      Buffer.from(csv, 'utf-8'),
      {
        filename: `${filename}_${period}_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📄 Аналитика ${reportType} за ${period} (${data.length} записей)`
      }
    )
  } catch (error) {
    console.error('Error exporting analytics:', error)
    await ctx.reply('❌ Ошибка при экспорте аналитики')
  }
}

export async function handleComparePerformance(ctx: any, params: any) {
  try {
    const { metric = 'revenue', period1 = 'month', period2 = 'previous_month' } = params
    
    const now = new Date()
    
    // Первый период
    let dateFilter1: any = {}
    let periodName1 = period1
    
    switch (period1) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter1.createdAt = { gte: weekAgo }
        periodName1 = 'последняя неделя'
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter1.createdAt = { gte: monthAgo }
        periodName1 = 'последний месяц'
        break
    }
    
    // Второй период
    let dateFilter2: any = {}
    let periodName2 = period2
    
    if (period2 === 'previous_month') {
      const twoMonthsAgo = new Date(now)
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      
      dateFilter2.createdAt = { gte: twoMonthsAgo, lt: oneMonthAgo }
      periodName2 = 'предыдущий месяц'
      
    } else if (period2 === 'previous_week') {
      const twoWeeksAgo = new Date(now)
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const oneWeekAgo = new Date(now)
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      dateFilter2.createdAt = { gte: twoWeeksAgo, lt: oneWeekAgo }
      periodName2 = 'предыдущая неделя'
    }
    
    // Получаем данные для обоих периодов
    const [period1Data, period2Data] = await Promise.all([
      prisma.order.findMany({
        where: {
          ...dateFilter1,
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
        },
        select: { total: true, shippingEmail: true }
      }),
      prisma.order.findMany({
        where: {
          ...dateFilter2,
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
        },
        select: { total: true, shippingEmail: true }
      })
    ])
    
    // Анализируем метрики
    const stats1 = {
      orders: period1Data.length,
      revenue: period1Data.reduce((sum, order) => sum + order.total, 0),
      customers: new Set(period1Data.map(order => order.shippingEmail)).size
    }
    
    const stats2 = {
      orders: period2Data.length,
      revenue: period2Data.reduce((sum, order) => sum + order.total, 0),
      customers: new Set(period2Data.map(order => order.shippingEmail)).size
    }
    
    stats1.aov = stats1.orders > 0 ? stats1.revenue / stats1.orders : 0
    stats2.aov = stats2.orders > 0 ? stats2.revenue / stats2.orders : 0
    
    // Вычисляем изменения
    const revenueChange = stats2.revenue > 0 ? ((stats1.revenue - stats2.revenue) / stats2.revenue * 100) : 0
    const ordersChange = stats2.orders > 0 ? ((stats1.orders - stats2.orders) / stats2.orders * 100) : 0
    const customersChange = stats2.customers > 0 ? ((stats1.customers - stats2.customers) / stats2.customers * 100) : 0
    const aovChange = stats2.aov > 0 ? ((stats1.aov - stats2.aov) / stats2.aov * 100) : 0
    
    let message = `🔄 *Сравнение перформанса:*\\n\\n`
    
    message += `📅 *${escapeMarkdownV2(periodName1)} vs ${escapeMarkdownV2(periodName2)}:*\\n\\n`
    
    const revenueEmoji = revenueChange >= 0 ? '⬆️' : '⬇️'
    const ordersEmoji = ordersChange >= 0 ? '⬆️' : '⬇️'
    const customersEmoji = customersChange >= 0 ? '⬆️' : '⬇️'
    const aovEmoji = aovChange >= 0 ? '⬆️' : '⬇️'
    
    message += `💰 *Доход:*\\n`
    message += `   Текущий: ${formatPrice(stats1.revenue)}\\n`
    message += `   Предыдущий: ${formatPrice(stats2.revenue)}\\n`
    message += `   ${revenueEmoji} Изменение: ${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%\\n\\n`
    
    message += `📋 *Заказы:*\\n`
    message += `   Текущие: ${stats1.orders}\\n`
    message += `   Предыдущие: ${stats2.orders}\\n`
    message += `   ${ordersEmoji} Изменение: ${ordersChange >= 0 ? '+' : ''}${ordersChange.toFixed(1)}%\\n\\n`
    
    message += `👥 *Клиенты:*\\n`
    message += `   Текущие: ${stats1.customers}\\n`
    message += `   Предыдущие: ${stats2.customers}\\n`
    message += `   ${customersEmoji} Изменение: ${customersChange >= 0 ? '+' : ''}${customersChange.toFixed(1)}%\\n\\n`
    
    message += `💵 *Средний чек:*\\n`
    message += `   Текущий: ${formatPrice(stats1.aov)}\\n`
    message += `   Предыдущий: ${formatPrice(stats2.aov)}\\n`
    message += `   ${aovEmoji} Изменение: ${aovChange >= 0 ? '+' : ''}${aovChange.toFixed(1)}%\\n\\n`
    
    // Выводы
    message += `📈 *Выводы:*\\n`
    
    if (revenueChange > 10) {
      message += `   ✅ Отличный рост дохода \\(${revenueChange.toFixed(1)}%\\)\\n`
    } else if (revenueChange < -10) {
      message += `   ⚠️ Значительное снижение дохода \\(${revenueChange.toFixed(1)}%\\)\\n`
    }
    
    if (aovChange > 5) {
      message += `   ✅ Средний чек растет \\(${aovChange.toFixed(1)}%\\)\\n`
    } else if (aovChange < -5) {
      message += `   ⚠️ Снижение среднего чека \\(${aovChange.toFixed(1)}%\\)\\n`
    }
    
    if (customersChange > 0) {
      message += `   ✅ Привлечение новых клиентов \\(+${customersChange.toFixed(1)}%\\)`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error comparing performance:', error)
    await ctx.reply('❌ Ошибка при сравнении перформанса')
  }
}