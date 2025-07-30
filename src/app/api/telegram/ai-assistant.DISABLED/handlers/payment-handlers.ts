import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from '../utils'
import { westernbid } from '@/lib/westernbid'

// === УПРАВЛЕНИЕ ПЛАТЕЖАМИ ===
// ВАЖНО: Платежи обрабатываются через WesternBid!
// Информация о платежах хранится в таблице Order

export async function handleProcessPayment(ctx: any, params: any) {
  try {
    const { orderId, amount, method, transactionId } = params
    
    if (!orderId || !amount || !method) {
      await ctx.reply('❌ Укажите ID заказа, сумму и способ оплаты')
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
    
    // Обновляем информацию о платеже в заказе
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        paymentMethod: method.toUpperCase(),
        transactionId: transactionId || `TXN_${Date.now()}`,
        paidAt: new Date(),
        total: parseFloat(amount) // обновляем сумму, если нужно
      }
    })
    
    await ctx.reply(
      `✅ Платеж обработан!\n\n` +
      `💳 Способ: ${escapeMarkdownV2(method.toUpperCase())}\n` +
      `💰 Сумма: ${formatPrice(parseFloat(amount))}\n` +
      `📦 Заказ: #${escapeMarkdownV2(updatedOrder.orderNumber)}\n` +
      `🆔 ID транзакции: \`${escapeMarkdownV2(updatedOrder.transactionId!)}\`\n` +
      `📅 Дата: ${formatDate(updatedOrder.paidAt!)}\n` +
      `👤 Клиент: ${escapeMarkdownV2(order.shippingName)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error processing payment:', error)
    await ctx.reply('❌ Ошибка при обработке платежа')
  }
}

export async function handleRefundPayment(ctx: any, params: any) {
  try {
    const { orderId, amount, reason } = params
    
    if (!orderId) {
      await ctx.reply('❌ Укажите ID заказа для возврата')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply('❌ Заказ не найден')
      return
    }
    
    if (order.paymentStatus !== 'COMPLETED') {
      await ctx.reply('❌ Платеж не был завершен, возврат невозможен')
      return
    }
    
    const refundAmount = amount ? parseFloat(amount) : order.total
    
    if (refundAmount > order.total) {
      await ctx.reply('❌ Сумма возврата не может превышать сумму заказа')
      return
    }
    
    // Обновляем статус заказа на возвращенный
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refundAmount,
        refundReason: reason || 'Возврат по запросу',
        refundStatus: 'COMPLETED'
      }
    })
    
    await ctx.reply(
      `💸 Возврат выполнен!\n\n` +
      `💰 Сумма возврата: ${formatPrice(refundAmount)}\n` +
      `📦 Заказ: #${escapeMarkdownV2(updatedOrder.orderNumber)}\n` +
      `📋 Причина: ${escapeMarkdownV2(reason || 'Возврат по запросу')}\n` +
      `👤 Клиент: ${escapeMarkdownV2(order.shippingName)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error processing refund:', error)
    await ctx.reply('❌ Ошибка при обработке возврата')
  }
}

export async function handleViewPayments(ctx: any, params: any) {
  try {
    const { status, method, customerEmail } = params
    
    let where: any = {}
    if (status) {
      where.paymentStatus = status.toUpperCase()
    }
    if (method) {
      where.paymentMethod = method.toUpperCase()
    }
    if (customerEmail) {
      where.shippingEmail = customerEmail
    }
    // Показываем только оплаченные заказы
    where.paidAt = { not: null }
    
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 15
    })
    
    if (orders.length === 0) {
      await ctx.reply('📭 Платежей не найдено')
      return
    }
    
    let message = `💳 *Список платежей:*\n\n`
    
    for (const order of orders) {
      const statusEmoji = {
        'PENDING': '⏳',
        'COMPLETED': '✅',
        'FAILED': '❌',
        'REFUNDED': '💸',
        'CANCELLED': '🚫'
      }[order.paymentStatus] || '❓'
      
      message += `${statusEmoji} *${escapeMarkdownV2(order.paymentMethod || 'WesternBid')}*\n`
      message += `💰 ${formatPrice(order.total)}\n`
      message += `📦 Заказ: #${escapeMarkdownV2(order.orderNumber)}\n`
      message += `👤 ${escapeMarkdownV2(order.shippingName)}\n`
      if (order.transactionId) {
        message += `🆔 Транзакция: \`${escapeMarkdownV2(order.transactionId)}\`\n`
      }
      message += `📅 ${formatDate(order.paidAt!)}\n\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing payments:', error)
    await ctx.reply('❌ Ошибка при просмотре платежей')
  }
}

export async function handlePaymentStatistics(ctx: any, params: any) {
  try {
    const { period = 'month' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.paidAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.paidAt = { gte: monthAgo }
        break
      case 'year':
        const yearAgo = new Date(now)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        dateFilter.paidAt = { gte: yearAgo }
        break
    }
    
    // Общее количество и сумма платежей
    const totalStats = await prisma.order.aggregate({
      where: {
        ...dateFilter,
        paymentStatus: 'COMPLETED'
      },
      _count: { id: true },
      _sum: { total: true }
    })
    
    // Статистика по статусам
    const statusStats = await prisma.order.groupBy({
      by: ['paymentStatus'],
      where: {
        ...dateFilter,
        paidAt: { not: null }
      },
      _count: { paymentStatus: true },
      _sum: { total: true }
    })
    
    // Статистика по способам оплаты  
    const methodStats = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        ...dateFilter,
        paymentStatus: 'COMPLETED'
      },
      _count: { paymentMethod: true },
      _sum: { total: true }
    })
    
    // Средний чек
    const avgPayment = totalStats._count.id > 0 
      ? (totalStats._sum.total || 0) / totalStats._count.id 
      : 0
    
    let message = `💳 *Статистика платежей (${period}):*\n\n`
    message += `📊 Всего платежей: ${totalStats._count.id}\n`
    message += `💰 Общая сумма: ${formatPrice(totalStats._sum.total || 0)}\n`
    message += `💵 Средний чек: ${formatPrice(avgPayment)}\n\n`
    
    message += `📈 *По статусам:*\n`
    for (const stat of statusStats) {
      const emoji = {
        'PENDING': '⏳',
        'COMPLETED': '✅',
        'FAILED': '❌',
        'REFUNDED': '💸',
        'CANCELLED': '🚫'
      }[stat.paymentStatus] || '❓'
      
      const percentage = totalStats._count.id > 0 
        ? ((stat._count.paymentStatus / totalStats._count.id) * 100).toFixed(1) 
        : 0
      message += `${emoji} ${stat.paymentStatus}: ${stat._count.paymentStatus} (${percentage}%) - ${formatPrice(stat._sum.total || 0)}\n`
    }
    
    message += `\n💳 *По способам оплаты:*\n`
    for (const stat of methodStats) {
      const method = stat.paymentMethod || 'WesternBid'
      message += `• ${escapeMarkdownV2(method)}: ${stat._count.paymentMethod} шт. - ${formatPrice(stat._sum.total || 0)}\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting payment statistics:', error)
    await ctx.reply('❌ Ошибка при получении статистики платежей')
  }
}

export async function handleFailedPayments(ctx: any, params: any) {
  try {
    const { period = 'week' } = params
    
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case 'day':
        const dayAgo = new Date(now)
        dayAgo.setDate(dayAgo.getDate() - 1)
        dateFilter.createdAt = { gte: dayAgo }
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
    
    const failedOrders = await prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'FAILED'
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (failedOrders.length === 0) {
      await ctx.reply(`✅ Нет неудачных платежей за ${period}`)
      return
    }
    
    const totalFailedAmount = failedOrders.reduce((sum, order) => sum + order.total, 0)
    
    let message = `❌ *Неудачные платежи (${period}):*\n\n`
    message += `📊 Количество: ${failedOrders.length}\n`
    message += `💸 Потерянная сумма: ${formatPrice(totalFailedAmount)}\n\n`
    
    for (const order of failedOrders.slice(0, 10)) {
      message += `❌ ${formatPrice(order.total)} - ${escapeMarkdownV2(order.paymentMethod || 'WesternBid')}\n`
      message += `📦 Заказ: #${escapeMarkdownV2(order.orderNumber)}\n`
      message += `👤 ${escapeMarkdownV2(order.shippingName)}\n`
      message += `📅 ${formatDate(order.createdAt)}\n`
      if (order.failureReason) {
        message += `⚠️ Причина: ${escapeMarkdownV2(order.failureReason)}\n`
      }
      message += `\n`
    }
    
    if (failedOrders.length > 10) {
      message += `_И еще ${failedOrders.length - 10} платежей..._\n\n`
    }
    
    message += `💡 *Рекомендации:*\n`
    message += `• Связаться с клиентами для повторной оплаты\n`
    message += `• Проверить настройки WesternBid\n`
    message += `• Предложить альтернативные способы оплаты`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting failed payments:', error)
    await ctx.reply('❌ Ошибка при получении неудачных платежей')
  }
}

export async function handleUpdatePaymentStatus(ctx: any, params: any) {
  try {
    const { orderId, status, notes } = params
    
    if (!orderId || !status) {
      await ctx.reply('❌ Укажите ID заказа и новый статус')
      return
    }
    
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']
    
    if (!validStatuses.includes(status.toUpperCase())) {
      await ctx.reply(`❌ Неверный статус. Доступные: ${validStatuses.join(', ')}`)
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply('❌ Заказ не найден')
      return
    }
    
    // Обновляем статус платежа
    let updateData: any = {
      paymentStatus: status.toUpperCase()
    }
    
    // Обновляем статус заказа соответственно
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        updateData.status = 'CONFIRMED'
        updateData.paidAt = new Date()
        break
      case 'FAILED':
        updateData.status = 'CANCELLED'
        updateData.failureReason = notes || 'Платеж не прошел'
        break
      case 'REFUNDED':
        updateData.status = 'REFUNDED'
        updateData.refundedAt = new Date()
        updateData.refundReason = notes || 'Возврат средств'
        break
    }
    
    if (notes) {
      updateData.notes = notes
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    })
    
    const statusEmoji = {
      'PENDING': '⏳',
      'COMPLETED': '✅',
      'FAILED': '❌',
      'REFUNDED': '💸',
      'CANCELLED': '🚫'
    }[status.toUpperCase()] || '❓'
    
    await ctx.reply(
      `${statusEmoji} Статус платежа обновлен!\n\n` +
      `📦 Заказ: #${escapeMarkdownV2(updatedOrder.orderNumber)}\n` +
      `💳 Способ: ${escapeMarkdownV2(updatedOrder.paymentMethod || 'WesternBid')}\n` +
      `💰 Сумма: ${formatPrice(updatedOrder.total)}\n` +
      `📍 Новый статус: ${escapeMarkdownV2(status.toUpperCase())}\n` +
      `👤 Клиент: ${escapeMarkdownV2(updatedOrder.shippingName)}\n` +
      `${notes ? `📝 Заметки: ${escapeMarkdownV2(notes)}\n` : ''}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error updating payment status:', error)
    await ctx.reply('❌ Ошибка при обновлении статуса платежа')
  }
}

export async function handleExportPayments(ctx: any, params: any) {
  try {
    const { format = 'csv', status, method } = params
    
    let where: any = {
      paidAt: { not: null }
    }
    if (status) {
      where.paymentStatus = status.toUpperCase()
    }
    if (method) {
      where.paymentMethod = method.toUpperCase()
    }
    
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    
    if (orders.length === 0) {
      await ctx.reply('📭 Нет платежей для экспорта')
      return
    }
    
    // Формируем CSV
    let csv = 'ID,Заказ,Клиент,Email,Способ,Статус,Сумма,Транзакция,Дата создания,Дата оплаты\n'
    
    for (const order of orders) {
      csv += `"${order.id}","${order.orderNumber}","${order.shippingName}","${order.shippingEmail}","${order.paymentMethod || 'WesternBid'}","${order.paymentStatus}",${order.total},"${order.transactionId || ''}","${order.createdAt.toISOString().split('T')[0]}","${order.paidAt ? order.paidAt.toISOString().split('T')[0] : ''}"\n`
    }
    
    // Отправляем как документ
    await ctx.replyWithDocument(
      Buffer.from(csv, 'utf-8'),
      {
        filename: `payments_export_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📊 Экспорт платежей (${orders.length} шт.)`
      }
    )
  } catch (error) {
    console.error('Error exporting payments:', error)
    await ctx.reply('❌ Ошибка при экспорте платежей')
  }
}

export async function handleRecurringPayments(ctx: any, params: any) {
  try {
    await ctx.reply(
      `⚠️ *Функция регулярных платежей временно недоступна*\n\n` +
      `Для настройки регулярных платежей используйте WesternBid напрямую.`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error setting up recurring payment:', error)
    await ctx.reply('❌ Ошибка при настройке регулярного платежа')
  }
}

// Функция для создания платежа через WesternBid
export async function handleCreateWesternBidPayment(ctx: any, params: any) {
  try {
    const { orderId, returnUrl, cancelUrl } = params
    
    if (!orderId) {
      await ctx.reply('❌ Укажите ID заказа')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply('❌ Заказ не найден')
      return
    }
    
    if (order.paymentStatus === 'COMPLETED') {
      await ctx.reply('✅ Заказ уже оплачен')
      return
    }
    
    // Создаем платеж через WesternBid
    const paymentRequest = {
      orderId: order.orderNumber,
      amount: order.total,
      currency: order.currency || 'USD',
      description: `Заказ #${order.orderNumber}`,
      customerEmail: order.shippingEmail,
      customerName: order.shippingName,
      customerPhone: order.shippingPhone || undefined,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
      metadata: {
        orderId: order.id,
        telegramBotOrder: true
      }
    }
    
    const paymentResponse = await westernbid.createPayment(paymentRequest)
    
    if (paymentResponse.success && paymentResponse.paymentUrl) {
      // Сохраняем payment ID и session ID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: paymentResponse.paymentId,
          sessionId: paymentResponse.sessionId
        }
      })
      
      await ctx.reply(
        `💳 *Платежная ссылка создана!*\n\n` +
        `📦 Заказ: #${escapeMarkdownV2(order.orderNumber)}\n` +
        `💰 Сумма: ${formatPrice(order.total)}\n` +
        `👤 Клиент: ${escapeMarkdownV2(order.shippingName)}\n\n` +
        `🔗 [Перейти к оплате](${paymentResponse.paymentUrl})`,
        { parse_mode: 'MarkdownV2' }
      )
    } else {
      await ctx.reply(
        `❌ Ошибка создания платежа: ${paymentResponse.error || 'Неизвестная ошибка'}`
      )
    }
  } catch (error) {
    console.error('Error creating WesternBid payment:', error)
    await ctx.reply('❌ Ошибка при создании платежной ссылки')
  }
}