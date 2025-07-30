import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate } from '../utils'

// === УПРАВЛЕНИЕ ОТЗЫВАМИ ===
// ВАЖНО: В реальной БД отзывы связаны с userId, а не orderId!
// Поля customerName, customerEmail, moderationStatus отсутствуют в схеме

export async function handleViewReviews(ctx: any, params: any) {
  try {
    const { productId, rating } = params
    
    let where: any = {}
    if (productId) {
      where.productId = productId
    }
    if (rating) {
      where.rating = parseInt(rating)
    }
    
    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: true,
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    if (reviews.length === 0) {
      await ctx.reply('📭 Отзывов пока нет')
      return
    }
    
    let message = `⭐ *Отзывы ${productId ? 'на товар' : ''}:*\n\n`
    
    for (const review of reviews) {
      const stars = '⭐'.repeat(review.rating)
      message += `${stars} *Оценка: ${review.rating}/5*\n`
      message += `📦 Товар: ${escapeMarkdownV2(review.product?.name || 'Удален')}\n`
      message += `👤 Пользователь: ${escapeMarkdownV2(review.user?.name || review.user?.email || 'N/A')}\n`
      message += `📅 ${formatDate(review.createdAt)}\n`
      if (review.comment) {
        message += `💬 "${escapeMarkdownV2(review.comment)}"\n`
      }
      message += `\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing reviews:', error)
    await ctx.reply('❌ Ошибка при просмотре отзывов')
  }
}

export async function handleAddReview(ctx: any, params: any) {
  try {
    const { orderId, productId, rating, comment, title } = params
    
    if (!orderId || !productId || !rating) {
      await ctx.reply('❌ Укажите ID заказа, ID товара и оценку (1-5)')
      return
    }
    
    if (rating < 1 || rating > 5) {
      await ctx.reply('❌ Оценка должна быть от 1 до 5')
      return
    }
    
    // Проверяем, существует ли заказ и товар
    // В реальной БД отзывы связаны с userId, но для совместимости получаем из заказа
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    })
    
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!order || !product) {
      await ctx.reply('❌ Заказ или товар не найден')
      return
    }
    
    if (!order.userId) {
      await ctx.reply('❌ Заказ не связан с пользователем')
      return
    }
    
    // Проверяем, нет ли уже отзыва от этого пользователя на этот товар
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: order.userId,
          productId
        }
      }
    })
    
    if (existingReview) {
      await ctx.reply('❌ Пользователь уже оставил отзыв на этот товар')
      return
    }
    
    const review = await prisma.review.create({
      data: {
        userId: order.userId,
        productId,
        rating: parseInt(rating),
        title: title || null,
        comment: comment || null
      }
    })
    
    await ctx.reply(
      `✅ Отзыв добавлен!\n\n` +
      `⭐ Оценка: ${rating}/5\n` +
      `📦 Товар: ${escapeMarkdownV2(product.name)}\n` +
      `👤 От: ${escapeMarkdownV2(order.shippingName)}\n` +
      `🆔 ID отзыва: \`${escapeMarkdownV2(review.id)}\``,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error adding review:', error)
    await ctx.reply('❌ Ошибка при добавлении отзыва')
  }
}

export async function handleDeleteReview(ctx: any, params: any) {
  try {
    const { reviewId } = params
    
    if (!reviewId) {
      await ctx.reply('❌ Укажите ID отзыва')
      return
    }
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true }
    })
    
    if (!review) {
      await ctx.reply('❌ Отзыв не найден')
      return
    }
    
    await prisma.review.delete({
      where: { id: reviewId }
    })
    
    await ctx.reply(
      `✅ Отзыв удален!\n` +
      `📦 Товар: ${escapeMarkdownV2(review.product?.name || 'Удален')}\n` +
      `⭐ Оценка была: ${review.rating}/5`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error deleting review:', error)
    await ctx.reply('❌ Ошибка при удалении отзыва')
  }
}

export async function handleReviewStatistics(ctx: any, params: any) {
  try {
    // Общая статистика отзывов
    const totalReviews = await prisma.review.count()
    
    if (totalReviews === 0) {
      await ctx.reply('📊 Отзывов пока нет')
      return
    }
    
    // Статистика по оценкам
    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      _count: { rating: true },
      orderBy: { rating: 'desc' }
    })
    
    // Средняя оценка
    const avgRating = await prisma.review.aggregate({
      _avg: { rating: true }
    })
    
    // Товары с лучшими отзывами
    const topRatedProducts = await prisma.review.groupBy({
      by: ['productId'],
      _avg: { rating: true },
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } },
      orderBy: { _avg: { rating: 'desc' } },
      take: 5
    })
    
    let message = `📊 *Статистика отзывов:*\n\n`
    message += `📝 Всего отзывов: ${totalReviews}\n`
    message += `⭐ Средняя оценка: ${avgRating._avg.rating?.toFixed(1) || '0'}/5\n\n`
    
    message += `📈 *Распределение оценок:*\n`
    for (const stat of ratingStats) {
      const stars = '⭐'.repeat(stat.rating)
      const percentage = ((stat._count.rating / totalReviews) * 100).toFixed(1)
      message += `${stars} ${stat.rating}: ${stat._count.rating} (${percentage}%)\n`
    }
    
    if (topRatedProducts.length > 0) {
      message += `\n🏆 *ТОП товары по отзывам:*\n`
      
      for (const item of topRatedProducts) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        
        if (product) {
          message += `⭐ ${item._avg.rating?.toFixed(1)}/5 - ${escapeMarkdownV2(product.name)} (${item._count.id} отзывов)\n`
        }
      }
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting review statistics:', error)
    await ctx.reply('❌ Ошибка при получении статистики отзывов')
  }
}

export async function handleModerateReview(ctx: any, params: any) {
  try {
    const { reviewId, action } = params
    
    // В реальной БД нет полей модерации, но мы можем использовать title для пометки
    if (!reviewId || !action) {
      await ctx.reply('❌ Укажите ID отзыва и действие (approve/reject)')
      return
    }
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true, user: true }
    })
    
    if (!review) {
      await ctx.reply('❌ Отзыв не найден')
      return
    }
    
    let updateData: any = {}
    let statusText = ''
    
    switch (action.toLowerCase()) {
      case 'approve':
        updateData.title = '[APPROVED] ' + (review.title || '')
        statusText = 'одобрен'
        break
      case 'reject':
        updateData.title = '[REJECTED] ' + (review.title || '')
        statusText = 'отклонен'
        break
      default:
        await ctx.reply('❌ Неверное действие. Используйте: approve или reject')
        return
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData
    })
    
    await ctx.reply(
      `✅ Отзыв ${statusText}!\n\n` +
      `📦 Товар: ${escapeMarkdownV2(review.product?.name || 'Удален')}\n` +
      `⭐ Оценка: ${review.rating}/5\n` +
      `👤 От: ${escapeMarkdownV2(review.user?.name || review.user?.email || 'N/A')}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error moderating review:', error)
    await ctx.reply('❌ Ошибка при модерации отзыва')
  }
}

export async function handleExportReviews(ctx: any, params: any) {
  try {
    const { format = 'csv' } = params
    
    const reviews = await prisma.review.findMany({
      include: {
        product: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (reviews.length === 0) {
      await ctx.reply('📭 Нет отзывов для экспорта')
      return
    }
    
    // Формируем CSV
    let csv = 'ID,Товар,Оценка,Заголовок,Комментарий,Пользователь,Дата\n'
    
    for (const review of reviews) {
      csv += `"${review.id}","${review.product?.name || 'Удален'}",${review.rating},"${review.title || ''}","${review.comment || ''}","${review.user?.name || review.user?.email || 'N/A'}","${review.createdAt.toISOString().split('T')[0]}"\n`
    }
    
    // Отправляем как документ
    await ctx.replyWithDocument(
      Buffer.from(csv, 'utf-8'),
      {
        filename: `reviews_export_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📊 Экспорт отзывов (${reviews.length} шт.)`
      }
    )
  } catch (error) {
    console.error('Error exporting reviews:', error)
    await ctx.reply('❌ Ошибка при экспорте отзывов')
  }
}