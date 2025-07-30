import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2 } from '../utils'

// === УПРАВЛЕНИЕ ВИДЕО ===
// ВАЖНО: В реальной БД нет таблицы Video! 
// Видео хранятся в поле videoUrl таблицы Product

export async function handleUploadMainVideo(ctx: any, params: any) {
  try {
    await ctx.reply(
      `⚠️ *Функция недоступна*\\n\\n` +
      `В текущей версии системы видео можно добавлять только к товарам.\\n` +
      `Используйте команду для добавления видео к товару.`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error in handleUploadMainVideo:', error)
    await ctx.reply('❌ Ошибка обработки команды')
  }
}

export async function handleViewMainVideos(ctx: any, params: any) {
  try {
    await ctx.reply(
      `⚠️ *Функция недоступна*\\n\\n` +
      `В текущей версии системы нет отдельных видео для главной страницы.\\n` +
      `Видео доступны только для товаров.`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error in handleViewMainVideos:', error)
    await ctx.reply('❌ Ошибка обработки команды')
  }
}

export async function handleDeleteMainVideo(ctx: any, params: any) {
  try {
    await ctx.reply(
      `⚠️ *Функция недоступна*\\n\\n` +
      `В текущей версии системы нет отдельных видео для главной страницы.`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error in handleDeleteMainVideo:', error)
    await ctx.reply('❌ Ошибка обработки команды')
  }
}

export async function handleUpdateVideoCaption(ctx: any, params: any) {
  try {
    await ctx.reply(
      `⚠️ *Функция недоступна*\\n\\n` +
      `В текущей версии системы видео не имеют отдельных подписей.\\n` +
      `Описание видео берется из описания товара.`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error in handleUpdateVideoCaption:', error)
    await ctx.reply('❌ Ошибка обработки команды')
  }
}

export async function handleToggleVideoStatus(ctx: any, params: any) {
  try {
    await ctx.reply(
      `⚠️ *Функция недоступна*\\n\\n` +
      `Статус видео управляется через статус товара.\\n` +
      `Деактивируйте товар, чтобы скрыть его видео.`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error in handleToggleVideoStatus:', error)
    await ctx.reply('❌ Ошибка обработки команды')
  }
}

export async function handleUploadProductVideo(ctx: any, params: any) {
  try {
    const { productId, videoUrl } = params
    
    if (!productId || !videoUrl) {
      await ctx.reply('❌ Укажите ID товара и URL видео')
      return
    }
    
    // Проверяем, существует ли товар
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!product) {
      await ctx.reply('❌ Товар не найден')
      return
    }
    
    // Обновляем URL видео для товара
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { videoUrl }
    })
    
    await ctx.reply(
      `✅ Видео добавлено к товару\\!\\n\\n` +
      `📦 Товар: ${escapeMarkdownV2(updatedProduct.name)}\\n` +
      `🎬 Видео: ${escapeMarkdownV2(videoUrl)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error uploading product video:', error)
    await ctx.reply('❌ Ошибка при загрузке видео к товару')
  }
}

export async function handleViewProductVideos(ctx: any, params: any) {
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
    
    if (!product.videoUrl) {
      await ctx.reply(`📭 У товара "${product.name}" нет видео`)
      return
    }
    
    let message = `🎬 *Видео товара "${escapeMarkdownV2(product.name)}":*\\n\\n`
    message += `🔗 [Смотреть видео](${product.videoUrl})\\n`
    message += `📦 ID товара: \`${escapeMarkdownV2(product.id)}\`\\n`
    if (product.description) {
      message += `📝 ${escapeMarkdownV2(product.description.substring(0, 200))}${product.description.length > 200 ? '...' : ''}`
    }
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2', disable_web_page_preview: true })
  } catch (error) {
    console.error('Error viewing product videos:', error)
    await ctx.reply('❌ Ошибка при просмотре видео товара')
  }
}

export async function handleDeleteProductVideo(ctx: any, params: any) {
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
    
    if (!product.videoUrl) {
      await ctx.reply('❌ У товара нет видео для удаления')
      return
    }
    
    // Удаляем URL видео из товара
    await prisma.product.update({
      where: { id: productId },
      data: { videoUrl: null }
    })
    
    await ctx.reply(
      `✅ Видео удалено\\!\\n\\n` +
      `📦 Товар: ${escapeMarkdownV2(product.name)}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error deleting product video:', error)
    await ctx.reply('❌ Ошибка при удалении видео товара')
  }
}

export async function handleBulkVideoUpload(ctx: any, params: any) {
  try {
    const { videos } = params
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      await ctx.reply('❌ Укажите массив видео для загрузки')
      return
    }
    
    let successCount = 0
    let errorCount = 0
    
    for (const videoData of videos) {
      try {
        if (videoData.productId && videoData.url) {
          await prisma.product.update({
            where: { id: videoData.productId },
            data: { videoUrl: videoData.url }
          })
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        console.error('Error uploading video:', error)
        errorCount++
      }
    }
    
    await ctx.reply(
      `📊 Массовая загрузка завершена\\!\\n\\n` +
      `✅ Загружено: ${successCount} видео\\n` +
      `❌ Ошибок: ${errorCount}`,
      { parse_mode: 'MarkdownV2' }
    )
  } catch (error) {
    console.error('Error bulk uploading videos:', error)
    await ctx.reply('❌ Ошибка при массовой загрузке видео')
  }
}

export async function handleVideoStatistics(ctx: any, params: any) {
  try {
    // Статистика по продуктам с видео
    const totalProducts = await prisma.product.count()
    const productsWithVideos = await prisma.product.count({
      where: {
        videoUrl: { not: null }
      }
    })
    
    const activeProductsWithVideos = await prisma.product.count({
      where: {
        videoUrl: { not: null },
        isActive: true
      }
    })
    
    let message = `📊 *Статистика видео:*\\n\\n`
    message += `📦 Всего товаров: ${totalProducts}\\n`
    message += `🎬 Товаров с видео: ${productsWithVideos}\\n`
    message += `✅ Активных товаров с видео: ${activeProductsWithVideos}\\n\\n`
    
    message += `📈 *Покрытие:*\\n`
    const coveragePercent = totalProducts > 0 ? ((productsWithVideos / totalProducts) * 100).toFixed(1) : 0
    message += `📊 Процент товаров с видео: ${coveragePercent}%`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error getting video statistics:', error)
    await ctx.reply('❌ Ошибка при получении статистики видео')
  }
}