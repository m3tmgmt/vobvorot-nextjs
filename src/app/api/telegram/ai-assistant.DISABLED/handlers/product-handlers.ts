import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatPrice } from '../utils'
import { ProductStatus } from '@prisma/client'

// === УПРАВЛЕНИЕ ТОВАРАМИ ===

export async function handleAddProduct(ctx: any, params: any) {
  try {
    const { name, description, price, categoryId, stock = 0, weight = 0, brand } = params
    
    if (!name || !price || !categoryId) {
      await ctx.reply('❌ Укажите название, цену и ID категории товара')
      return
    }
    
    // Проверяем категорию
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })
    
    if (!category) {
      await ctx.reply('❌ Категория не найдена')
      return
    }
    
    // Создаем товар с ProductSku
    const product = await prisma.product.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description || '',
        brand: brand || '',
        categoryId,
        isActive: true,
        skus: {
          create: [{
            sku: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-default`,
            price,
            stock,
            weight: weight || null,
            isActive: true
          }]
        }
      },
      include: {
        skus: true,
        category: true
      }
    })
    
    await ctx.reply(
      `✅ Товар создан\\!\\n\\n` +
      `🆔 ID: \`${escapeMarkdownV2(product.id)}\`\\n` +
      `📦 ${escapeMarkdownV2(product.name)}\\n` +
      `💰 ${formatPrice(product.skus[0].price)}\\n` +
      `📊 Количество: ${product.skus[0].stock} шт\\.\\n` +
      `🏷 Категория: ${escapeMarkdownV2(product.category.name)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error adding product:', error)
    await ctx.reply('❌ Ошибка при добавлении товара')
  }
}

export async function handleEditProduct(ctx: any, params: any) {
  try {
    const { productId, field, value } = params
    
    if (!productId || !field || value === undefined) {
      await ctx.reply('❌ Укажите ID товара, поле и новое значение')
      return
    }
    
    const updateData: any = {}
    updateData[field] = value
    
    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData
    })
    
    await ctx.reply(
      `✅ Товар обновлен\\!\\n` +
      `📦 ${escapeMarkdownV2(product.name)}\\n` +
      `📝 ${escapeMarkdownV2(field)}: ${escapeMarkdownV2(String(value))}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error editing product:', error)
    await ctx.reply('❌ Ошибка при редактировании товара')
  }
}

export async function handleUpdateProductPrice(ctx: any, params: any) {
  try {
    const { productId, price, skuId } = params
    
    if (!productId || !price) {
      await ctx.reply('❌ Укажите ID товара и новую цену')
      return
    }
    
    // Получаем товар с SKU
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { skus: true }
    })
    
    if (!product) {
      await ctx.reply('❌ Товар не найден')
      return
    }
    
    // Используем первый SKU если не указан конкретный
    const targetSkuId = skuId || product.skus[0]?.id
    
    if (!targetSkuId) {
      await ctx.reply('❌ У товара нет SKU')
      return
    }
    
    // Обновляем цену в ProductSku
    await prisma.productSku.update({
      where: { id: targetSkuId },
      data: { price }
    })
    
    await ctx.reply(
      `✅ Цена обновлена\\!\\n` +
      `📦 ${escapeMarkdownV2(product.name)}\\n` +
      `💰 Новая цена: ${formatPrice(price)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error updating price:', error)
    await ctx.reply('❌ Ошибка при обновлении цены')
  }
}

export async function handleUpdateProductStock(ctx: any, params: any) {
  try {
    const { productId, stock, skuId } = params
    
    if (!productId || stock === undefined) {
      await ctx.reply('❌ Укажите ID товара и количество')
      return
    }
    
    // Получаем товар с SKU
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { skus: true }
    })
    
    if (!product) {
      await ctx.reply('❌ Товар не найден')
      return
    }
    
    // Используем первый SKU если не указан конкретный
    const targetSkuId = skuId || product.skus[0]?.id
    
    if (!targetSkuId) {
      await ctx.reply('❌ У товара нет SKU')
      return
    }
    
    // Обновляем stock в ProductSku
    await prisma.productSku.update({
      where: { id: targetSkuId },
      data: { stock }
    })
    
    await ctx.reply(
      `✅ Количество обновлено\\!\\n` +
      `📦 ${escapeMarkdownV2(product.name)}\\n` +
      `📊 Новое количество: ${stock} шт\\.`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error updating stock:', error)
    await ctx.reply('❌ Ошибка при обновлении количества')
  }
}

export async function handleUpdateProductStatus(ctx: any, params: any) {
  try {
    const { productId, status } = params
    
    if (!productId || !status) {
      await ctx.reply('❌ Укажите ID товара и статус (active/inactive)')
      return
    }
    
    const lowerStatus = status.toLowerCase()
    const validStatuses = ['active', 'inactive']
    
    if (!validStatuses.includes(lowerStatus)) {
      await ctx.reply(`❌ Неверный статус. Доступные: ${validStatuses.join(', ')}`)
      return
    }
    
    const isActive = lowerStatus === 'active'
    
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive }
    })
    
    await ctx.reply(
      `✅ Статус обновлен\\!\\n` +
      `📦 ${escapeMarkdownV2(product.name)}\\n` +
      `📍 Новый статус: ${isActive ? 'Активен' : 'Неактивен'}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error updating status:', error)
    await ctx.reply('❌ Ошибка при обновлении статуса')
  }
}

export async function handleAddProductPhotos(ctx: any, params: any) {
  try {
    const { productId } = params
    
    if (!productId) {
      await ctx.reply('❌ Укажите ID товара, затем отправьте фото')
      return
    }
    
    await ctx.reply(
      `📸 Отправьте фото для товара ID: ${escapeMarkdownV2(productId)}\\n` +
      `Можно отправить несколько фото по одному`,
      { parse_mode: 'MarkdownV2' }
    )
    
    // TODO: Сохранить productId в контексте для обработки последующих фото
  } catch (error) {
    console.error('Error in add product photos:', error)
    await ctx.reply('❌ Ошибка при добавлении фото')
  }
}

export async function handleDeleteProductPhoto(ctx: any, params: any) {
  try {
    const { productId, photoId } = params
    
    if (!productId || !photoId) {
      await ctx.reply('❌ Укажите ID товара и ID фото')
      return
    }
    
    // Проверяем существование товара
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!product) {
      await ctx.reply('❌ Товар не найден')
      return
    }
    
    // Удаляем изображение из ProductImage table
    const deletedImage = await prisma.productImage.delete({
      where: { 
        id: photoId,
        productId: productId
      }
    })
    
    await ctx.reply('✅ Фото удалено')
  } catch (error) {
    console.error('Error deleting photo:', error)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      await ctx.reply('❌ Фото не найдено')
    } else {
      await ctx.reply('❌ Ошибка при удалении фото')
    }
  }
}

export async function handleAddProductVideos(ctx: any, params: any) {
  try {
    const { productId } = params
    
    if (!productId) {
      await ctx.reply('❌ Укажите ID товара, затем отправьте видео')
      return
    }
    
    await ctx.reply(
      `🎬 Отправьте видео для товара ID: ${escapeMarkdownV2(productId)}`,
      { parse_mode: 'MarkdownV2' }
    )
    
    // TODO: Сохранить productId в контексте для обработки последующих видео
  } catch (error) {
    console.error('Error in add product videos:', error)
    await ctx.reply('❌ Ошибка при добавлении видео')
  }
}

export async function handleDeleteProductVideo(ctx: any, params: any) {
  try {
    const { productId, videoId } = params
    
    if (!productId || !videoId) {
      await ctx.reply('❌ Укажите ID товара и ID видео')
      return
    }
    
    // TODO: Реализовать удаление видео из Cloudinary и БД
    
    await ctx.reply('✅ Видео удалено')
  } catch (error) {
    console.error('Error deleting video:', error)
    await ctx.reply('❌ Ошибка при удалении видео')
  }
}

export async function handleSearchProduct(ctx: any, params: any) {
  try {
    const { query } = params
    
    if (!query) {
      await ctx.reply('❌ Укажите поисковый запрос')
      return
    }
    
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
              { category: { name: { contains: query, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      include: {
        skus: {
          select: {
            id: true,
            price: true,
            stock: true
          }
        },
        category: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    if (products.length === 0) {
      await ctx.reply('❌ Товары не найдены')
      return
    }
    
    let message = `🔍 *Результаты поиска:*\\n\\n`
    
    for (const product of products) {
      const firstSku = product.skus[0]
      const statusEmoji = product.isActive ? '✅' : '⏸'
      
      message += `${statusEmoji} *${escapeMarkdownV2(product.name)}*\\n`
      message += `🆔 ID: \`${escapeMarkdownV2(product.id)}\`\\n`
      message += `💰 ${firstSku ? formatPrice(firstSku.price) : 'Цена не указана'}\\n`
      message += `📊 Остаток: ${firstSku ? firstSku.stock : 0} шт\\.\\n`
      message += `🏷 ${escapeMarkdownV2(product.category.name)}\\n\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error searching products:', error)
    await ctx.reply('❌ Ошибка при поиске товаров')
  }
}

export async function handleViewProducts(ctx: any, params: any) {
  try {
    const { category, status } = params
    
    let where: any = { isActive: true }
    if (category) {
      where.category = { name: { contains: category, mode: 'insensitive' } }
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        skus: { select: { price: true, stock: true } },
        category: true
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })
    
    if (products.length === 0) {
      await ctx.reply('📭 Товаров не найдено')
      return
    }
    
    let message = `📦 *Товары ${category ? `в категории ${category}` : ''}:*\\n\\n`
    
    for (const product of products) {
      const firstSku = product.skus[0]
      const statusEmoji = product.isActive ? '✅' : '⏸'
      
      message += `${statusEmoji} *${escapeMarkdownV2(product.name)}*\\n`
      message += `💰 ${firstSku ? formatPrice(firstSku.price) : 'Н/Д'} | 📊 ${firstSku ? firstSku.stock : 0} шт\\.\\n\\n`
    }
    
    message += `\\n_Всего товаров: ${products.length}_`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing products:', error)
    await ctx.reply('❌ Ошибка при просмотре товаров')
  }
}

export async function handleViewProductsByCategory(ctx: any, params: any) {
  try {
    const { categoryId } = params
    
    if (!categoryId) {
      await ctx.reply('❌ Укажите ID категории')
      return
    }
    
    const products = await prisma.product.findMany({
      where: { category: categoryId },
      orderBy: { createdAt: 'desc' }
    })
    
    if (products.length === 0) {
      await ctx.reply('📭 В этой категории нет товаров')
      return
    }
    
    let message = `🏷 *Товары в категории ${escapeMarkdownV2(categoryId)}:*\\n\\n`
    
    for (const product of products) {
      message += `• ${escapeMarkdownV2(product.name)} \\- ${formatPrice(product.price)}\\n`
    }
    
    message += `\\n_Всего: ${products.length} товаров_`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error viewing category products:', error)
    await ctx.reply('❌ Ошибка при просмотре товаров категории')
  }
}

export async function handleDeleteProduct(ctx: any, params: any) {
  try {
    const { productId } = params
    
    if (!productId) {
      await ctx.reply('❌ Укажите ID товара')
      return
    }
    
    // Проверяем, нет ли активных заказов с этим товаром
    const activeOrders = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          status: {
            in: ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED']
          }
        }
      }
    })
    
    if (activeOrders.length > 0) {
      await ctx.reply('❌ Невозможно удалить товар с активными заказами')
      return
    }
    
    const product = await prisma.product.delete({
      where: { id: productId }
    })
    
    await ctx.reply(
      `✅ Товар удален\\!\\n` +
      `📦 ${escapeMarkdownV2(product.name)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error deleting product:', error)
    await ctx.reply('❌ Ошибка при удалении товара')
  }
}

export async function handleBulkEditProducts(ctx: any, params: any) {
  try {
    const { productIds, field, value } = params
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0 || !field || value === undefined) {
      await ctx.reply('❌ Укажите массив ID товаров, поле и значение')
      return
    }
    
    const updateData: any = {}
    updateData[field] = value
    
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData
    })
    
    await ctx.reply(
      `✅ Обновлено товаров: ${result.count}\\n` +
      `📝 ${escapeMarkdownV2(field)}: ${escapeMarkdownV2(String(value))}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error bulk editing products:', error)
    await ctx.reply('❌ Ошибка при массовом редактировании')
  }
}

export async function handleExportProducts(ctx: any, params: any) {
  try {
    const { format = 'csv' } = params
    
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Формируем CSV
    let csv = 'ID,Название,Цена,Количество,Категория,Статус,Бренд\n'
    for (const product of products) {
      csv += `${product.id},"${product.name}",${product.price},${product.quantity},"${product.category}",${product.status},"${product.brand || ''}"\n`
    }
    
    // Отправляем как документ
    await ctx.replyWithDocument(
      Buffer.from(csv, 'utf-8'),
      {
        filename: `products_export_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📊 Экспорт товаров (${products.length} шт.)`
      }
    )
  } catch (error) {
    console.error('Error exporting products:', error)
    await ctx.reply('❌ Ошибка при экспорте товаров')
  }
}

export async function handleImportProducts(ctx: any, params: any) {
  try {
    const { fileUrl } = params
    
    if (!fileUrl) {
      await ctx.reply('❌ Отправьте CSV файл с товарами')
      return
    }
    
    // TODO: Реализовать импорт из CSV
    await ctx.reply('⚠️ Функция импорта в разработке')
  } catch (error) {
    console.error('Error importing products:', error)
    await ctx.reply('❌ Ошибка при импорте товаров')
  }
}

export async function handleProductDetails(ctx: any, params: any) {
  try {
    const { productId } = params
    
    if (!productId) {
      await ctx.reply('❌ Укажите ID товара')
      return
    }
    
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!product) {
      await ctx.reply('❌ Товар не найден')
      return
    }
    
    let message = `📦 *Детали товара*\\n\\n`
    message += `🆔 ID: \`${escapeMarkdownV2(product.id)}\`\\n`
    message += `📝 Название: ${escapeMarkdownV2(product.name)}\\n`
    message += `💰 Цена: ${formatPrice(product.price)}\\n`
    message += `📊 Количество: ${product.quantity} шт\\.\\n`
    message += `🏷 Категория: ${escapeMarkdownV2(product.category)}\\n`
    message += `📍 Статус: ${escapeMarkdownV2(product.status)}\\n`
    
    if (product.brand) {
      message += `🏭 Бренд: ${escapeMarkdownV2(product.brand)}\\n`
    }
    
    if (product.weight) {
      message += `⚖️ Вес: ${product.weight} г\\n`
    }
    
    if (product.description) {
      message += `\\n📄 *Описание:*\\n${escapeMarkdownV2(product.description)}\\n`
    }
    
    if (product.images.length > 0) {
      message += `\\n🖼 Фото: ${product.images.length} шт\\.`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting product details:', error)
    await ctx.reply('❌ Ошибка при получении деталей товара')
  }
}

export async function handleLowStockProducts(ctx: any, params: any) {
  try {
    const { threshold = 10 } = params
    
    const products = await prisma.product.findMany({
      where: {
        quantity: { lte: threshold },
        status: 'ACTIVE'
      },
      orderBy: { quantity: 'asc' }
    })
    
    if (products.length === 0) {
      await ctx.reply(`✅ Нет товаров с остатком меньше ${threshold} шт.`)
      return
    }
    
    let message = `⚠️ *Товары с низким остатком \\(≤${threshold}\\):*\\n\\n`
    
    for (const product of products) {
      message += `📦 ${escapeMarkdownV2(product.name)}\\n`
      message += `   📊 Остаток: ${product.quantity} шт\\.\\n\\n`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting low stock products:', error)
    await ctx.reply('❌ Ошибка при получении товаров с низким остатком')
  }
}

export async function handleOutOfStockProducts(ctx: any, params: any) {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { quantity: 0 },
          { status: 'OUT_OF_STOCK' }
        ]
      }
    })
    
    if (products.length === 0) {
      await ctx.reply('✅ Все товары в наличии')
      return
    }
    
    let message = `❌ *Товары не в наличии:*\\n\\n`
    
    for (const product of products) {
      message += `• ${escapeMarkdownV2(product.name)} \\(ID: ${escapeMarkdownV2(product.id)}\\)\\n`
    }
    
    message += `\\n_Всего: ${products.length} товаров_`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting out of stock products:', error)
    await ctx.reply('❌ Ошибка при получении товаров не в наличии')
  }
}

export async function handleDuplicateProduct(ctx: any, params: any) {
  try {
    const { productId } = params
    
    if (!productId) {
      await ctx.reply('❌ Укажите ID товара для дублирования')
      return
    }
    
    const original = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!original) {
      await ctx.reply('❌ Товар не найден')
      return
    }
    
    const duplicate = await prisma.product.create({
      data: {
        name: `${original.name} (копия)`,
        description: original.description,
        price: original.price,
        quantity: original.quantity,
        weight: original.weight,
        brand: original.brand,
        status: original.status,
        category: original.category,
        images: original.images
      }
    })
    
    await ctx.reply(
      `✅ Товар дублирован\\!\\n\\n` +
      `🆔 Новый ID: \`${escapeMarkdownV2(duplicate.id)}\`\\n` +
      `📦 ${escapeMarkdownV2(duplicate.name)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error duplicating product:', error)
    await ctx.reply('❌ Ошибка при дублировании товара')
  }
}