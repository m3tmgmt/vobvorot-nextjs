import { Bot, Context, session, GrammyError, HttpError } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { Menu } from '@grammyjs/menu'
import { cloudinaryService } from './cloudinary'

// Типы для контекста
interface SessionData {
  step?: string
  productData?: any
  orderFilter?: string
  refundOrderId?: string
  refundReason?: string
  maxRefundAmount?: number
  editingProductId?: string
}

type MyContext = Context & {
  session: SessionData
  conversation: any
}

// Проверка обязательных переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.split(',') || []

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in environment variables')
}

if (ADMIN_IDS.length === 0) {
  throw new Error('TELEGRAM_OWNER_CHAT_ID is required in environment variables')
}

// Инициализация бота с botInfo для serverless среды
const botInfo = {
  id: parseInt(BOT_TOKEN.split(':')[0]),
  is_bot: true,
  first_name: 'VobvorotAdminBot',
  username: 'VobvorotAdminBot',
  can_join_groups: false,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false
}

const bot = new Bot<MyContext>(BOT_TOKEN, { 
  botInfo: botInfo 
})

// Сессии и конверсации
bot.use(session({ initial: (): SessionData => ({}) }))
bot.use(conversations())

function isAdmin(ctx: MyContext): boolean {
  return ADMIN_IDS.includes(ctx.from?.id.toString() || '')
}

// Главное меню
const mainMenu = new Menu<MyContext>('main-menu')
  .text('📦 Заказы', (ctx) => ctx.conversation.enter('manageOrders'))
  .text('🛍️ Товары', (ctx) => ctx.conversation.enter('manageProducts'))
  .row()
  .text('🏷️ Категории', (ctx) => ctx.conversation.enter('manageCategories'))
  .text('📊 Статистика', (ctx) => ctx.conversation.enter('viewStats'))
  .row()
  .text('🎬 Видео главной', (ctx) => ctx.conversation.enter('manageHomeVideo'))
  .text('✍️ Видео подписи', (ctx) => ctx.conversation.enter('manageSignVideos'))
  .row()
  .text('💬 Отзывы', (ctx) => ctx.conversation.enter('manageReviews'))
  .text('👥 Клиенты', (ctx) => ctx.conversation.enter('manageCustomers'))

bot.use(mainMenu)

// Обработчик текстовых сообщений для возврата средств и управления товарами
bot.on('message:text', async (ctx) => {
  if (!isAdmin(ctx)) return

  const text = ctx.message.text
  
  if (ctx.session.step === 'waiting_refund_reason') {
    await processRefundReason(ctx, text)
  } else if (ctx.session.step === 'waiting_refund_amount') {
    await processRefundAmount(ctx, text)
  } else if (ctx.session.step === 'waiting_video_url') {
    await processVideoUrl(ctx, text)
  } else if (ctx.session.step?.startsWith('editing_')) {
    await processFieldEdit(ctx, text)
  }
})

// Старт бота
bot.command('start', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.')
    return
  }

  await ctx.reply(
    '🚀 *VobVorot Store Management*\n\n' +
    'Добро пожаловать в систему управления магазином!\n' +
    'Выберите раздел для работы:',
    { 
      parse_mode: 'Markdown',
      reply_markup: mainMenu
    }
  )
})

// Конверсация для управления заказами
async function manageOrders(conversation: any, ctx: MyContext) {
  await ctx.reply('📦 *Управление заказами*', { parse_mode: 'Markdown' })
  
  const ordersMenu = new Menu<MyContext>('orders-menu')
    .text('🆕 Новые заказы', async (ctx) => {
      await showOrders(ctx, 'pending')
    })
    .text('🔄 В обработке', async (ctx) => {
      await showOrders(ctx, 'processing')
    })
    .row()
    .text('📦 Отправленные', async (ctx) => {
      await showOrders(ctx, 'shipped')
    })
    .text('✅ Завершенные', async (ctx) => {
      await showOrders(ctx, 'completed')
    })
    .row()
    .text('🔍 Поиск заказа', async (ctx) => {
      await ctx.reply('Введите номер заказа или email клиента:')
      const response = await conversation.wait()
      await searchOrder(ctx, response.message?.text || '')
    })
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: ordersMenu })
}

// Конверсация для управления товарами
async function manageProducts(conversation: any, ctx: MyContext) {
  await ctx.reply('🛍️ *Управление товарами*', { parse_mode: 'Markdown' })
  
  const productsMenu = new Menu<MyContext>('products-menu')
    .text('➕ Добавить товар', async (ctx) => {
      await ctx.conversation.enter('addProduct')
    })
    .text('📝 Редактировать', async (ctx) => {
      await showProductsList(ctx, 'edit')
    })
    .row()
    .text('📸 Обновить медиа', async (ctx) => {
      await showProductsList(ctx, 'media')
    })
    .text('💰 Изменить цены', async (ctx) => {
      await showProductsList(ctx, 'prices')
    })
    .row()
    .text('📊 Остатки товаров', async (ctx) => {
      await showInventory(ctx)
    })
    .text('🗑️ Удалить товар', async (ctx) => {
      await showProductsList(ctx, 'delete')
    })
    .row()
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: productsMenu })
}

// Конверсация для управления категориями
async function manageCategories(conversation: any, ctx: MyContext) {
  await ctx.reply('🏷️ *Управление категориями*', { parse_mode: 'Markdown' })
  
  const categoriesMenu = new Menu<MyContext>('categories-menu')
    .text('➕ Добавить категорию', async (ctx) => {
      await createCategoryConversation(conversation, ctx)
    })
    .text('📋 Список категорий', async (ctx) => {
      await showCategoriesList(ctx)
    })
    .row()
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.reply('Выберите действие:', { reply_markup: categoriesMenu })
}

async function createCategoryConversation(conversation: any, ctx: MyContext) {
  await ctx.reply('📝 *Создание новой категории*\n\nВведите название категории:', { parse_mode: 'Markdown' })
  
  const nameResponse = await conversation.wait()
  const categoryName = nameResponse.message?.text
  
  if (!categoryName || categoryName.trim().length === 0) {
    await ctx.reply('❌ Некорректное название категории. Попробуйте еще раз.')
    return
  }

  await ctx.reply('😄 *Выбор эмодзи для категории*\n\nВыберите эмодзи из предложенных или отправьте свой:', { 
    parse_mode: 'Markdown' 
  })

  // Создаем меню с популярными эмодзи
  const emojiMenu = new Menu<MyContext>('emoji-menu')
    .text('🛍️', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '🛍️'))
    .text('👕', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '👕'))
    .text('👟', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '👟'))
    .text('👜', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '👜'))
    .row()
    .text('💍', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '💍'))
    .text('🎩', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '🎩'))
    .text('⌚', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '⌚'))
    .text('📱', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '📱'))
    .row()
    .text('🏠', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '🏠'))
    .text('🎮', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '🎮'))
    .text('📚', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '📚'))
    .text('🎨', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '🎨'))
    .row()
    .text('⚽', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '⚽'))
    .text('🚗', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '🚗'))
    .text('✨', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '✨'))
    .text('📦', (ctx) => finalizeCategoryCreation(ctx, categoryName.trim(), '📦'))

  await ctx.reply('Популярные эмодзи:', { reply_markup: emojiMenu })

  // Ожидаем пользовательский эмодзи
  const emojiResponse = await conversation.wait()
  const customEmoji = emojiResponse.message?.text
  
  if (customEmoji && customEmoji.length <= 10) {
    await finalizeCategoryCreation(ctx, categoryName.trim(), customEmoji)
  } else {
    await finalizeCategoryCreation(ctx, categoryName.trim(), '📦') // Дефолтный эмодзи
  }
}

// Конверсация для добавления нового товара
async function addProduct(conversation: any, ctx: MyContext) {
  await ctx.reply('➕ *Добавление нового товара*\n\nВведите название товара:', { parse_mode: 'Markdown' })
  
  const productData: any = {}
  
  // Название
  const nameResponse = await conversation.wait()
  productData.name = nameResponse.message?.text
  
  // Описание
  await ctx.reply('Введите описание товара:')
  const descResponse = await conversation.wait()
  productData.description = descResponse.message?.text
  
  // Бренд
  await ctx.reply('Введите бренд (или пропустите, отправив "-"):')
  const brandResponse = await conversation.wait()
  productData.brand = brandResponse.message?.text === '-' ? null : brandResponse.message?.text
  
  // Категория
  const categories = await getCategories()
  const categoryText = categories.map((cat: any, index: number) => `${index + 1}. ${cat.name}`).join('\n')
  await ctx.reply(`Выберите категорию:\n${categoryText}\n\nВведите номер:`)
  
  const catResponse = await conversation.wait()
  const catIndex = parseInt(catResponse.message?.text || '1') - 1
  productData.categoryId = categories[catIndex]?.id
  
  // Цена
  await ctx.reply('Введите цену в долларах (например: 29.99):')
  const priceResponse = await conversation.wait()
  productData.price = parseFloat(priceResponse.message?.text || '0')
  
  // Количество
  await ctx.reply('Введите количество на складе:')
  const stockResponse = await conversation.wait()
  productData.stock = parseInt(stockResponse.message?.text || '0')
  
  // Вес товара (для расчета доставки)
  await ctx.reply('⚖️ Введите вес товара в килограммах (например: 0.5 или 1.2):\n\n💡 *Это нужно для автоматического расчета стоимости доставки по тарифам Meest*', { parse_mode: 'Markdown' })
  const weightResponse = await conversation.wait()
  productData.weight = parseFloat(weightResponse.message?.text || '0.5')
  
  // Размеры (опционально)
  await ctx.reply('Введите доступные размеры через запятую (или пропустите, отправив "-"):')
  const sizesResponse = await conversation.wait()
  productData.sizes = sizesResponse.message?.text === '-' ? [] : sizesResponse.message?.text?.split(',').map((s: string) => s.trim())
  
  // Сохранение товара
  try {
    const newProduct = await createProduct(productData)
    await ctx.reply(`✅ Товар успешно добавлен!\n\n📦 *${newProduct.name}*\n💰 $${newProduct.price}\n📦 Количество: ${newProduct.stock}\n⚖️ Вес: ${newProduct.weight || 0.5} кг`, { parse_mode: 'Markdown' })
    
    // Предложение загрузить видео для фона
    await ctx.reply('🎬 Хотите загрузить видео для фона карточки товара? Отправьте видео или нажмите /skip')
    
    const videoResponse = await conversation.wait()
    
    if (videoResponse.message?.video || videoResponse.message?.document) {
      try {
        const video = videoResponse.message.video || videoResponse.message.document
        await ctx.reply('🎬 Загружаю видео в Cloudinary...')
        
        const file = await bot.api.getFile(video.file_id)
        if (!file.file_path) throw new Error('Не удалось получить путь к файлу')
        
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
        
        const uploadResult = await cloudinaryService.uploadFromUrl(fileUrl, {
          resource_type: 'video',
          folder: `products/${newProduct.slug}`,
          public_id: `${newProduct.slug}-hero-video`,
          overwrite: true,
          transformation: [
            { width: 1920, height: 1080, crop: 'fill' },
            { quality: 'auto:good' }
          ]
        })
        
        // Сохраняем URL видео в базе данных
        await updateProductVideo(newProduct.id, uploadResult.secure_url)
        
        await ctx.reply(
          `✅ Видео для фона загружено!\n` +
          `🔗 URL: ${uploadResult.secure_url}\n` +
          `📐 Размер: ${uploadResult.width}x${uploadResult.height}`
        )
      } catch (error: any) {
        await ctx.reply(`❌ Ошибка загрузки видео: ${error.message}`)
      }
    }
    
    // Предложение загрузить фото
    await ctx.reply('📸 Теперь загрузите фотографии товара. Отправьте изображения или нажмите /skip')
    
    let photoCount = 0
    let isFirstPhoto = true
    
    while (true) {
      const response = await conversation.wait()
      
      if (response.message?.text === '/skip') break
      
      if (response.message?.photo) {
        try {
          const photo = response.message.photo[response.message.photo.length - 1]
          const file = await bot.api.getFile(photo.file_id)
          
          if (!file.file_path) throw new Error('Не удалось получить путь к файлу')
          
          const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
          
          const uploadResult = await cloudinaryService.uploadFromUrl(fileUrl, {
            folder: `products/${newProduct.slug}`,
            public_id: `${newProduct.slug}-${photoCount + 1}`,
            overwrite: true
          })
          
          await updateProductImages(newProduct.id, {
            cloudinary_public_id: uploadResult.public_id,
            cloudinary_url: uploadResult.secure_url,
            is_main: isFirstPhoto
          })
          
          photoCount++
          isFirstPhoto = false
          
          await ctx.reply(
            `✅ Фото ${photoCount} загружено!\n` +
            `📐 Размер: ${uploadResult.width}x${uploadResult.height}\n` +
            `Отправьте еще фото или /skip для завершения`
          )
        } catch (error: any) {
          await ctx.reply(`❌ Ошибка загрузки фото: ${error.message}`)
        }
      } else {
        await ctx.reply('❌ Пожалуйста, отправьте изображение или /skip')
      }
    }
    
    await ctx.reply(
      `🎉 Товар полностью настроен!\n` +
      `📸 Загружено ${photoCount} фото\n` +
      `${productData.videoUrl ? '🎬 Видео для фона загружено\n' : ''}` +
      `✨ Все медиа файлы оптимизированы`,
      { reply_markup: mainMenu }
    )
    
  } catch (error) {
    await ctx.reply(`❌ Ошибка при создании товара: ${error}`)
  }
}

// Конверсация для управления видео на главной странице
async function manageHomeVideo(conversation: any, ctx: MyContext) {
  await ctx.reply('🎬 *Управление видео главной страницы*', { parse_mode: 'Markdown' })
  
  const videoMenu = new Menu<MyContext>('video-menu')
    .text('📤 Загрузить новое', async (ctx) => {
      await ctx.reply('Отправьте видео для главной страницы:')
      const response = await conversation.wait()
      
      if (response.message?.video || response.message?.document) {
        try {
          const video = response.message.video || response.message.document
          await ctx.reply('🎬 Загружаю видео...')
          
          const file = await bot.api.getFile(video.file_id)
          if (!file.file_path) throw new Error('Не удалось получить путь к файлу')
          
          const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
          
          const uploadResult = await cloudinaryService.uploadFromUrl(fileUrl, {
            resource_type: 'video',
            folder: 'home',
            public_id: 'hero-video',
            overwrite: true,
            transformation: [
              { width: 1920, height: 1080, crop: 'fill' },
              { quality: 'auto:good' }
            ]
          })
          
          await updateHomeVideo(uploadResult.secure_url)
          
          await ctx.reply(
            `✅ Видео главной страницы обновлено!\n` +
            `🔗 URL: ${uploadResult.secure_url}`
          )
        } catch (error: any) {
          await ctx.reply(`❌ Ошибка: ${error.message}`)
        }
      } else {
        await ctx.reply('❌ Пожалуйста, отправьте видео файл')
      }
    })
    .text('🗑️ Удалить текущее', async (ctx) => {
      try {
        await cloudinaryService.deleteImage('home/hero-video')
        await updateHomeVideo(null)
        await ctx.reply('✅ Видео главной страницы удалено')
      } catch (error: any) {
        await ctx.reply(`❌ Ошибка: ${error.message}`)
      }
    })
    .row()
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: videoMenu })
}

// Конверсация для управления видео на странице подписи
async function manageSignVideos(conversation: any, ctx: MyContext) {
  await ctx.reply('✍️ *Управление видео страницы "Your Name, My Pic"*', { parse_mode: 'Markdown' })
  
  // Получаем текущие видео
  const currentVideos = await getSignVideos()
  
  if (currentVideos.length > 0) {
    await ctx.reply(
      `📹 Текущие видео (${currentVideos.length}):\n\n` +
      currentVideos.map((video: any, index: number) => 
        `${index + 1}. ${video.title || `Видео ${index + 1}`}\n🔗 ${video.url}`
      ).join('\n\n'),
      { parse_mode: 'Markdown' }
    )
  } else {
    await ctx.reply('📭 Нет загруженных видео для страницы подписи')
  }
  
  const signVideoMenu = new Menu<MyContext>('sign-video-menu')
    .text('➕ Добавить видео', async (ctx) => {
      await ctx.reply('Отправьте видео для страницы подписи:')
      const response = await conversation.wait()
      
      if (response.message?.video || response.message?.document) {
        try {
          const video = response.message.video || response.message.document
          await ctx.reply('🎬 Загружаю видео...')
          
          const file = await bot.api.getFile(video.file_id)
          if (!file.file_path) throw new Error('Не удалось получить путь к файлу')
          
          const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
          
          // Загружаем видео в Cloudinary
          const uploadResult = await cloudinaryService.uploadFromUrl(fileUrl, {
            resource_type: 'video',
            folder: 'sign-page',
            public_id: `sign-video-${Date.now()}`,
            transformation: [
              { width: 1920, height: 1080, crop: 'fill' },
              { quality: 'auto:good' }
            ]
          })
          
          // Спрашиваем название для видео
          await ctx.reply('Введите название для этого видео (или отправьте "-" для пропуска):')
          const titleResponse = await conversation.wait()
          const title = titleResponse.message?.text === '-' ? null : titleResponse.message?.text
          
          // Добавляем видео в список
          const videos = await getSignVideos()
          videos.push({
            url: uploadResult.secure_url,
            title: title || `Видео ${videos.length + 1}`
          })
          
          await updateSignVideos(videos)
          
          await ctx.reply(
            `✅ Видео добавлено!\n` +
            `📹 Название: ${title || `Видео ${videos.length}`}\n` +
            `🔗 URL: ${uploadResult.secure_url}\n` +
            `📐 Размер: ${uploadResult.width}x${uploadResult.height}`
          )
        } catch (error: any) {
          await ctx.reply(`❌ Ошибка: ${error.message}`)
        }
      } else {
        await ctx.reply('❌ Пожалуйста, отправьте видео файл')
      }
    })
    .text('📋 Список видео', async (ctx) => {
      const videos = await getSignVideos()
      if (videos.length === 0) {
        await ctx.reply('📭 Нет загруженных видео')
      } else {
        await ctx.reply(
          `📹 Все видео (${videos.length}):\n\n` +
          videos.map((video: any, index: number) => 
            `${index + 1}. ${video.title}\n🔗 ${video.url}`
          ).join('\n\n'),
          { parse_mode: 'Markdown' }
        )
      }
    })
    .row()
    .text('🗑️ Удалить видео', async (ctx) => {
      const videos = await getSignVideos()
      if (videos.length === 0) {
        await ctx.reply('📭 Нет видео для удаления')
        return
      }
      
      await ctx.reply(
        `Выберите видео для удаления:\n\n` +
        videos.map((video: any, index: number) => 
          `${index + 1}. ${video.title}`
        ).join('\n') +
        '\n\nВведите номер видео:'
      )
      
      const response = await conversation.wait()
      const index = parseInt(response.message?.text || '0') - 1
      
      if (index >= 0 && index < videos.length) {
        const removed = videos.splice(index, 1)[0]
        await updateSignVideos(videos)
        await ctx.reply(`✅ Видео "${removed.title}" удалено`)
      } else {
        await ctx.reply('❌ Неверный номер видео')
      }
    })
    .text('🔄 Изменить порядок', async (ctx) => {
      const videos = await getSignVideos()
      if (videos.length < 2) {
        await ctx.reply('❌ Недостаточно видео для изменения порядка')
        return
      }
      
      await ctx.reply(
        `Текущий порядок:\n\n` +
        videos.map((video: any, index: number) => 
          `${index + 1}. ${video.title}`
        ).join('\n') +
        '\n\nВведите новый порядок через запятую (например: 3,1,2):'
      )
      
      const response = await conversation.wait()
      const newOrder = response.message?.text?.split(',').map((n: string) => parseInt(n.trim()) - 1)
      
      if (newOrder && newOrder.length === videos.length) {
        const reorderedVideos = newOrder.map((i: number) => videos[i]).filter(Boolean)
        if (reorderedVideos.length === videos.length) {
          await updateSignVideos(reorderedVideos)
          await ctx.reply('✅ Порядок видео изменен')
        } else {
          await ctx.reply('❌ Неверный формат порядка')
        }
      } else {
        await ctx.reply('❌ Неверный формат порядка')
      }
    })
    .row()
    .text('🗑️ Удалить все', async (ctx) => {
      await ctx.reply('⚠️ Вы уверены, что хотите удалить все видео? Отправьте "ДА" для подтверждения:')
      const response = await conversation.wait()
      
      if (response.message?.text?.toUpperCase() === 'ДА') {
        await updateSignVideos([])
        await ctx.reply('✅ Все видео страницы подписи удалены')
      } else {
        await ctx.reply('❌ Удаление отменено')
      }
    })
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: signVideoMenu })
}

// Конверсация для просмотра статистики
async function viewStats(conversation: any, ctx: MyContext) {
  await ctx.reply('📊 *Статистика магазина*', { parse_mode: 'Markdown' })
  
  const statsMenu = new Menu<MyContext>('stats-menu')
    .text('📈 Продажи', async (ctx) => {
      const stats = await getSalesStats()
      await ctx.reply(formatSalesStats(stats), { parse_mode: 'Markdown' })
    })
    .text('🛍️ Товары', async (ctx) => {
      const stats = await getProductStats()
      await ctx.reply(formatProductStats(stats), { parse_mode: 'Markdown' })
    })
    .row()
    .text('👥 Клиенты', async (ctx) => {
      const stats = await getCustomerStats()
      await ctx.reply(formatCustomerStats(stats), { parse_mode: 'Markdown' })
    })
    .text('💰 Доходы', async (ctx) => {
      const stats = await getRevenueStats()
      await ctx.reply(formatRevenueStats(stats), { parse_mode: 'Markdown' })
    })
    .row()
    .text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

  await ctx.editMessageReplyMarkup({ reply_markup: statsMenu })
}

// Заглушки для недостающих конверсаций
async function manageReviews(conversation: any, ctx: MyContext) {
  await ctx.reply('💬 *Управление отзывами*\n\nВ разработке...', { 
    parse_mode: 'Markdown',
    reply_markup: mainMenu 
  })
}

async function manageCustomers(conversation: any, ctx: MyContext) {
  await ctx.reply('👥 *Управление клиентами*\n\nВ разработке...', { 
    parse_mode: 'Markdown',
    reply_markup: mainMenu 
  })
}

// Регистрация конверсаций
bot.use(createConversation(manageOrders))
bot.use(createConversation(manageProducts))
bot.use(createConversation(addProduct))
bot.use(createConversation(manageCategories))
bot.use(createConversation(manageHomeVideo))
bot.use(createConversation(manageSignVideos))
bot.use(createConversation(viewStats))
bot.use(createConversation(manageReviews))
bot.use(createConversation(manageCustomers))

// Обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx
  console.error(`Error while handling update ${ctx.update.update_id}:`)
  const e = err.error
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description)
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e)
  } else {
    console.error('Unknown error:', e)
  }
})

// Вспомогательные функции (заглушки для API)
async function showOrders(ctx: MyContext, status: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/orders?status=${status}`, {
      headers: { 'Authorization': `Bearer ${process.env.ADMIN_API_KEY}` }
    })
    const orders = await response.json()
    
    if (orders.length === 0) {
      await ctx.reply(`📭 Нет заказов со статусом "${status}"`)
      return
    }
    
    for (const order of orders.slice(0, 5)) {
      const orderText = formatOrderInfo(order)
      const orderMenu = createOrderMenu(order.id)
      await ctx.reply(orderText, { parse_mode: 'Markdown', reply_markup: orderMenu })
    }
  } catch (error) {
    await ctx.reply('❌ Ошибка при загрузке заказов')
  }
}

async function searchOrder(ctx: MyContext, query: string) {
  await ctx.reply(`🔍 Поиск заказа: "${query}"`)
}

async function showProductsList(ctx: MyContext, action: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    await ctx.reply('⏳ Загружаю список товаров...')

    // Fetch products from API
    const response = await fetch(`${baseUrl}/api/admin/products`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    })

    if (!response.ok) {
      await ctx.reply('❌ Ошибка загрузки товаров')
      return
    }

    const result = await response.json()
    const products = result.products || []

    if (products.length === 0) {
      await ctx.reply('📭 Товары не найдены')
      return
    }

    // Create product list message
    let message = `📋 *Товары для действия: ${action}*\n\n`
    
    const productMenu = new Menu<MyContext>(`products-${action}`)
    
    products.slice(0, 10).forEach((product: any, index: number) => {
      const status = product.isActive ? '✅' : '🔒'
      const productText = `${status} ${product.name.substring(0, 25)}${product.name.length > 25 ? '...' : ''}`
      
      if (index % 2 === 0) {
        productMenu.text(productText, async (ctx) => {
          await handleProductAction(ctx, product.id, action)
        })
        if (products[index + 1]) {
          const nextProduct = products[index + 1]
          const nextStatus = nextProduct.isActive ? '✅' : '🔒'
          const nextText = `${nextStatus} ${nextProduct.name.substring(0, 25)}${nextProduct.name.length > 25 ? '...' : ''}`
          productMenu.text(nextText, async (ctx) => {
            await handleProductAction(ctx, nextProduct.id, action)
          })
        }
        productMenu.row()
      }
    })

    if (products.length > 10) {
      productMenu.text(`📄 Показать еще (${products.length - 10})`, async (ctx) => {
        // TODO: Implement pagination
        await ctx.reply('🔄 Пагинация будет добавлена в следующем обновлении')
      }).row()
    }

    productMenu.text('⬅️ Назад', (ctx) => ctx.reply('Главное меню', { reply_markup: mainMenu }))

    products.forEach((product: any, index: number) => {
      if (index < 10) {
        const status = product.isActive ? 'Активен' : 'Архивирован'
        const price = product.skus?.[0]?.price ? `$${product.skus[0].price}` : 'Цена не указана'
        message += `${index + 1}. *${product.name}*\n`
        message += `   💰 ${price} | 📊 ${status}\n`
        message += `   🏷️ ${product.category?.name || 'Без категории'}\n\n`
      }
    })

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      reply_markup: productMenu
    })

  } catch (error) {
    console.error('Error showing products list:', error)
    await ctx.reply('❌ Произошла ошибка при загрузке списка товаров')
  }
}

async function handleProductAction(ctx: MyContext, productId: string, action: string) {
  try {
    if (action === 'edit') {
      await showProductEditMenu(ctx, productId)
    } else if (action === 'delete') {
      await handleProductDelete(ctx, productId)
    } else {
      await ctx.reply(`🔧 Действие "${action}" для товара будет реализовано`)
    }
  } catch (error) {
    console.error('Error handling product action:', error)
    await ctx.reply('❌ Произошла ошибка при выполнении действия')
  }
}

async function showProductEditMenu(ctx: MyContext, productId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Get product details
    const response = await fetch(`${baseUrl}/api/admin/products?productId=${productId}`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    })

    if (!response.ok) {
      await ctx.reply('❌ Ошибка загрузки данных товара')
      return
    }

    const result = await response.json()
    const product = result.products?.find((p: any) => p.id === productId)
    
    if (!product) {
      await ctx.reply('❌ Товар не найден')
      return
    }

    const editMenu = new Menu<MyContext>(`edit-product-${productId}`)
      .text('📝 Название', async (ctx) => {
        await editProductField(ctx, productId, 'name', 'Введите новое название товара:')
      })
      .text('💰 Цена', async (ctx) => {
        await editProductField(ctx, productId, 'price', 'Введите новую цену товара ($):')
      })
      .row()
      .text('📄 Описание', async (ctx) => {
        await editProductField(ctx, productId, 'description', 'Введите новое описание товара:')
      })
      .text('🏷️ Категория', async (ctx) => {
        await showCategorySelection(ctx, productId)
      })
      .row()
      .text('🎬 Видео', async (ctx) => {
        await manageProductVideo(ctx, productId)
      })
      .text('🖼️ Изображения', async (ctx) => {
        await manageProductImages(ctx, productId)
      })
      .row()
      .text('📦 Остатки', async (ctx) => {
        await editProductField(ctx, productId, 'stock', 'Введите количество товара на складе:')
      })
      .text('📊 Статус', async (ctx) => {
        await toggleProductStatus(ctx, productId)
      })
      .row()
      .text('🗃️ Архивировать', async (ctx) => {
        await archiveProduct(ctx, productId)
      })
      .text('🗑️ Удалить', async (ctx) => {
        await confirmProductDelete(ctx, productId)
      })
      .row()
      .text('⬅️ Назад к списку', async (ctx) => {
        await showProductsList(ctx, 'edit')
      })

    const status = product.isActive ? 'Активен' : 'Архивирован'
    const price = product.skus?.[0]?.price ? `$${product.skus[0].price}` : 'Цена не указана'
    const stock = product.skus?.[0]?.stock || 0
    
    let message = `🛍️ *Редактирование товара*\n\n`
    message += `📝 *Название:* ${product.name}\n`
    message += `💰 *Цена:* ${price}\n`
    message += `📊 *Статус:* ${status}\n`
    message += `📦 *Остатки:* ${stock} шт.\n`
    message += `🏷️ *Категория:* ${product.category?.name || 'Без категории'}\n`
    
    if (product.description) {
      message += `📄 *Описание:* ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}\n`
    }
    
    message += `\n🔧 Выберите что хотите изменить:`

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      reply_markup: editMenu
    })

  } catch (error) {
    console.error('Error showing product edit menu:', error)
    await ctx.reply('❌ Произошла ошибка при загрузке меню редактирования')
  }
}

async function archiveProduct(ctx: MyContext, productId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    await ctx.reply('⏳ Архивирую товар...')

    // Set product as inactive
    const response = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ 
        productId: productId,
        status: 'inactive' 
      })
    })

    if (response.ok) {
      await ctx.reply('✅ Товар успешно архивирован!\n\n📝 Товар скрыт с сайта и не отображается клиентам')
      await showProductEditMenu(ctx, productId)
    } else {
      const error = await response.json()
      await ctx.reply(`❌ Ошибка архивации: ${error.error || 'Неизвестная ошибка'}`)
    }

  } catch (error) {
    console.error('Error archiving product:', error)
    await ctx.reply('❌ Произошла ошибка при архивации товара')
  }
}

async function toggleProductStatus(ctx: MyContext, productId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Get current product status
    const getResponse = await fetch(`${baseUrl}/api/admin/products?productId=${productId}`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    })

    if (!getResponse.ok) {
      await ctx.reply('❌ Ошибка получения данных товара')
      return
    }

    const result = await getResponse.json()
    const product = result.products?.find((p: any) => p.id === productId)
    
    if (!product) {
      await ctx.reply('❌ Товар не найден')
      return
    }

    const newStatus = product.status === 'active' ? 'inactive' : 'active'

    await ctx.reply('⏳ Изменяю статус товара...')

    // Toggle product status
    const updateResponse = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ 
        productId: productId,
        status: newStatus 
      })
    })

    if (updateResponse.ok) {
      const statusText = newStatus === 'active' ? 'активирован и доступен на сайте' : 'деактивирован и скрыт с сайта'
      await ctx.reply(`✅ Товар успешно ${statusText}!`)
      await showProductEditMenu(ctx, productId)
    } else {
      const error = await updateResponse.json()
      await ctx.reply(`❌ Ошибка изменения статуса: ${error.error || 'Неизвестная ошибка'}`)
    }

  } catch (error) {
    console.error('Error toggling product status:', error)
    await ctx.reply('❌ Произошла ошибка при изменении статуса товара')
  }
}

async function manageProductVideo(ctx: MyContext, productId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Get current product videos
    const response = await fetch(`${baseUrl}/api/admin/products/${productId}/videos`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    })

    if (!response.ok) {
      await ctx.reply('❌ Ошибка загрузки видео товара')
      return
    }

    const result = await response.json()
    const videos = result.videos || []

    const videoMenu = new Menu<MyContext>(`video-${productId}`)
      .text('➕ Добавить видео', async (ctx) => {
        await ctx.reply('🎬 Отправьте ссылку на видео для товара:')
        ctx.session.step = 'waiting_video_url'
        ctx.session.editingProductId = productId
      })

    if (videos.length > 0) {
      videoMenu.row()
      videos.forEach((video: any, index: number) => {
        videoMenu.text(`🗑️ Удалить видео ${index + 1}`, async (ctx) => {
          await deleteProductVideo(ctx, productId, video.id)
        })
        if ((index + 1) % 2 === 0) videoMenu.row()
      })
    }

    videoMenu.row().text('⬅️ Назад к редактированию', async (ctx) => {
      await showProductEditMenu(ctx, productId)
    })

    let message = `🎬 *Управление видео товара*\n\n`
    
    if (videos.length > 0) {
      message += `📹 *Текущие видео:*\n`
      videos.forEach((video: any, index: number) => {
        message += `${index + 1}. ${video.url}\n`
      })
      message += `\n`
    } else {
      message += `📭 У товара пока нет видео\n\n`
    }
    
    message += `🔧 Выберите действие:`

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      reply_markup: videoMenu
    })

  } catch (error) {
    console.error('Error managing product video:', error)
    await ctx.reply('❌ Произошла ошибка при управлении видео товара')
  }
}

async function deleteProductVideo(ctx: MyContext, productId: string, videoId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    await ctx.reply('⏳ Удаляю видео...')

    const response = await fetch(`${baseUrl}/api/admin/products/${productId}/videos`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ videoId })
    })

    if (response.ok) {
      await ctx.reply('✅ Видео успешно удалено!')
      await manageProductVideo(ctx, productId)
    } else {
      const error = await response.json()
      await ctx.reply(`❌ Ошибка удаления видео: ${error.error || 'Неизвестная ошибка'}`)
    }

  } catch (error) {
    console.error('Error deleting product video:', error)
    await ctx.reply('❌ Произошла ошибка при удалении видео')
  }
}

async function manageProductImages(ctx: MyContext, productId: string) {
  // TODO: Implement image management
  await ctx.reply('🖼️ Управление изображениями товара будет реализовано в следующем обновлении')
}

async function editProductField(ctx: MyContext, productId: string, field: string, promptText: string) {
  try {
    ctx.session.editingProductId = productId
    ctx.session.step = `editing_${field}`
    
    if (field === 'category') {
      await showCategorySelection(ctx, productId)
      return
    }
    
    // For other fields, prompt for text input
    await ctx.reply(`📝 ${promptText}\n\nВведите новое значение:`)
    
  } catch (error: any) {
    await ctx.reply(`❌ Ошибка: ${error.message}`)
  }
}

async function showCategorySelection(ctx: MyContext, productId: string) {
  try {
    const categories = await getCategories()
    
    const categoryMenu = new Menu<MyContext>('category-selection')
    
    categories.forEach((category: any) => {
      categoryMenu.text(`${category.emoji} ${category.name}`, async (ctx) => {
        await updateProductField(ctx, productId, 'category', {
          name: category.name,
          slug: category.slug
        })
      })
      if (categories.indexOf(category) % 2 === 1) {
        categoryMenu.row()
      }
    })
    
    categoryMenu.row()
    categoryMenu.text('⬅️ Назад', async (ctx) => {
      await showProductEditMenu(ctx, productId)
    })
    
    await ctx.reply('🏷️ Выберите новую категорию:', { reply_markup: categoryMenu })
    
  } catch (error: any) {
    await ctx.reply(`❌ Ошибка: ${error.message}`)
  }
}

async function confirmProductDelete(ctx: MyContext, productId: string) {
  // TODO: Implement delete confirmation
  await ctx.reply('🗑️ Подтверждение удаления будет реализовано в следующем обновлении')
}

async function handleProductDelete(ctx: MyContext, productId: string) {
  // TODO: Implement product deletion
  await ctx.reply('🗑️ Удаление товара будет реализовано в следующем обновлении')
}

async function showInventory(ctx: MyContext) {
  await ctx.reply('📊 *Остатки товаров*', { parse_mode: 'Markdown' })
}

async function getCategories() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      return []
    }

    const response = await fetch(`${baseUrl}/api/admin/categories-db`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      return result.categories || []
    }
    
    return []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

async function createProduct(productData: any) {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/products-db`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify(productData)
  })
  return response.json()
}

async function updateProductVideo(productId: string, videoUrl: string) {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/products/${productId}/video`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify({ videoUrl })
  })
  return response.json()
}

async function updateProductImages(productId: string, imageData: any) {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/products/${productId}/images`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify(imageData)
  })
  return response.json()
}

async function updateHomeVideo(videoUrl: string | null) {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/home-video`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify({ videoUrl })
  })
  return response.json()
}

async function getSignVideos(): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/sign-videos`)
    const data = await response.json()
    return data.videos || []
  } catch (error) {
    console.error('Error fetching sign videos:', error)
    return []
  }
}

async function updateSignVideos(videos: any[]) {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/sign-videos`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify({ videos })
  })
  return response.json()
}

async function getSalesStats() {
  return {}
}

async function getProductStats() {
  return {}
}

async function getCustomerStats() {
  return {}
}

async function getRevenueStats() {
  return {}
}

function formatOrderInfo(order: any): string {
  return `📦 *Заказ #${order.id}*\n💰 $${order.total}\n👤 ${order.customerName}\n📅 ${order.createdAt}`
}

function formatSalesStats(stats: any): string {
  return '📈 *Статистика продаж*\n\nЗагружается...'
}

function formatProductStats(stats: any): string {
  return '🛍️ *Статистика товаров*\n\nЗагружается...'
}

function formatCustomerStats(stats: any): string {
  return '👥 *Статистика клиентов*\n\nЗагружается...'
}

function formatRevenueStats(stats: any): string {
  return '💰 *Статистика доходов*\n\nЗагружается...'
}

function createOrderMenu(orderId: string) {
  return new Menu<MyContext>(`order-${orderId}`)
    .text('✅ Подтвердить', (ctx) => updateOrderStatus(ctx, orderId, 'confirmed'))
    .text('📦 Отправить', (ctx) => updateOrderStatus(ctx, orderId, 'shipped'))
    .row()
    .text('❌ Отменить', (ctx) => updateOrderStatus(ctx, orderId, 'cancelled'))
    .text('💸 Возврат', (ctx) => handleRefundOrder(ctx, orderId))
    .row()
    .text('👁️ Детали', (ctx) => showOrderDetails(ctx, orderId))
}

async function updateOrderStatus(ctx: MyContext, orderId: string, status: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Обновляем статус заказа через API
    const response = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ status })
    })

    if (response.ok) {
      const result = await response.json()
      const statusText = getStatusText(status)
      await ctx.reply(`✅ Статус заказа #${orderId} изменен на "${statusText}"`)
      
      // Отправляем уведомление клиенту о смене статуса
      if (result.order?.customer?.telegramChatId) {
        try {
          await ctx.api.sendMessage(
            result.order.customer.telegramChatId,
            `📦 Статус вашего заказа #${orderId} изменен на "${statusText}"`
          )
        } catch (error) {
          console.log('Could not notify customer:', error)
        }
      }
    } else {
      const error = await response.json()
      await ctx.reply(`❌ Ошибка обновления статуса: ${error.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    await ctx.reply('❌ Произошла ошибка при обновлении статуса заказа')
  }
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Ожидает обработки',
    'confirmed': 'Подтвержден',
    'processing': 'В обработке', 
    'shipped': 'Отправлен',
    'delivered': 'Доставлен',
    'cancelled': 'Отменен'
  }
  return statusMap[status] || status
}

async function showOrderDetails(ctx: MyContext, orderId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Получаем детали заказа через API
    const response = await fetch(`${baseUrl}/api/admin/orders?orderId=${orderId}`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      const order = result.orders?.find((o: any) => o.id === orderId)
      
      if (order) {
        const statusText = getStatusText(order.status)
        const paymentStatusText = getPaymentStatusText(order.paymentStatus)
        
        let message = `📋 *Детали заказа #${orderId}*\n\n`
        message += `📊 Статус: ${statusText}\n`
        message += `💳 Платеж: ${paymentStatusText}\n`
        message += `💰 Сумма: $${order.total}\n`
        message += `📅 Дата: ${new Date(order.createdAt).toLocaleDateString('ru-RU')}\n\n`
        
        if (order.customer) {
          message += `👤 *Клиент:*\n`
          message += `${order.customer.name || 'N/A'}\n`
          message += `📧 ${order.customer.email || 'N/A'}\n`
          if (order.customer.phone) message += `📞 ${order.customer.phone}\n`
          message += `\n`
        }
        
        if (order.shippingAddress) {
          message += `🏠 *Адрес доставки:*\n`
          message += `${order.shippingAddress.street}\n`
          message += `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}\n`
          message += `${order.shippingAddress.country}\n\n`
        }
        
        if (order.items && order.items.length > 0) {
          message += `🛍️ *Товары:*\n`
          order.items.forEach((item: any, index: number) => {
            message += `${index + 1}. ${item.productName}\n`
            message += `   Количество: ${item.quantity}\n`
            message += `   Цена: $${item.price}\n\n`
          })
        }
        
        if (order.trackingNumber) {
          message += `📦 Трек-номер: \`${order.trackingNumber}\`\n`
        }
        
        await ctx.reply(message, { parse_mode: 'Markdown' })
      } else {
        await ctx.reply(`❌ Заказ #${orderId} не найден`)
      }
    } else {
      await ctx.reply('❌ Ошибка получения данных заказа')
    }
  } catch (error) {
    console.error('Error showing order details:', error)
    await ctx.reply('❌ Произошла ошибка при получении деталей заказа')
  }
}

function getPaymentStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Ожидает оплаты',
    'completed': 'Оплачен',
    'failed': 'Ошибка оплаты',
    'refunded': 'Возвращен'
  }
  return statusMap[status] || status
}

async function handleRefundOrder(ctx: MyContext, orderId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Get refund information for the order first
    const infoResponse = await fetch(`${baseUrl}/api/orders/${orderId}/refund`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    })

    if (!infoResponse.ok) {
      await ctx.reply('❌ Ошибка получения информации о заказе')
      return
    }

    const refundInfo = await infoResponse.json()

    if (!refundInfo.canRefund) {
      let reason = 'Заказ не может быть возвращен'
      if (refundInfo.currentStatus === 'REFUNDED') {
        reason = 'Заказ уже полностью возвращен'
      } else if (refundInfo.paymentStatus !== 'COMPLETED') {
        reason = 'Заказ не был оплачен'
      }
      await ctx.reply(`❌ ${reason}`)
      return
    }

    // Show refund confirmation with details
    let message = `💸 *Возврат средств для заказа #${orderId}*\n\n`
    message += `💰 Сумма заказа: $${refundInfo.totalAmount}\n`
    
    if (refundInfo.hasPartialRefund) {
      message += `🔄 Уже возвращено: $${refundInfo.refundedAmount}\n`
      message += `💸 Доступно к возврату: $${refundInfo.maxRefundAmount}\n\n`
    } else {
      message += `💸 К возврату: $${refundInfo.maxRefundAmount}\n\n`
    }
    
    message += `❓ Укажите причину возврата или отправьте "полный" для полного возврата:`

    await ctx.reply(message, { parse_mode: 'Markdown' })

    // Set conversation state to wait for refund reason
    ctx.session.step = 'waiting_refund_reason'
    ctx.session.refundOrderId = orderId
    ctx.session.maxRefundAmount = refundInfo.maxRefundAmount

  } catch (error) {
    console.error('Error handling refund order:', error)
    await ctx.reply('❌ Произошла ошибка при обработке возврата')
  }
}

// Handle refund reason input (add this to message handler)
async function processRefundReason(ctx: MyContext, reason: string) {
  try {
    const orderId = ctx.session.refundOrderId
    const maxAmount = ctx.session.maxRefundAmount
    
    if (!orderId) {
      await ctx.reply('❌ Ошибка: не найден заказ для возврата')
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    // Get admin ID from Telegram user (you might want to store this mapping)
    const adminId = ctx.from?.id?.toString() || 'telegram_admin'

    // Process full refund or ask for custom amount
    if (reason.toLowerCase().includes('полный')) {
      await processFullRefund(ctx, orderId, 'Полный возврат по запросу администратора', adminId, maxAmount || 0)
    } else {
      // Ask for custom amount
      await ctx.reply(
        `💸 Укажите сумму возврата (максимум $${maxAmount}) или отправьте "максимум" для полного возврата:`
      )
      ctx.session.step = 'waiting_refund_amount'
      ctx.session.refundReason = reason
    }

  } catch (error) {
    console.error('Error processing refund reason:', error)
    await ctx.reply('❌ Произошла ошибка при обработке причины возврата')
  }
}

async function processRefundAmount(ctx: MyContext, amountText: string) {
  try {
    const orderId = ctx.session.refundOrderId
    const reason = ctx.session.refundReason
    const maxAmount = ctx.session.maxRefundAmount
    
    if (!orderId || !reason) {
      await ctx.reply('❌ Ошибка: не найдены данные для возврата')
      return
    }

    const adminId = ctx.from?.id?.toString() || 'telegram_admin'

    if (amountText.toLowerCase().includes('максимум')) {
      await processFullRefund(ctx, orderId, reason, adminId, maxAmount || 0)
      return
    }

    // Parse amount
    const amount = parseFloat(amountText.replace(/[^0-9.]/g, ''))
    
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Некорректная сумма. Укажите число больше 0')
      return
    }

    if (amount > (maxAmount || 0)) {
      await ctx.reply(`❌ Сумма превышает максимальную доступную для возврата ($${maxAmount || 0})`)
      return
    }

    await processRefund(ctx, orderId, reason, adminId, amount)

  } catch (error) {
    console.error('Error processing refund amount:', error)
    await ctx.reply('❌ Произошла ошибка при обработке суммы возврата')
  }
}

async function processFullRefund(ctx: MyContext, orderId: string, reason: string, adminId: string, amount: number) {
  await processRefund(ctx, orderId, reason, adminId, amount)
}

async function processRefund(ctx: MyContext, orderId: string, reason: string, adminId: string, amount: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY

    await ctx.reply('⏳ Обрабатываю возврат...')

    const response = await fetch(`${baseUrl}/api/orders/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({
        reason,
        amount,
        adminId,
        notifyCustomer: true
      })
    })

    if (response.ok) {
      const result = await response.json()
      await ctx.reply(
        `✅ Возврат успешно обработан!\n\n` +
        `💸 Сумма: $${result.refundAmount}\n` +
        `🆔 ID возврата: ${result.refundId}\n` +
        `📋 ${result.message}\n\n` +
        `📧 Клиент уведомлен по email`
      )
    } else {
      const error = await response.json()
      await ctx.reply(`❌ Ошибка возврата: ${error.error || 'Неизвестная ошибка'}`)
    }

    // Clear session
    ctx.session.step = undefined
    ctx.session.refundOrderId = undefined
    ctx.session.refundReason = undefined
    ctx.session.maxRefundAmount = undefined

  } catch (error) {
    console.error('Error processing refund:', error)
    await ctx.reply('❌ Произошла ошибка при обработке возврата')
  }
}

async function processVideoUrl(ctx: MyContext, videoUrl: string) {
  try {
    const productId = ctx.session.editingProductId
    
    if (!productId) {
      await ctx.reply('❌ Ошибка: не найден товар для добавления видео')
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Validate URL
    if (!videoUrl.startsWith('http')) {
      await ctx.reply('❌ Неверный формат ссылки. Ссылка должна начинаться с http:// или https://')
      return
    }

    await ctx.reply('⏳ Добавляю видео к товару...')

    const response = await fetch(`${baseUrl}/api/admin/products/${productId}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ videoUrl })
    })

    if (response.ok) {
      const result = await response.json()
      await ctx.reply('✅ Видео успешно добавлено к товару!')
      
      // Clear session and go back to video management
      ctx.session.step = undefined
      ctx.session.editingProductId = undefined
      
      await manageProductVideo(ctx, productId)
    } else {
      const error = await response.json()
      await ctx.reply(`❌ Ошибка добавления видео: ${error.error || 'Неизвестная ошибка'}`)
    }

  } catch (error) {
    console.error('Error processing video URL:', error)
    await ctx.reply('❌ Произошла ошибка при добавлении видео')
  }
}

async function finalizeCategoryCreation(ctx: MyContext, name: string, emoji: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    await ctx.reply('⏳ Создаю категорию...')

    const response = await fetch(`${baseUrl}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ name, emoji })
    })

    if (response.ok) {
      const result = await response.json()
      await ctx.reply(`✅ Категория "${name}" ${emoji} успешно создана!`)
      await showCategoriesList(ctx)
    } else {
      const error = await response.json()
      await ctx.reply(`❌ Ошибка создания категории: ${error.error || 'Неизвестная ошибка'}`)
    }

  } catch (error) {
    console.error('Error creating category:', error)
    await ctx.reply('❌ Произошла ошибка при создании категории')
  }
}

async function showCategoriesList(ctx: MyContext) {
  try {
    const categories = await getCategories()
    
    if (categories.length === 0) {
      await ctx.reply('📭 Категории не найдены')
      return
    }

    let message = '🏷️ *Список категорий:*\n\n'
    categories.forEach((category: any, index: number) => {
      const emoji = category.emoji || '📦'
      message += `${index + 1}. ${emoji} *${category.name}*\n   Slug: \`${category.slug}\`\n\n`
    })

    await ctx.reply(message, { parse_mode: 'Markdown' })

  } catch (error) {
    console.error('Error showing categories list:', error)
    await ctx.reply('❌ Произошла ошибка при загрузке списка категорий')
  }
}

async function processFieldEdit(ctx: MyContext, newValue: string) {
  try {
    const productId = ctx.session.editingProductId
    const step = ctx.session.step
    
    if (!productId || !step) {
      await ctx.reply('❌ Ошибка: не найдены данные для редактирования')
      return
    }
    
    const field = step.replace('editing_', '')
    let value: any = newValue.trim()
    
    // Convert values based on field type
    if (field === 'price') {
      value = parseFloat(value)
      if (isNaN(value) || value <= 0) {
        await ctx.reply('❌ Некорректная цена. Введите число больше 0:')
        return
      }
    } else if (field === 'stock') {
      value = parseInt(value)
      if (isNaN(value) || value < 0) {
        await ctx.reply('❌ Некорректное количество. Введите число больше или равное 0:')
        return
      }
    } else if (field === 'weight') {
      value = parseFloat(value)
      if (isNaN(value) || value <= 0) {
        await ctx.reply('❌ Некорректный вес. Введите число больше 0:')
        return
      }
    }
    
    await updateProductField(ctx, productId, field, value)
    
  } catch (error: any) {
    await ctx.reply(`❌ Ошибка: ${error.message}`)
  }
}

async function updateProductField(ctx: MyContext, productId: string, field: string, value: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await ctx.reply('❌ Ошибка: API ключ администратора не настроен')
      return
    }
    
    await ctx.reply('⏳ Обновляю данные товара...')
    
    const updateData: any = { productId }
    updateData[field] = value
    
    const response = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify(updateData)
    })
    
    if (response.ok) {
      const result = await response.json()
      await ctx.reply(`✅ Поле "${field}" успешно обновлено!`)
      
      // Clear session state
      ctx.session.step = undefined
      ctx.session.editingProductId = undefined
      
      // Return to edit menu
      await showProductEditMenu(ctx, productId)
    } else {
      const error = await response.json()
      await ctx.reply(`❌ Ошибка обновления: ${error.error || 'Неизвестная ошибка'}`)
    }
    
  } catch (error: any) {
    await ctx.reply(`❌ Ошибка: ${error.message}`)
  }
}

export { bot }