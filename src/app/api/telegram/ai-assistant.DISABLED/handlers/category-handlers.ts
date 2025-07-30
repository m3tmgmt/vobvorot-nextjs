import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2 } from '../utils'

// === УПРАВЛЕНИЕ КАТЕГОРИЯМИ ===

export async function handleAddCategory(ctx: any, params: any) {
  try {
    const { name, description, emoji } = params
    
    if (!name) {
      await ctx.reply('❌ Укажите название категории')
      return
    }
    
    // Проверяем, не существует ли уже такая категория
    const existing = await prisma.category.findFirst({
      where: { 
        OR: [
          { name },
          { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      }
    })
    
    if (existing) {
      await ctx.reply('⚠️ Такая категория уже существует')
      return
    }
    
    // Создаем новую категорию
    const category = await prisma.category.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description || null,
        emoji: emoji || '📦',
        isActive: true
      }
    })
    
    await ctx.reply(
      `✅ Категория создана\\!\\n\\n` +
      `🏷 Название: ${escapeMarkdownV2(category.name)}\\n` +
      `🔗 Slug: ${escapeMarkdownV2(category.slug)}\\n` +
      `${category.emoji} Emoji: ${category.emoji}\\n` +
      `${category.description ? `📝 Описание: ${escapeMarkdownV2(category.description)}` : ''}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error adding category:', error)
    await ctx.reply('❌ Ошибка при добавлении категории')
  }
}

export async function handleViewCategories(ctx: any, params: any) {
  try {
    // Получаем все категории с количеством товаров
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    
    if (categories.length === 0) {
      await ctx.reply('📭 Категорий пока нет')
      return
    }
    
    let message = `🏷 *Категории товаров:*\\n\\n`
    
    for (const category of categories) {
      const emoji = category.emoji || '📦'
      message += `${emoji} ${escapeMarkdownV2(category.name)} \\(${category._count.products} товаров\\)\\n`
      if (category.description) {
        message += `   _${escapeMarkdownV2(category.description)}_\\n`
      }
      message += `\\n`
    }
    
    message += `_Всего категорий: ${categories.length}_`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing categories:', error)
    await ctx.reply('❌ Ошибка при просмотре категорий')
  }
}

export async function handleEditCategory(ctx: any, params: any) {
  try {
    const { categoryId, name, description, emoji } = params
    
    if (!categoryId) {
      await ctx.reply('❌ Укажите ID категории')
      return
    }
    
    // Проверяем существование категории
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })
    
    if (!existingCategory) {
      await ctx.reply('❌ Категория не найдена')
      return
    }
    
    // Подготавливаем данные для обновления
    const updateData: any = {}
    if (name) {
      updateData.name = name
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    if (description !== undefined) updateData.description = description
    if (emoji) updateData.emoji = emoji
    updateData.updatedAt = new Date()
    
    // Обновляем категорию
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
    
    await ctx.reply(
      `✅ Категория обновлена\\!\\n\\n` +
      `🆔 ID: \\\`${escapeMarkdownV2(updatedCategory.id)}\\\`\\n` +
      `🏷 Название: ${escapeMarkdownV2(updatedCategory.name)}\\n` +
      `${updatedCategory.emoji} Emoji: ${updatedCategory.emoji}\\n` +
      `📦 Товаров: ${updatedCategory._count.products}\\n` +
      `${updatedCategory.description ? `📝 Описание: ${escapeMarkdownV2(updatedCategory.description)}` : ''}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error editing category:', error)
    await ctx.reply('❌ Ошибка при редактировании категории')
  }
}

export async function handleDeleteCategory(ctx: any, params: any) {
  try {
    const { categoryId, moveToCategoryId } = params
    
    if (!categoryId) {
      await ctx.reply('❌ Укажите ID категории для удаления')
      return
    }
    
    // Проверяем существование категории
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
    
    if (!category) {
      await ctx.reply('❌ Категория не найдена')
      return
    }
    
    const productCount = category._count.products
    
    if (productCount > 0 && !moveToCategoryId) {
      await ctx.reply(
        `❌ В категории "${escapeMarkdownV2(category.name)}" есть ${productCount} товаров\\n\\n` +
        `Укажите ID категории для переноса товаров или сначала удалите товары`,
        { parse_mode: 'MarkdownV2' }
      )
      return
    }
    
    if (productCount > 0 && moveToCategoryId) {
      // Проверяем существование целевой категории
      const targetCategory = await prisma.category.findUnique({
        where: { id: moveToCategoryId }
      })
      
      if (!targetCategory) {
        await ctx.reply('❌ Целевая категория не найдена')
        return
      }
      
      // Переносим товары в другую категорию
      await prisma.product.updateMany({
        where: { categoryId: categoryId },
        data: { categoryId: moveToCategoryId }
      })
      
      // Удаляем категорию
      await prisma.category.delete({
        where: { id: categoryId }
      })
      
      await ctx.reply(
        `✅ Категория удалена\\!\\n\\n` +
        `🏷 ${escapeMarkdownV2(category.name)}\\n` +
        `📦 ${productCount} товаров перенесено в "${escapeMarkdownV2(targetCategory.name)}"`,
        { parse_mode: 'MarkdownV2' }
      )
    } else {
      // Удаляем пустую категорию
      await prisma.category.delete({
        where: { id: categoryId }
      })
      
      await ctx.reply(
        `✅ Категория "${escapeMarkdownV2(category.name)}" удалена`,
        { parse_mode: 'MarkdownV2' }
      )
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    await ctx.reply('❌ Ошибка при удалении категории')
  }
}

export async function handleCategoryStats(ctx: any, params: any) {
  try {
    const { categoryId } = params
    
    let where: any = { isActive: true }
    if (categoryId) {
      where.id = categoryId
    }
    
    // Получаем категории с товарами и их SKU
    const categories = await prisma.category.findMany({
      where,
      include: {
        products: {
          where: { isActive: true },
          include: {
            skus: {
              select: {
                price: true,
                stock: true,
                isActive: true
              }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    if (categories.length === 0) {
      await ctx.reply('📊 Нет данных для отображения')
      return
    }
    
    let message = `📊 *Статистика по категориям:*\\n\\n`
    
    let totalProducts = 0
    let totalStock = 0
    let totalValue = 0
    
    for (const category of categories) {
      const emoji = category.emoji || '📦'
      message += `${emoji} *${escapeMarkdownV2(category.name)}*\\n`
      message += `   📦 Товаров: ${category._count.products}\\n`
      
      // Подсчитываем статистику по SKU
      let categoryStock = 0
      let categoryValue = 0
      let priceSum = 0
      let skuCount = 0
      
      for (const product of category.products) {
        for (const sku of product.skus) {
          if (sku.isActive) {
            categoryStock += sku.stock
            categoryValue += Number(sku.price) * sku.stock
            priceSum += Number(sku.price)
            skuCount++
          }
        }
      }
      
      const avgPrice = skuCount > 0 ? priceSum / skuCount : 0
      
      message += `   📊 На складе: ${categoryStock} шт\\.\\n`
      message += `   💰 Средняя цена: ${avgPrice.toFixed(2)} грн\\n`
      message += `   💵 Общая стоимость: ${categoryValue.toFixed(2)} грн\\n\\n`
      
      totalProducts += category._count.products
      totalStock += categoryStock
      totalValue += categoryValue
    }
    
    // Общая статистика
    message += `\\n📈 *Итого:*\\n`
    message += `   🏷 Категорий: ${categories.length}\\n`
    message += `   📦 Товаров: ${totalProducts}\\n`
    message += `   📊 Всего на складе: ${totalStock} шт\\.\\n`
    message += `   💵 Общая стоимость: ${totalValue.toFixed(2)} грн`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting category stats:', error)
    await ctx.reply('❌ Ошибка при получении статистики')
  }
}

export async function handleMoveProductsCategory(ctx: any, params: any) {
  try {
    const { fromCategoryId, toCategoryId, productIds } = params
    
    if (!fromCategoryId || !toCategoryId) {
      await ctx.reply('❌ Укажите ID исходной и целевой категорий')
      return
    }
    
    // Проверяем существование обеих категорий
    const [fromCategory, toCategory] = await Promise.all([
      prisma.category.findUnique({ where: { id: fromCategoryId } }),
      prisma.category.findUnique({ where: { id: toCategoryId } })
    ])
    
    if (!fromCategory) {
      await ctx.reply('❌ Исходная категория не найдена')
      return
    }
    
    if (!toCategory) {
      await ctx.reply('❌ Целевая категория не найдена')
      return
    }
    
    let where: any = { categoryId: fromCategoryId }
    
    // Если указаны конкретные товары
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      where.id = { in: productIds }
    }
    
    const result = await prisma.product.updateMany({
      where,
      data: { categoryId: toCategoryId }
    })
    
    if (result.count === 0) {
      await ctx.reply('❌ Товары для переноса не найдены')
      return
    }
    
    await ctx.reply(
      `✅ Товары перенесены\\!\\n\\n` +
      `📦 Перенесено: ${result.count} товаров\\n` +
      `🏷 Из: ${escapeMarkdownV2(fromCategory.name)}\\n` +
      `🏷 В: ${escapeMarkdownV2(toCategory.name)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error moving products between categories:', error)
    await ctx.reply('❌ Ошибка при переносе товаров')
  }
}