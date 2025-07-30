import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from '../utils'

// === УПРАВЛЕНИЕ ДОСТАВКОЙ ===
// ВАЖНО: Эти функции требуют создания таблицы Delivery в базе данных!
// Таблица Delivery отсутствует в текущей схеме Prisma

export async function handleCreateDelivery(ctx: any, params: any) {
  try {
    const { orderId, method, cost, trackingNumber, estimatedDelivery } = params
    
    if (!orderId || !method) {
      await ctx.reply('❌ Укажите ID заказа и способ доставки')
      return
    }
    
    // Проверяем, существует ли заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply('❌ Заказ не найден')
      return
    }
    
    // Создаем запись о доставке
    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        method,
        cost: cost || 0,
        trackingNumber: trackingNumber || '',
        status: 'PENDING',
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null
      }
    })
    
    // Обновляем статус заказа
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' }
    })
    
    await ctx.reply(
      `✅ Доставка создана!\n\n` +
      `🚚 Способ: ${escapeMarkdownV2(method)}\n` +
      `📦 Заказ: #${escapeMarkdownV2(orderId)}\n` +
      `💰 Стоимость: ${formatPrice(cost || 0)}\n` +
      `${trackingNumber ? `📍 Трек-номер: \`${escapeMarkdownV2(trackingNumber)}\`\n` : ''}` +
      `🆔 ID доставки: \`${escapeMarkdownV2(delivery.id)}\``,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error creating delivery:', error)
    await ctx.reply('❌ Ошибка при создании доставки')
  }
}

export async function handleUpdateDeliveryStatus(ctx: any, params: any) {
  try {
    const { deliveryId, status, location } = params
    
    if (!deliveryId || !status) {
      await ctx.reply('❌ Укажите ID доставки и новый статус')
      return
    }
    
    const validStatuses = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED']
    
    if (!validStatuses.includes(status.toUpperCase())) {
      await ctx.reply(`❌ Неверный статус. Доступные: ${validStatuses.join(', ')}`)
      return
    }
    
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { 
        status: status.toUpperCase(),
        currentLocation: location || null,
        deliveredAt: status.toUpperCase() === 'DELIVERED' ? new Date() : null
      },
      include: { order: true }
    })
    
    // Обновляем статус заказа при доставке
    if (status.toUpperCase() === 'DELIVERED') {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' }
      })
    }
    
    const statusEmoji = {
      'PENDING': '⏳',
      'IN_TRANSIT': '🚚',
      'DELIVERED': '✅',
      'FAILED': '❌',
      'RETURNED': '🔄'
    }[status.toUpperCase()] || '❓'
    
    await ctx.reply(
      `${statusEmoji} Статус доставки обновлен!\n\n` +
      `📦 Заказ: #${escapeMarkdownV2(delivery.orderId)}\n` +
      `🚚 Способ: ${escapeMarkdownV2(delivery.method)}\n` +
      `📍 Статус: ${escapeMarkdownV2(status.toUpperCase())}\n` +
      `${location ? `🗺 Местоположение: ${escapeMarkdownV2(location)}\n` : ''}` +
      `${delivery.trackingNumber ? `📍 Трек: \`${escapeMarkdownV2(delivery.trackingNumber)}\`\n` : ''}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error updating delivery status:', error)
    await ctx.reply('❌ Ошибка при обновлении статуса доставки')
  }
}

export async function handleTrackDelivery(ctx: any, params: any) {
  try {
    const { trackingNumber, orderId } = params
    
    if (!trackingNumber && !orderId) {
      await ctx.reply('❌ Укажите трек-номер или ID заказа')
      return
    }
    
    let where: any = {}
    if (trackingNumber) {
      where.trackingNumber = trackingNumber
    } else if (orderId) {
      where.orderId = orderId
    }
    
    const delivery = await prisma.delivery.findFirst({
      where,
      include: {
        order: {
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
          }
        }
      }
    })
    
    if (!delivery) {
      await ctx.reply('❌ Доставка не найдена')
      return
    }
    
    const statusEmoji = {
      'PENDING': '⏳',
      'IN_TRANSIT': '🚚',
      'DELIVERED': '✅',
      'FAILED': '❌',
      'RETURNED': '🔄'
    }[delivery.status] || '❓'
    
    let message = `📦 *Отслеживание доставки*\n\n`
    message += `${statusEmoji} Статус: ${escapeMarkdownV2(delivery.status)}\n`
    message += `🚚 Способ: ${escapeMarkdownV2(delivery.method)}\n`
    message += `📍 Трек-номер: \`${escapeMarkdownV2(delivery.trackingNumber || 'Не указан')}\`\n`
    
    if (delivery.currentLocation) {
      message += `🗺 Текущее местоположение: ${escapeMarkdownV2(delivery.currentLocation)}\n`
    }
    
    if (delivery.estimatedDelivery) {
      message += `📅 Ожидаемая доставка: ${formatDate(delivery.estimatedDelivery)}\n`
    }
    
    if (delivery.deliveredAt) {
      message += `✅ Доставлено: ${formatDate(delivery.deliveredAt)}\n`
    }
    
    message += `\n📦 *Детали заказа #${escapeMarkdownV2(delivery.orderId)}:*\n`
    message += `👤 Клиент: ${escapeMarkdownV2(delivery.order.shippingName)}\n`
    message += `📞 Телефон: ${escapeMarkdownV2(delivery.order.shippingPhone)}\n`
    message += `🏠 Адрес: ${escapeMarkdownV2(delivery.order.shippingAddress)}\n`
    message += `💰 Сумма: ${formatPrice(delivery.order.total)}\n`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error tracking delivery:', error)
    await ctx.reply('❌ Ошибка при отслеживании доставки')
  }
}

export async function handleViewDeliveries(ctx: any, params: any) {
  try {
    const { status, method, date } = params
    
    let where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }
    if (method) {
      where.method = method
    }
    if (date) {
      const targetDate = new Date(date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      where.createdAt = {
        gte: targetDate,
        lt: nextDay
      }
    }
    
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: true
      },
      orderBy: { createdAt: 'desc' },
      take: 15
    })
    
    if (deliveries.length === 0) {
      await ctx.reply('📭 Доставок не найдено')
      return
    }
    
    let message = `🚚 *Список доставок:*\n\n`
    
    for (const delivery of deliveries) {
      const statusEmoji = {
        'PENDING': '⏳',
        'IN_TRANSIT': '🚚',
        'DELIVERED': '✅',
        'FAILED': '❌',
        'RETURNED': '🔄'
      }[delivery.status] || '❓'
      
      message += `${statusEmoji} *${escapeMarkdownV2(delivery.method)}*\n`
      message += `📦 Заказ: #${escapeMarkdownV2(delivery.orderId)}\n`
      message += `👤 ${escapeMarkdownV2(delivery.order.shippingName)}\n`
      message += `💰 ${formatPrice(delivery.cost)}\n`
      if (delivery.trackingNumber) {
        message += `📍 Трек: \`${escapeMarkdownV2(delivery.trackingNumber)}\`\n`
      }
      message += `📅 ${formatDate(delivery.createdAt)}\n\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing deliveries:', error)
    await ctx.reply('❌ Ошибка при просмотре доставок')
  }
}

export async function handleCalculateDeliveryCost(ctx: any, params: any) {
  try {
    const { method, weight, city, country } = params
    
    if (!method || !weight || !city) {
      await ctx.reply('❌ Укажите способ доставки, вес и город')
      return
    }
    
    // Простая логика расчета стоимости доставки
    let baseCost = 0
    let weightMultiplier = 1
    
    switch (method.toLowerCase()) {
      case 'nova_poshta':
        baseCost = 50
        weightMultiplier = weight > 1 ? weight * 10 : 0
        break
      case 'ukrposhta':
        baseCost = 30
        weightMultiplier = weight > 1 ? weight * 8 : 0
        break
      case 'courier':
        baseCost = 100
        weightMultiplier = weight > 2 ? weight * 15 : 0
        break
      case 'pickup':
        baseCost = 0
        weightMultiplier = 0
        break
      default:
        baseCost = 60
        weightMultiplier = weight * 12
    }
    
    // Коэффициент для международной доставки
    const internationalMultiplier = (country && country.toLowerCase() !== 'ukraine') ? 3 : 1
    
    const totalCost = (baseCost + weightMultiplier) * internationalMultiplier
    
    let message = `📊 *Расчет стоимости доставки*\n\n`
    message += `🚚 Способ: ${escapeMarkdownV2(method)}\n`
    message += `⚖️ Вес: ${weight} кг\n`
    message += `🏠 Город: ${escapeMarkdownV2(city)}\n`
    if (country) {
      message += `🌍 Страна: ${escapeMarkdownV2(country)}\n`
    }
    message += `\n💰 *Стоимость: ${formatPrice(totalCost)}*\n\n`
    
    message += `📋 *Детали расчета:*\n`
    message += `• Базовая стоимость: ${formatPrice(baseCost)}\n`
    if (weightMultiplier > 0) {
      message += `• За вес: ${formatPrice(weightMultiplier)}\n`
    }
    if (internationalMultiplier > 1) {
      message += `• Международная доставка: x${internationalMultiplier}\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error calculating delivery cost:', error)
    await ctx.reply('❌ Ошибка при расчете стоимости доставки')
  }
}

export async function handleDeliveryStatistics(ctx: any, params: any) {
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
      case 'year':
        const yearAgo = new Date(now)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        dateFilter.createdAt = { gte: yearAgo }
        break
    }
    
    // Общее количество доставок
    const totalDeliveries = await prisma.delivery.count({ where: dateFilter })
    
    // Статистика по статусам
    const statusStats = await prisma.delivery.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { status: true }
    })
    
    // Статистика по способам доставки
    const methodStats = await prisma.delivery.groupBy({
      by: ['method'],
      where: dateFilter,
      _count: { method: true },
      _sum: { cost: true }
    })
    
    // Среднее время доставки
    const deliveredOrders = await prisma.delivery.findMany({
      where: {
        ...dateFilter,
        status: 'DELIVERED',
        deliveredAt: { not: null }
      },
      select: {
        createdAt: true,
        deliveredAt: true
      }
    })
    
    const avgDeliveryTime = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum, delivery) => {
          const days = Math.ceil((delivery.deliveredAt!.getTime() - delivery.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0) / deliveredOrders.length
      : 0
    
    let message = `📊 *Статистика доставок (${period}):*\n\n`
    message += `📦 Всего доставок: ${totalDeliveries}\n`
    message += `⏱ Среднее время: ${avgDeliveryTime.toFixed(1)} дней\n\n`
    
    message += `📈 *По статусам:*\n`
    for (const stat of statusStats) {
      const emoji = {
        'PENDING': '⏳',
        'IN_TRANSIT': '🚚',
        'DELIVERED': '✅',
        'FAILED': '❌',
        'RETURNED': '🔄'
      }[stat.status] || '❓'
      
      const percentage = totalDeliveries > 0 ? ((stat._count.status / totalDeliveries) * 100).toFixed(1) : 0
      message += `${emoji} ${stat.status}: ${stat._count.status} (${percentage}%)\n`
    }
    
    message += `\n🚚 *По способам доставки:*\n`
    for (const stat of methodStats) {
      message += `• ${escapeMarkdownV2(stat.method)}: ${stat._count.method} шт. (${formatPrice(stat._sum.cost || 0)} общая стоимость)\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting delivery statistics:', error)
    await ctx.reply('❌ Ошибка при получении статистики доставок')
  }
}

export async function handleBulkUpdateDeliveries(ctx: any, params: any) {
  try {
    const { deliveryIds, field, value } = params
    
    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0 || !field || value === undefined) {
      await ctx.reply('❌ Укажите массив ID доставок, поле и значение')
      return
    }
    
    const updateData: any = {}
    updateData[field] = value
    
    // Специальная обработка для статуса доставки
    if (field === 'status' && value === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }
    
    const result = await prisma.delivery.updateMany({
      where: { id: { in: deliveryIds } },
      data: updateData
    })
    
    await ctx.reply(
      `✅ Обновлено доставок: ${result.count}\n` +
      `📝 ${escapeMarkdownV2(field)}: ${escapeMarkdownV2(String(value))}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error bulk updating deliveries:', error)
    await ctx.reply('❌ Ошибка при массовом обновлении доставок')
  }
}

export async function handleExportDeliveries(ctx: any, params: any) {
  try {
    const { format = 'csv', status } = params
    
    let where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }
    
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (deliveries.length === 0) {
      await ctx.reply('📭 Нет доставок для экспорта')
      return
    }
    
    // Формируем CSV
    let csv = 'ID,Заказ,Клиент,Способ,Статус,Стоимость,Трек-номер,Адрес,Дата создания,Дата доставки\n'
    
    for (const delivery of deliveries) {
      csv += `"${delivery.id}","${delivery.orderId}","${delivery.order.shippingName}","${delivery.method}","${delivery.status}",${delivery.cost},"${delivery.trackingNumber || ''}","${delivery.order.shippingAddress}","${delivery.createdAt.toISOString().split('T')[0]}","${delivery.deliveredAt ? delivery.deliveredAt.toISOString().split('T')[0] : ''}"\n`
    }
    
    // Отправляем как документ
    await ctx.replyWithDocument(
      Buffer.from(csv, 'utf-8'),
      {
        filename: `deliveries_export_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📊 Экспорт доставок (${deliveries.length} шт.)`
      }
    )
  } catch (error) {
    console.error('Error exporting deliveries:', error)
    await ctx.reply('❌ Ошибка при экспорте доставок')
  }
}

export async function handleScheduleDelivery(ctx: any, params: any) {
  try {
    const { orderId, scheduledDate, timeSlot, notes } = params
    
    if (!orderId || !scheduledDate) {
      await ctx.reply('❌ Укажите ID заказа и дату доставки')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply('❌ Заказ не найден')
      return
    }
    
    // Обновляем доставку с запланированной датой
    const delivery = await prisma.delivery.findFirst({
      where: { orderId }
    })
    
    if (!delivery) {
      await ctx.reply('❌ Доставка для этого заказа не найдена')
      return
    }
    
    const updatedDelivery = await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        estimatedDelivery: new Date(scheduledDate),
        notes: notes || null,
        status: 'PENDING'
      }
    })
    
    await ctx.reply(
      `📅 Доставка запланирована!\n\n` +
      `📦 Заказ: #${escapeMarkdownV2(orderId)}\n` +
      `🚚 Способ: ${escapeMarkdownV2(delivery.method)}\n` +
      `📅 Дата: ${formatDate(new Date(scheduledDate))}\n` +
      `${timeSlot ? `⏰ Время: ${escapeMarkdownV2(timeSlot)}\n` : ''}` +
      `${notes ? `📝 Заметки: ${escapeMarkdownV2(notes)}\n` : ''}` +
      `👤 Клиент: ${escapeMarkdownV2(order.shippingName)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error scheduling delivery:', error)
    await ctx.reply('❌ Ошибка при планировании доставки')
  }
}

export async function handleUpdateTrackingInfo(ctx: any, params: any) {
  try {
    const { deliveryId, trackingNumber, carrier, trackingUrl } = params
    
    if (!deliveryId || !trackingNumber) {
      await ctx.reply('❌ Укажите ID доставки и трек-номер')
      return
    }
    
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        trackingNumber,
        carrier: carrier || null,
        trackingUrl: trackingUrl || null
      },
      include: { order: true }
    })
    
    await ctx.reply(
      `📍 Информация для отслеживания обновлена!\n\n` +
      `📦 Заказ: #${escapeMarkdownV2(delivery.orderId)}\n` +
      `👤 Клиент: ${escapeMarkdownV2(delivery.order.shippingName)}\n` +
      `📍 Трек-номер: \`${escapeMarkdownV2(trackingNumber)}\`\n` +
      `${carrier ? `🚚 Перевозчик: ${escapeMarkdownV2(carrier)}\n` : ''}` +
      `${trackingUrl ? `🔗 [Отследить посылку](${trackingUrl})\n` : ''}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error updating tracking info:', error)
    await ctx.reply('❌ Ошибка при обновлении информации отслеживания')
  }
}