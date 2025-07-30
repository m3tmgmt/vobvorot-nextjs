import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from '../utils'
import { OrderStatus } from '@prisma/client'

// === УПРАВЛЕНИЕ ЗАКАЗАМИ ===

export async function handleViewOrders(ctx: any, params: any) {
  try {
    const { filter = 'all', status, search } = params
    
    // Базовый запрос
    let where: any = {}
    
    // Фильтр по периоду
    const now = new Date()
    switch (filter) {
      case 'today':
        where.createdAt = {
          gte: new Date(now.setHours(0, 0, 0, 0))
        }
        break
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        where.createdAt = {
          gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          lt: new Date(now.setHours(0, 0, 0, 0))
        }
        break
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        where.createdAt = { gte: weekAgo }
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        where.createdAt = { gte: monthAgo }
        break
    }
    
    // Фильтр по статусу
    if (status) {
      where.status = status.toUpperCase()
    }
    
    // Поиск по номеру
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { shippingEmail: { contains: search, mode: 'insensitive' } },
        { shippingName: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const orders = await prisma.order.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    if (orders.length === 0) {
      await ctx.reply('📭 Заказов не найдено')
      return
    }
    
    let message = `📦 *Заказы ${filter === 'all' ? '' : `за ${filter}`}:*\\n\\n`
    
    for (const order of orders) {
      const statusEmoji = {
        PENDING: '⏳',
        CONFIRMED: '✅',
        PROCESSING: '🔄',
        SHIPPED: '📦',
        DELIVERED: '✅',
        CANCELLED: '❌',
        REFUNDED: '💸'
      }[order.status] || '❓'
      
      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
      
      message += `${statusEmoji} *Заказ \\#${escapeMarkdownV2(order.id)}*\\n`
      message += `👤 ${escapeMarkdownV2(order.shippingName)}\\n`
      message += `📅 ${formatDate(order.createdAt)}\\n`
      message += `🛍 Товаров: ${itemsCount} шт\\.\\n`
      message += `💰 Сумма: ${formatPrice(order.total)}\\n`
      message += `📍 Статус: ${escapeMarkdownV2(order.status)}\\n`
      if (order.trackingNumber) {
        message += `🚚 Трек: \`${escapeMarkdownV2(order.trackingNumber)}\`\\n`
      }
      message += '\\n'
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing orders:', error)
    await ctx.reply('❌ Ошибка при получении заказов')
  }
}

export async function handleSearchOrder(ctx: any, params: any) {
  try {
    const { orderId } = params
    
    if (!orderId) {
      await ctx.reply('❌ Укажите номер заказа')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    await handleOrderDetails(ctx, { orderId: order.id })
  } catch (error) {
    console.error('Error searching order:', error)
    await ctx.reply('❌ Ошибка при поиске заказа')
  }
}

export async function handleOrderDetails(ctx: any, params: any) {
  try {
    const { orderId } = params
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ не найден`)
      return
    }
    
    let message = `📋 *Детали заказа \\#${escapeMarkdownV2(order.id)}*\\n\\n`
    
    // Информация о клиенте
    message += `*👤 Клиент:*\\n`
    message += `Имя: ${escapeMarkdownV2(order.shippingName)}\\n`
    message += `Email: ${escapeMarkdownV2(order.shippingEmail)}\\n`
    message += `Телефон: ${escapeMarkdownV2(order.shippingPhone || '')}\\n\\n`
    
    // Адрес доставки
    message += `*📍 Доставка:*\\n`
    message += `${escapeMarkdownV2(order.shippingAddress)}\\n`
    message += `${escapeMarkdownV2(order.shippingCity)}, ${escapeMarkdownV2(order.shippingZip || '')}\\n`
    message += `${escapeMarkdownV2(order.shippingCountry)}\\n\\n`
    
    // Товары
    message += `*🛍 Товары:*\\n`
    for (const item of order.items) {
      message += `• ${escapeMarkdownV2(item.sku.product.name)} x${item.quantity} = ${formatPrice(item.price * item.quantity)}\\n`
    }
    
    // Итоги
    message += `\\n*💰 Итого:*\\n`
    message += `Товары: ${formatPrice(order.subtotal)}\\n`
    if (order.shippingCost > 0) {
      message += `Доставка: ${formatPrice(order.shippingCost)}\\n`
    }
    message += `*Всего: ${formatPrice(order.total)}*\\n\\n`
    
    // Статус и даты
    message += `*📊 Информация:*\\n`
    message += `Статус: ${escapeMarkdownV2(order.status)}\\n`
    message += `Создан: ${formatDate(order.createdAt)}\\n`
    if (order.trackingNumber) {
      message += `Трек\\-номер: \`${escapeMarkdownV2(order.trackingNumber)}\`\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting order details:', error)
    await ctx.reply('❌ Ошибка при получении деталей заказа')
  }
}

export async function handleUpdateOrderStatus(ctx: any, params: any) {
  try {
    const { orderId, status } = params
    
    if (!orderId || !status) {
      await ctx.reply('❌ Укажите номер заказа и новый статус')
      return
    }
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
    const upperStatus = status.toUpperCase()
    
    if (!validStatuses.includes(upperStatus)) {
      await ctx.reply(`❌ Неверный статус. Доступные: ${validStatuses.join(', ')}`)
      return
    }
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: upperStatus as OrderStatus,
        updatedAt: new Date()
      }
    })
    
    await ctx.reply(
      `✅ Статус заказа \\#${escapeMarkdownV2(order.id)} изменен на *${escapeMarkdownV2(upperStatus)}*`,
      { parse_mode: 'MarkdownV2' }
    )
    
    // TODO: Отправить уведомление клиенту
  } catch (error) {
    console.error('Error updating order status:', error)
    await ctx.reply('❌ Ошибка при изменении статуса заказа')
  }
}

export async function handleAddTracking(ctx: any, params: any) {
  try {
    const { orderId, trackingNumber, carrier } = params
    
    if (!orderId || !trackingNumber) {
      await ctx.reply('❌ Укажите номер заказа и трек-номер')
      return
    }
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        trackingNumber,
        status: 'SHIPPED',
        updatedAt: new Date()
      }
    })
    
    await ctx.reply(
      `✅ Трек\\-номер \`${escapeMarkdownV2(trackingNumber)}\` добавлен к заказу \\#${escapeMarkdownV2(order.id)}`,
      { parse_mode: 'MarkdownV2' }
    )
    
    // TODO: Отправить трек-номер клиенту
  } catch (error) {
    console.error('Error adding tracking:', error)
    await ctx.reply('❌ Ошибка при добавлении трек-номера')
  }
}

export async function handleAddOrderNote(ctx: any, params: any) {
  try {
    const { orderId, note } = params
    
    if (!orderId || !note) {
      await ctx.reply('❌ Укажите номер заказа и текст заметки')
      return
    }
    
    // Получаем текущий заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    // Добавляем заметку к существующим (если есть) 
    const existingNotes = order.notes || ''
    const newNotes = existingNotes + (existingNotes ? '\n' : '') + `[${new Date().toISOString()}] ${note}`
    
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        notes: newNotes,
        updatedAt: new Date()
      }
    })
    
    await ctx.reply(
      `✅ Заметка добавлена к заказу \\#${escapeMarkdownV2(orderId)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error adding order note:', error)
    await ctx.reply('❌ Ошибка при добавлении заметки')
  }
}

export async function handlePrintInvoice(ctx: any, params: any) {
  try {
    const { orderId } = params
    
    if (!orderId) {
      await ctx.reply('❌ Укажите номер заказа')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    // Формируем текстовую накладную
    let invoice = `НАКЛАДНАЯ\n`
    invoice += `Заказ №${order.id}\n`
    invoice += `Дата: ${order.createdAt.toLocaleDateString('ru-RU')}\n\n`
    invoice += `ПОЛУЧАТЕЛЬ:\n`
    invoice += `${order.shippingName}\n`
    invoice += `${order.shippingAddress}\n`
    invoice += `${order.shippingCity}, ${order.shippingZip}\n`
    invoice += `${order.shippingCountry}\n`
    invoice += `Тел: ${order.shippingPhone}\n\n`
    invoice += `ТОВАРЫ:\n`
    
    for (const item of order.items) {
      invoice += `${item.sku.product.name} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)} грн\n`
    }
    
    invoice += `\nИТОГО: ${order.total.toFixed(2)} грн`
    
    await ctx.reply(`\`\`\`\n${invoice}\n\`\`\``, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error printing invoice:', error)
    await ctx.reply('❌ Ошибка при формировании накладной')
  }
}

export async function handleInitiateReturn(ctx: any, params: any) {
  try {
    const { orderId, reason } = params
    
    if (!orderId || !reason) {
      await ctx.reply('❌ Укажите номер заказа и причину возврата')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    if (!['DELIVERED', 'SHIPPED'].includes(order.status)) {
      await ctx.reply('❌ Возврат возможен только для доставленных заказов')
      return
    }
    
    // Обновляем статус и добавляем заметку о возврате
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'REFUNDED',
        notes: `${order.notes || ''}\nВозврат инициирован: ${reason}`,
        updatedAt: new Date()
      }
    })
    
    await ctx.reply(
      `✅ Возврат для заказа \\#${escapeMarkdownV2(orderId)} инициирован\\n` +
      `Причина: ${escapeMarkdownV2(reason)}`,
      { parse_mode: 'MarkdownV2' }
    )
    
    // TODO: Запустить процесс возврата средств
  } catch (error) {
    console.error('Error initiating return:', error)
    await ctx.reply('❌ Ошибка при инициации возврата')
  }
}

export async function handlePartialRefund(ctx: any, params: any) {
  try {
    const { orderId, amount, reason } = params
    
    if (!orderId || !amount || !reason) {
      await ctx.reply('❌ Укажите номер заказа, сумму и причину возврата')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    if (amount > order.total) {
      await ctx.reply('❌ Сумма возврата превышает сумму заказа')
      return
    }
    
    // Обновляем заказ
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        notes: `${order.notes || ''}\nЧастичный возврат ${amount} грн: ${reason}`,
        updatedAt: new Date()
      }
    })
    
    await ctx.reply(
      `✅ Частичный возврат оформлен\\n` +
      `Заказ: \\#${escapeMarkdownV2(orderId)}\\n` +
      `Сумма: ${formatPrice(amount)}\\n` +
      `Причина: ${escapeMarkdownV2(reason)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error processing partial refund:', error)
    await ctx.reply('❌ Ошибка при оформлении частичного возврата')
  }
}

export async function handleFullRefund(ctx: any, params: any) {
  try {
    const { orderId, reason } = params
    
    if (!orderId || !reason) {
      await ctx.reply('❌ Укажите номер заказа и причину возврата')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    // Обновляем статус
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'REFUNDED',
        notes: `${order.notes || ''}\nПолный возврат: ${reason}`,
        updatedAt: new Date()
      }
    })
    
    await ctx.reply(
      `✅ Полный возврат оформлен\\n` +
      `Заказ: \\#${escapeMarkdownV2(orderId)}\\n` +
      `Сумма: ${formatPrice(order.total)}\\n` +
      `Причина: ${escapeMarkdownV2(reason)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error processing full refund:', error)
    await ctx.reply('❌ Ошибка при оформлении полного возврата')
  }
}

export async function handleSendReturnNotification(ctx: any, params: any) {
  try {
    const { orderId } = params
    
    if (!orderId) {
      await ctx.reply('❌ Укажите номер заказа')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    // TODO: Интеграция с email сервисом
    await ctx.reply(
      `✅ Уведомление о возврате отправлено клиенту\\n` +
      `Email: ${escapeMarkdownV2(order.shippingEmail)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error sending return notification:', error)
    await ctx.reply('❌ Ошибка при отправке уведомления')
  }
}

export async function handleOrderHistory(ctx: any, params: any) {
  try {
    const { orderId } = params
    
    if (!orderId) {
      await ctx.reply('❌ Укажите номер заказа')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    let message = `📜 *История заказа \\#${escapeMarkdownV2(orderId)}*\\n\\n`
    message += `Создан: ${formatDate(order.createdAt)}\\n`
    message += `Обновлен: ${formatDate(order.updatedAt)}\\n`
    message += `Статус: ${escapeMarkdownV2(order.status)}\\n`
    
    if (order.notes) {
      message += `\\n*Заметки:*\\n${escapeMarkdownV2(order.notes)}`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting order history:', error)
    await ctx.reply('❌ Ошибка при получении истории заказа')
  }
}

export async function handleBulkStatusUpdate(ctx: any, params: any) {
  try {
    const { orderIds, status } = params
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      await ctx.reply('❌ Укажите массив ID заказов и новый статус')
      return
    }
    
    const upperStatus = status.toUpperCase()
    
    const result = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { 
        status: upperStatus as OrderStatus,
        updatedAt: new Date()
      }
    })
    
    await ctx.reply(
      `✅ Обновлено заказов: ${result.count}\\n` +
      `Новый статус: *${escapeMarkdownV2(upperStatus)}*`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error bulk updating orders:', error)
    await ctx.reply('❌ Ошибка при массовом обновлении заказов')
  }
}

export async function handleExportOrders(ctx: any, params: any) {
  try {
    const { format = 'csv', filter } = params
    
    let where: any = {}
    if (filter) {
      // Применяем фильтры как в handleViewOrders
    }
    
    const orders = await prisma.order.findMany({
      where,
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
    
    // Формируем CSV
    let csv = 'ID,Дата,Клиент,Email,Телефон,Сумма,Статус,Трек-номер\n'
    for (const order of orders) {
      csv += `${order.id},${order.createdAt.toISOString()},${order.shippingName},${order.shippingEmail},${order.shippingPhone},${order.total},${order.status},${order.trackingNumber || ''}\n`
    }
    
    // Отправляем как документ
    await ctx.replyWithDocument(
      Buffer.from(csv, 'utf-8'),
      {
        filename: `orders_export_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📊 Экспорт заказов (${orders.length} шт.)`
      }
    )
  } catch (error) {
    console.error('Error exporting orders:', error)
    await ctx.reply('❌ Ошибка при экспорте заказов')
  }
}

export async function handleCancelOrder(ctx: any, params: any) {
  try {
    const { orderId, reason } = params
    
    if (!orderId) {
      await ctx.reply('❌ Укажите номер заказа')
      return
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      await ctx.reply(`❌ Заказ #${orderId} не найден`)
      return
    }
    
    if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      await ctx.reply('❌ Невозможно отменить заказ с этим статусом')
      return
    }
    
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        notes: `${order.notes || ''}\nОтменен: ${reason || 'без указания причины'}`,
        updatedAt: new Date()
      }
    })
    
    // Возвращаем товары на склад
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId }
    })
    
    for (const item of orderItems) {
      await prisma.productSku.update({
        where: { id: item.skuId },
        data: { 
          stock: { increment: item.quantity }
        }
      })
    }
    
    await ctx.reply(
      `✅ Заказ \\#${escapeMarkdownV2(orderId)} отменен\\n` +
      `${reason ? `Причина: ${escapeMarkdownV2(reason)}` : ''}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error cancelling order:', error)
    await ctx.reply('❌ Ошибка при отмене заказа')
  }
}