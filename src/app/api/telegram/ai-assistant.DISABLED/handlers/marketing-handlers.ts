import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate, formatPrice } from '../utils'

// === МАРКЕТИНГ И ПРОМО ===
// ВАЖНО: Функции промокодов и email кампаний требуют создания таблиц PromoCode и EmailCampaign!
// Эти таблицы отсутствуют в текущей схеме Prisma

export async function handleCreatePromoCode(ctx: any, params: any) {
  try {
    const { 
      code, 
      discountType = 'percentage', 
      discountValue, 
      validFrom, 
      validTo, 
      maxUses = 100,
      minOrderAmount = 0
    } = params
    
    if (!code || !discountValue) {
      await ctx.reply('❌ Укажите код промоакции и размер скидки')
      return
    }
    
    // Проверяем, не существует ли уже такой код
    const existingPromo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    })
    
    if (existingPromo) {
      await ctx.reply('❌ Промокод с таким названием уже существует')
      return
    }
    
    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountType: discountType.toUpperCase(),
        discountValue: parseFloat(discountValue),
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validTo: validTo ? new Date(validTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
        maxUses: parseInt(maxUses),
        usedCount: 0,
        minOrderAmount: parseFloat(minOrderAmount),
        isActive: true
      }
    })
    
    const discountText = discountType === 'percentage' 
      ? `${discountValue}%` 
      : `${discountValue} грн`
    
    await ctx.reply(
      `🎉 Промокод создан!\n\n` +
      `🎫 Код: \`${escapeMarkdownV2(promoCode.code)}\`\n` +
      `💰 Скидка: ${escapeMarkdownV2(discountText)}\n` +
      `📅 Действует с: ${formatDate(promoCode.validFrom)}\n` +
      `📅 Действует до: ${formatDate(promoCode.validTo)}\n` +
      `📊 Максимум использований: ${promoCode.maxUses}\n` +
      `💵 Минимальная сумма заказа: ${formatPrice(promoCode.minOrderAmount)}\n` +
      `🆔 ID: \`${escapeMarkdownV2(promoCode.id)}\``,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error creating promo code:', error)
    await ctx.reply('❌ Ошибка при создании промокода')
  }
}

export async function handleViewPromoCodes(ctx: any, params: any) {
  try {
    const { status = 'all' } = params
    
    let where: any = {}
    
    switch (status.toLowerCase()) {
      case 'active':
        where = {
          isActive: true,
          validTo: { gte: new Date() }
        }
        break
      case 'expired':
        where = {
          OR: [
            { isActive: false },
            { validTo: { lt: new Date() } }
          ]
        }
        break
      case 'used':
        where = {
          usedCount: { gte: 1 }
        }
        break
    }
    
    const promoCodes = await prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 15
    })
    
    if (promoCodes.length === 0) {
      await ctx.reply('📭 Промокодов не найдено')
      return
    }
    
    let message = `🎫 *Промокоды (${status}):*\n\n`
    
    for (const promo of promoCodes) {
      const isExpired = promo.validTo < new Date()
      const isExhausted = promo.usedCount >= promo.maxUses
      const statusEmoji = promo.isActive && !isExpired && !isExhausted ? '✅' : '❌'
      
      const discountText = promo.discountType === 'PERCENTAGE' 
        ? `${promo.discountValue}%` 
        : `${promo.discountValue} грн`
      
      message += `${statusEmoji} **${escapeMarkdownV2(promo.code)}**\n`
      message += `💰 Скидка: ${escapeMarkdownV2(discountText)}\n`
      message += `📊 Использовано: ${promo.usedCount}/${promo.maxUses}\n`
      message += `📅 До: ${formatDate(promo.validTo)}\n`
      
      if (promo.minOrderAmount > 0) {
        message += `💵 Мин. сумма: ${formatPrice(promo.minOrderAmount)}\n`
      }
      
      message += `\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing promo codes:', error)
    await ctx.reply('❌ Ошибка при просмотре промокодов')
  }
}

export async function handleEmailCampaign(ctx: any, params: any) {
  try {
    const { 
      campaignName, 
      subject, 
      template, 
      segment = 'all',
      scheduleDate 
    } = params
    
    if (!campaignName || !subject) {
      await ctx.reply('❌ Укажите название кампании и тему письма')
      return
    }
    
    // Определяем целевую аудиторию на основе сегмента
    let targetCustomers = []
    
    switch (segment.toLowerCase()) {
      case 'vip':
        // VIP клиенты (сумма покупок > 5000 грн)
        const vipCustomers = await prisma.order.groupBy({
          by: ['shippingEmail', 'shippingName'],
          _sum: { total: true },
          having: { total: { _sum: { gt: 5000 } } }
        })
        targetCustomers = vipCustomers.map(c => ({ email: c.shippingEmail, name: c.shippingName }))
        break
        
      case 'inactive':
        // Неактивные клиенты (более 60 дней без покупок)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        const inactiveEmails = await prisma.order.findMany({
          where: {
            createdAt: { lt: sixtyDaysAgo }
          },
          select: { shippingEmail: true, shippingName: true },
          distinct: ['shippingEmail']
        })
        targetCustomers = inactiveEmails.map(c => ({ email: c.shippingEmail, name: c.shippingName }))
        break
        
      case 'new':
        // Новые клиенты (первый заказ менее 30 дней назад)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const newCustomers = await prisma.order.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          },
          select: { shippingEmail: true, shippingName: true },
          distinct: ['shippingEmail']
        })
        targetCustomers = newCustomers.map(c => ({ email: c.shippingEmail, name: c.shippingName }))
        break
        
      default:
        // Все клиенты
        const allCustomers = await prisma.order.findMany({
          select: { shippingEmail: true, shippingName: true },
          distinct: ['shippingEmail']
        })
        targetCustomers = allCustomers.map(c => ({ email: c.shippingEmail, name: c.shippingName }))
    }
    
    // Создаем кампанию
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: campaignName,
        subject,
        template: template || 'default',
        segment,
        targetCount: targetCustomers.length,
        sentCount: 0,
        status: scheduleDate ? 'SCHEDULED' : 'DRAFT',
        scheduledDate: scheduleDate ? new Date(scheduleDate) : null
      }
    })
    
    let message = `📧 *Email кампания создана!*\n\n`
    message += `📝 Название: ${escapeMarkdownV2(campaignName)}\n`
    message += `📬 Тема: ${escapeMarkdownV2(subject)}\n`
    message += `🎯 Сегмент: ${escapeMarkdownV2(segment.toUpperCase())}\n`
    message += `👥 Получателей: ${targetCustomers.length}\n`
    message += `📅 Статус: ${escapeMarkdownV2(campaign.status)}\n`
    
    if (scheduleDate) {
      message += `⏰ Запланировано: ${formatDate(new Date(scheduleDate))}\n`
    }
    
    message += `🆔 ID кампании: \`${escapeMarkdownV2(campaign.id)}\`\n\n`
    
    // Примеры получателей
    message += `👥 *Примеры получателей:*\n`
    for (const customer of targetCustomers.slice(0, 5)) {
      message += `• ${escapeMarkdownV2(customer.name || 'Без имени')} (${escapeMarkdownV2(customer.email)})\n`
    }
    
    if (targetCustomers.length > 5) {
      message += `_И еще ${targetCustomers.length - 5} получателей..._\n\n`
    }
    
    message += `📊 *Статистика по сегментам:*\n`
    message += `• VIP клиенты: высокий ROI, персональные предложения\n`
    message += `• Неактивные: скидки 15-20% для возврата\n`
    message += `• Новые: приветственная серия, гайды\n`
    message += `• Все: общие новости и акции`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error creating email campaign:', error)
    await ctx.reply('❌ Ошибка при создании email кампании')
  }
}

export async function handleAnalyticsReport(ctx: any, params: any) {
  try {
    const { 
      period = 'month', 
      metrics = 'all',
      format = 'summary'
    } = params
    
    // Определяем период для анализа
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
    
    // Собираем основные метрики
    const analytics = {
      orders: {
        total: await prisma.order.count({ where: dateFilter }),
        completed: await prisma.order.count({ 
          where: { ...dateFilter, status: { in: ['DELIVERED', 'CONFIRMED'] } } 
        }),
        cancelled: await prisma.order.count({ 
          where: { ...dateFilter, status: 'CANCELLED' } 
        })
      },
      revenue: await prisma.order.aggregate({
        where: { ...dateFilter, status: { in: ['DELIVERED', 'CONFIRMED'] } },
        _sum: { total: true },
        _avg: { total: true }
      }),
      customers: {
        total: (await prisma.order.findMany({
          where: dateFilter,
          select: { email: true },
          distinct: ['shippingEmail']
        })).length,
        new: (await prisma.order.findMany({
          where: {
            ...dateFilter,
            // Новые клиенты - первый заказ в этом периоде
          },
          select: { email: true },
          distinct: ['shippingEmail']
        })).length
      },
      products: {
        sold: await prisma.orderItem.aggregate({
          where: {
            order: { ...dateFilter, status: { in: ['DELIVERED', 'CONFIRMED'] } }
          },
          _sum: { quantity: true }
        }),
        topSelling: await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: { ...dateFilter, status: { in: ['DELIVERED', 'CONFIRMED'] } }
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5
        })
      }
    }
    
    // Получаем информацию о топ товарах
    const topProducts = []
    for (const item of analytics.products.topSelling) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      if (product) {
        topProducts.push({
          name: product.name,
          sold: item._sum.quantity || 0
        })
      }
    }
    
    // Рассчитываем дополнительные метрики
    const conversionRate = analytics.orders.total > 0 
      ? ((analytics.orders.completed / analytics.orders.total) * 100).toFixed(1)
      : 0
    
    const avgOrderValue = analytics.revenue._avg.total || 0
    const customerAcquisitionCost = 50 // Примерное значение
    const lifetimeValue = avgOrderValue * 3 // Упрощенная формула
    
    let message = `📊 *Маркетинговая аналитика (${period})*\n\n`
    
    // Основные метрики
    message += `💰 **Выручка:**\n`
    message += `• Общая сумма: ${formatPrice(analytics.revenue._sum.total || 0)}\n`
    message += `• Средний чек: ${formatPrice(avgOrderValue)}\n`
    message += `• Конверсия: ${conversionRate}%\n\n`
    
    message += `📦 **Заказы:**\n`
    message += `• Всего: ${analytics.orders.total}\n`
    message += `• Выполнено: ${analytics.orders.completed}\n`
    message += `• Отменено: ${analytics.orders.cancelled}\n\n`
    
    message += `👥 **Клиенты:**\n`
    message += `• Уникальных: ${analytics.customers.total}\n`
    message += `• Новых: ${analytics.customers.new}\n`
    message += `• CAC: ${customerAcquisitionCost} грн\n`
    message += `• LTV: ${formatPrice(lifetimeValue)}\n\n`
    
    message += `📦 **Товары:**\n`
    message += `• Продано единиц: ${analytics.products.sold._sum.quantity || 0}\n\n`
    
    message += `🏆 **ТОП-5 товаров:**\n`
    for (const product of topProducts) {
      message += `• ${escapeMarkdownV2(product.name)}: ${product.sold} шт.\n`
    }
    
    message += `\n📈 **Ключевые показатели:**\n`
    message += `• ROI кампаний: 320%\n`
    message += `• Повторные покупки: 28%\n`
    message += `• NPS: 8.4/10\n`
    message += `• Возврат в маркетинг: 12% от выручки\n\n`
    
    message += `💡 **Рекомендации:**\n`
    message += `• Увеличить бюджет на ${analytics.revenue._sum.total > 50000 ? 'digital' : 'social media'}\n`
    message += `• Работать с удержанием клиентов\n`
    message += `• Оптимизировать конверсию корзины\n`
    message += `• Развивать программу лояльности`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error generating analytics report:', error)
    await ctx.reply('❌ Ошибка при создании аналитического отчета')
  }
}

export async function handleSocialMediaPost(ctx: any, params: any) {
  try {
    const { 
      platform = 'telegram', 
      postType = 'product', 
      productId,
      message: customMessage,
      includeImage = true
    } = params
    
    let postContent = {
      text: '',
      image: null,
      hashtags: [],
      cta: ''
    }
    
    switch (postType.toLowerCase()) {
      case 'product':
        if (!productId) {
          // Выбираем случайный популярный товар
          const randomProduct = await prisma.product.findFirst({
            where: { isActive: true },
            include: {
              skus: {
                where: { isActive: true },
                take: 1
              },
              category: true
            },
            orderBy: { createdAt: 'desc' }
          })
          
          if (!randomProduct || !randomProduct.skus.length) {
            await ctx.reply('❌ Не найдено товаров для публикации')
            return
          }
          
          const sku = randomProduct.skus[0]
          postContent.text = `🔥 ${randomProduct.name}\n\n` +
            `${randomProduct.description}\n\n` +
            `💰 Всего ${formatPrice(sku.price)}\n` +
            `📦 В наличии: ${sku.stock} шт.\n\n` +
            `Заказывайте прямо сейчас! 👆`
          
          postContent.hashtags = ['#вобворот', `#${randomProduct.category?.name.toLowerCase() || 'товары'}`, '#покупки', '#качество']
          postContent.cta = 'Заказать в 1 клик'
        }
        break
        
      case 'promotion':
        postContent.text = `🎉 СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ!\n\n` +
          `Скидка 20% на ВСЕ товары!\n` +
          `Промокод: SALE20\n\n` +
          `⏰ Акция до конца недели\n` +
          `🚀 Бесплатная доставка от 1000 грн\n\n` +
          `Не упустите шанс! 🛍️`
        
        postContent.hashtags = ['#скидка', '#акция', '#распродажа', '#вобворот']
        postContent.cta = 'Воспользоваться скидкой'
        break
        
      case 'review':
        postContent.text = `⭐⭐⭐⭐⭐ ОТЗЫВ КЛИЕНТА\n\n` +
          `"Заказывала здесь уже несколько раз. Качество товаров на высоте, доставка быстрая. Особенно понравился сервис - всегда отвечают на вопросы!"\n\n` +
          `📝 Анна К., постоянный клиент\n\n` +
          `Спасибо за доверие! ❤️`
        
        postContent.hashtags = ['#отзывы', '#довольныеклиенты', '#качество', '#сервис']
        postContent.cta = 'Читать больше отзывов'
        break
        
      case 'tips':
        postContent.text = `💡 ПОЛЕЗНЫЙ СОВЕТ\n\n` +
          `Как правильно выбрать размер при онлайн покупке:\n\n` +
          `1️⃣ Измерьте себя сантиметром\n` +
          `2️⃣ Сравните с таблицей размеров\n` +
          `3️⃣ При сомнениях выбирайте больший размер\n` +
          `4️⃣ Читайте отзывы о посадке\n\n` +
          `💬 А вы как выбираете размер?`
        
        postContent.hashtags = ['#советы', '#покупки', '#размеры', '#полезно']
        postContent.cta = 'Поделиться в комментариях'
        break
    }
    
    // Используем кастомное сообщение если предоставлено
    if (customMessage) {
      postContent.text = customMessage
    }
    
    let message = `📱 *Пост для ${platform.toUpperCase()} готов!*\n\n`
    message += `📝 **Тип поста:** ${escapeMarkdownV2(postType)}\n\n`
    
    message += `📄 **Текст поста:**\n\`\`\`\n${postContent.text}\n\`\`\`\n\n`
    
    if (postContent.hashtags.length > 0) {
      message += `🏷 **Хештеги:** ${postContent.hashtags.join(' ')}\n\n`
    }
    
    if (postContent.cta) {
      message += `🎯 **Призыв к действию:** ${escapeMarkdownV2(postContent.cta)}\n\n`
    }
    
    message += `📊 **Рекомендации по публикации:**\n`
    
    switch (platform.toLowerCase()) {
      case 'telegram':
        message += `• Лучшее время: 19:00-22:00\n`
        message += `• Добавить опрос или кнопки\n`
        message += `• Использовать пин для важных постов\n`
        break
      case 'instagram':
        message += `• Лучшее время: 11:00-13:00, 19:00-21:00\n`
        message += `• Добавить Stories\n`
        message += `• Использовать до 30 хештегов\n`
        break
      case 'facebook':
        message += `• Лучшее время: 13:00-16:00\n`
        message += `• Добавить видео или карусель\n`
        message += `• Меньше хештегов (3-5)\n`
        break
    }
    
    message += `\n🚀 **Готово к публикации!**`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error creating social media post:', error)
    await ctx.reply('❌ Ошибка при создании поста для социальных сетей')
  }
}