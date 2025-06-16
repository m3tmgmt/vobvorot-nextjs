import { Bot } from 'grammy'

// Проверяем переменные окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.trim().split(',').map(id => id.trim()) || []

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required')
}

console.log('🤖 Simple VobvorotAdminBot initializing...')
console.log(`🔑 Bot token exists: ${!!BOT_TOKEN}`)
console.log(`📋 Admin IDs: ${ADMIN_IDS.join(', ')}`)

// Создаем простого бота
export const bot = new Bot(BOT_TOKEN)

// Проверка прав администратора
function isAdmin(userId: number): boolean {
  const isAdminUser = ADMIN_IDS.includes(userId.toString())
  console.log(`🔐 Checking admin rights for user ${userId}: ${isAdminUser}`)
  return isAdminUser
}

// Команда /start
bot.command('start', async (ctx) => {
  try {
    console.log(`📱 Received /start from user ${ctx.from?.id}`)
    
    if (!ctx.from) {
      console.log('❌ No user data in context')
      return
    }
    
    if (!isAdmin(ctx.from.id)) {
      console.log(`❌ Access denied for user ${ctx.from.id}`)
      await ctx.reply('❌ У вас нет доступа к этому боту')
      return
    }

    console.log(`✅ Sending welcome message to admin ${ctx.from.id}`)
    await ctx.reply(`
🤖 VobvorotAdminBot работает!

✅ Бот успешно инициализирован
✅ Вы авторизованы как администратор

📋 УПРАВЛЕНИЕ ЗАКАЗАМИ:
/orders - все заказы с фильтрами
/recent_orders - последние 10 заказов
/pending_orders - заказы в ожидании
/processing_orders - заказы в обработке
/order_stats - статистика заказов за день
/find_order <ID> - найти заказ по ID

📺 УПРАВЛЕНИЕ ВИДЕО:

🏠 ГЛАВНАЯ СТРАНИЦА:
/home_videos - управление видео главной страницы
/add_home_video <URL> - добавить видео на главную
/remove_home_video <ID> - удалить видео с главной
/list_home_videos - список видео главной

✍️ СТРАНИЦА SIGN:
/sign_videos - управление видео страницы sign
/add_sign_video <URL> - добавить видео в галерею sign
/remove_sign_video <ID> - удалить видео из галереи sign
/list_sign_videos - список всех видео sign
    `)
    
    console.log(`✅ Welcome message sent successfully`)
  } catch (error) {
    console.error('❌ Error in /start command:', error)
    try {
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
    } catch (replyError) {
      console.error('❌ Failed to send error message:', replyError)
    }
  }
})

// Команда для списка видео sign страницы
bot.command('list_sign_videos', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    console.log('📺 Fetching sign videos...')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/sign-videos`)
    const data = await response.json()
    
    if (data.videos && data.videos.length > 0) {
      let message = `📺 Видео для страницы sign (${data.count} шт.):\n\n`
      
      data.videos.forEach((video: any, index: number) => {
        message += `${index + 1}. ID: ${video.id}\n`
        message += `   URL: ${video.url}\n`
        message += `   Добавлено: ${new Date(video.createdAt).toLocaleString('ru')}\n\n`
      })
      
      await ctx.reply(message)
    } else {
      await ctx.reply('📺 Видео для страницы sign не найдены')
    }
    
  } catch (error) {
    console.error('❌ Error listing sign videos:', error)
    await ctx.reply('❌ Ошибка при получении списка видео')
  }
})

// Команда для добавления видео sign страницы
bot.command('add_sign_video', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    const args = ctx.match?.toString().trim()
    if (!args) {
      await ctx.reply('❌ Укажите URL видео. Пример: /add_sign_video https://example.com/video.mp4')
      return
    }

    console.log('📺 Adding sign video:', args)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/sign-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoUrl: args })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      await ctx.reply(`✅ Видео успешно добавлено в галерею sign!
      
📺 ID: ${data.addedVideo.id}
🔗 URL: ${data.addedVideo.url}
📊 Всего видео: ${data.count}`)
    } else {
      await ctx.reply(`❌ Ошибка добавления видео: ${data.error || 'Неизвестная ошибка'}`)
    }
    
  } catch (error) {
    console.error('❌ Error adding sign video:', error)
    await ctx.reply('❌ Ошибка при добавлении видео')
  }
})

// Команда для удаления видео sign страницы
bot.command('remove_sign_video', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    const args = ctx.match?.toString().trim()
    if (!args) {
      await ctx.reply('❌ Укажите ID видео. Пример: /remove_sign_video sign_video_1234567890')
      return
    }

    console.log('📺 Removing sign video:', args)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/sign-videos`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoId: args })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      await ctx.reply(`✅ Видео успешно удалено из галереи sign!
      
🗑️ Удаленное ID: ${data.deletedVideoId}
📊 Осталось видео: ${data.count}`)
    } else {
      await ctx.reply(`❌ Ошибка удаления видео: ${data.error || 'Неизвестная ошибка'}`)
    }
    
  } catch (error) {
    console.error('❌ Error removing sign video:', error)
    await ctx.reply('❌ Ошибка при удалении видео')
  }
})

// Команда для управления видео sign (интерактивная)
bot.command('sign_videos', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    await ctx.reply(`✍️ Управление видео для страницы SIGN:

Доступные команды:
📋 /list_sign_videos - показать все видео
➕ /add_sign_video <URL> - добавить новое видео
🗑️ /remove_sign_video <ID> - удалить видео

Пример добавления:
/add_sign_video https://example.com/video.mp4

Пример удаления:
/remove_sign_video sign_video_1234567890`)
    
  } catch (error) {
    console.error('❌ Error in sign_videos command:', error)
    await ctx.reply('❌ Ошибка команды')
  }
})

// ===== КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ ЗАКАЗАМИ =====

// Команда для отображения всех заказов с фильтрами
bot.command('orders', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    console.log('📋 Fetching all orders...')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/orders`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })
    
    if (!response.ok) {
      await ctx.reply('❌ Ошибка получения заказов')
      return
    }
    
    const data = await response.json()
    const orders = data.orders || []
    
    if (orders.length === 0) {
      await ctx.reply('📋 Заказов не найдено')
      return
    }

    let message = `📋 *УПРАВЛЕНИЕ ЗАКАЗАМИ*\n\n`
    message += `📊 Всего заказов: ${orders.length}\n`
    
    // Группируем по статусам
    const statusCounts = orders.reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
    
    message += `⏳ В ожидании: ${statusCounts.PENDING || 0}\n`
    message += `✅ Подтвержденные: ${statusCounts.CONFIRMED || 0}\n`
    message += `🔄 В обработке: ${statusCounts.PROCESSING || 0}\n`
    message += `📦 Отправленные: ${statusCounts.SHIPPED || 0}\n`
    message += `🎉 Завершенные: ${statusCounts.DELIVERED || 0}\n`
    message += `❌ Отмененные: ${statusCounts.CANCELLED || 0}\n`
    message += `💸 Возвращенные: ${statusCounts.REFUNDED || 0}\n\n`
    
    message += `**ПОСЛЕДНИЕ 10 ЗАКАЗОВ:**\n\n`

    // Создаем инлайн кнопки для каждого заказа
    const inlineKeyboards = []
    
    orders.slice(0, 10).forEach((order: any, index: number) => {
      const statusEmoji = getStatusEmoji(order.status)
      const date = new Date(order.createdAt).toLocaleDateString('ru-RU')
      
      message += `${index + 1}. ${statusEmoji} #${order.orderNumber || order.id.slice(0, 8)}\n`
      message += `   💰 $${Number(order.total)} | 👤 ${order.shippingName}\n`
      message += `   📅 ${date} | ${order.status}\n\n`
      
      // Добавляем кнопку управления для каждого заказа
      inlineKeyboards.push([
        { text: `📋 Управлять заказом #${order.orderNumber || order.id.slice(0, 8)}`, callback_data: `view_order_${order.id}` }
      ])
    })

    if (orders.length > 10) {
      message += `... и еще ${orders.length - 10} заказов\n\n`
    }

    // Создаем клавиатуру с фильтрами в конце
    inlineKeyboards.push([
      { text: '⏳ В ожидании', callback_data: 'filter_orders_PENDING' },
      { text: '✅ Подтвержденные', callback_data: 'filter_orders_CONFIRMED' }
    ])
    inlineKeyboards.push([
      { text: '🔄 В обработке', callback_data: 'filter_orders_PROCESSING' },
      { text: '📦 Отправленные', callback_data: 'filter_orders_SHIPPED' }
    ])
    inlineKeyboards.push([
      { text: '🎉 Завершенные', callback_data: 'filter_orders_DELIVERED' },
      { text: '❌ Отмененные', callback_data: 'filter_orders_CANCELLED' }
    ])
    inlineKeyboards.push([
      { text: '💸 Возвращенные', callback_data: 'filter_orders_REFUNDED' }
    ])
    
    message += `Выберите фильтр для просмотра заказов по статусу:`

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboards
      }
    })

  } catch (error) {
    console.error('❌ Error in orders command:', error)
    await ctx.reply('❌ Ошибка получения заказов')
  }
})

// Команда для последних заказов
bot.command('recent_orders', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    console.log('🕐 Fetching recent orders...')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/orders?limit=10&sort=newest`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })
    
    if (!response.ok) {
      await ctx.reply('❌ Ошибка получения последних заказов')
      return
    }
    
    const data = await response.json()
    const orders = data.orders || []
    
    if (orders.length === 0) {
      await ctx.reply('📋 Последних заказов не найдено')
      return
    }

    let message = `🕐 *ПОСЛЕДНИЕ 10 ЗАКАЗОВ*\n\n`
    
    // Создаем инлайн кнопки для каждого заказа
    const inlineKeyboards = []
    
    orders.slice(0, 10).forEach((order: any, index: number) => {
      const statusEmoji = getStatusEmoji(order.status)
      const date = new Date(order.createdAt).toLocaleDateString('ru-RU')
      const time = new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      
      message += `${index + 1}. ${statusEmoji} #${order.orderNumber || order.id.slice(0, 8)}\n`
      message += `   💰 $${Number(order.total)} | 👤 ${order.shippingName}\n`
      message += `   📅 ${date} ${time}\n\n`
      
      // Добавляем кнопку управления для каждого заказа
      inlineKeyboards.push([
        { text: `📋 Управлять заказом #${order.orderNumber || order.id.slice(0, 8)}`, callback_data: `view_order_${order.id}` }
      ])
    })

    // Добавляем кнопки для общих действий в конец
    inlineKeyboards.push([
      { text: '🔍 Найти заказ', callback_data: 'search_order' },
      { text: '📊 Статистика', callback_data: 'order_stats' }
    ])

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboards
      }
    })

  } catch (error) {
    console.error('❌ Error in recent_orders command:', error)
    await ctx.reply('❌ Ошибка получения последних заказов')
  }
})

// Команда для поиска заказа по ID
bot.command('find_order', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    const args = ctx.match?.toString().trim()
    if (!args) {
      await ctx.reply('❌ Укажите ID заказа. Пример: /find_order ORDER123')
      return
    }

    console.log('🔍 Searching for order:', args)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${args}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })
    
    if (!response.ok) {
      await ctx.reply(`❌ Заказ "${args}" не найден`)
      return
    }
    
    const order = await response.json()
    
    // Используем существующую функцию просмотра заказа
    await handleViewOrder(ctx, order.id)

  } catch (error) {
    console.error('❌ Error in find_order command:', error)
    await ctx.reply('❌ Ошибка поиска заказа')
  }
})

// Команда для заказов в ожидании
bot.command('pending_orders', async (ctx) => {
  await handleFilterOrders(ctx, 'PENDING')
})

// Команда для заказов в обработке  
bot.command('processing_orders', async (ctx) => {
  await handleFilterOrders(ctx, 'PROCESSING')
})

// Команда для статистики заказов
bot.command('order_stats', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    console.log('📊 Fetching order statistics...')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })
    
    if (!response.ok) {
      await ctx.reply('❌ Ошибка получения статистики')
      return
    }
    
    const stats = await response.json()
    
    const message = `📊 *СТАТИСТИКА ЗАКАЗОВ*\n\n` +
      `📅 *За сегодня:*\n` +
      `• Заказов: ${stats.today?.orders || 0}\n` +
      `• Выручка: $${stats.today?.revenue || 0}\n` +
      `• Средний чек: $${stats.today?.averageOrder || 0}\n\n` +
      `📈 *За неделю:*\n` +
      `• Заказов: ${stats.week?.orders || 0}\n` +
      `• Выручка: $${stats.week?.revenue || 0}\n\n` +
      `📊 *За месяц:*\n` +
      `• Заказов: ${stats.month?.orders || 0}\n` +
      `• Выручка: $${stats.month?.revenue || 0}\n\n` +
      `⏰ Обновлено: ${new Date().toLocaleString('ru-RU')}`

    await ctx.reply(message, { parse_mode: 'Markdown' })

  } catch (error) {
    console.error('❌ Error in order_stats command:', error)
    await ctx.reply('❌ Ошибка получения статистики')
  }
})

// ===== КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ ВИДЕО ГЛАВНОЙ СТРАНИЦЫ =====

// Команда для списка видео главной страницы
bot.command('list_home_videos', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    console.log('📺 Fetching home videos...')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/home-videos`)
    const data = await response.json()
    
    if (data.videos && data.videos.length > 0) {
      let message = `🏠 Видео для главной страницы (${data.count} шт.):\n\n`
      
      data.videos.forEach((video: any, index: number) => {
        message += `${index + 1}. ID: ${video.id}\n`
        message += `   URL: ${video.url}\n`
        message += `   Добавлено: ${new Date(video.createdAt).toLocaleString('ru')}\n\n`
      })
      
      await ctx.reply(message)
    } else {
      await ctx.reply('🏠 Видео для главной страницы не найдены')
    }
    
  } catch (error) {
    console.error('❌ Error listing home videos:', error)
    await ctx.reply('❌ Ошибка при получении списка видео')
  }
})

// Команда для добавления видео главной страницы
bot.command('add_home_video', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    const args = ctx.match?.toString().trim()
    if (!args) {
      await ctx.reply('❌ Укажите URL видео. Пример: /add_home_video https://example.com/video.mp4')
      return
    }

    console.log('📺 Adding home video:', args)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/home-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoUrl: args })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      await ctx.reply(`✅ Видео успешно добавлено на главную страницу!
      
📺 ID: ${data.addedVideo.id}
🔗 URL: ${data.addedVideo.url}
📊 Всего видео: ${data.count}`)
    } else {
      await ctx.reply(`❌ Ошибка добавления видео: ${data.error || 'Неизвестная ошибка'}`)
    }
    
  } catch (error) {
    console.error('❌ Error adding home video:', error)
    await ctx.reply('❌ Ошибка при добавлении видео')
  }
})

// Команда для удаления видео главной страницы
bot.command('remove_home_video', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    const args = ctx.match?.toString().trim()
    if (!args) {
      await ctx.reply('❌ Укажите ID видео. Пример: /remove_home_video home_video_1234567890')
      return
    }

    console.log('📺 Removing home video:', args)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/site/home-videos`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoId: args })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      await ctx.reply(`✅ Видео успешно удалено с главной страницы!
      
🗑️ Удаленное ID: ${data.deletedVideoId}
📊 Осталось видео: ${data.count}`)
    } else {
      await ctx.reply(`❌ Ошибка удаления видео: ${data.error || 'Неизвестная ошибка'}`)
    }
    
  } catch (error) {
    console.error('❌ Error removing home video:', error)
    await ctx.reply('❌ Ошибка при удалении видео')
  }
})

// Команда для управления видео главной страницы (интерактивная)
bot.command('home_videos', async (ctx) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    await ctx.reply(`🏠 Управление видео для ГЛАВНОЙ СТРАНИЦЫ:

Доступные команды:
📋 /list_home_videos - показать все видео
➕ /add_home_video <URL> - добавить новое видео
🗑️ /remove_home_video <ID> - удалить видео

Пример добавления:
/add_home_video https://example.com/video.mp4

Пример удаления:
/remove_home_video home_video_1234567890`)
    
  } catch (error) {
    console.error('❌ Error in home_videos command:', error)
    await ctx.reply('❌ Ошибка команды')
  }
})

// Обработка callback запросов (кнопки в сообщениях)
bot.on('callback_query', async (ctx) => {
  try {
    console.log(`🔘 Received callback query from user ${ctx.from?.id}: ${ctx.callbackQuery?.data}`)
    
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: '❌ У вас нет доступа к этой функции' })
      return
    }

    const callbackData = ctx.callbackQuery?.data
    if (!callbackData) return

    // Подтверждаем получение callback
    await ctx.answerCallbackQuery()

    // Парсим callback data для различных форматов
    console.log(`🔧 Raw callback data: ${callbackData}`)

    // Проверяем формат callback_data из уведомлений о заказах
    if (callbackData.includes('_order_')) {
      const parts = callbackData.split('_order_')
      const action = parts[0]
      const orderId = parts[1]
      
      console.log(`🔧 Processing order callback: action=${action}, orderId=${orderId}`)

      switch (action) {
        case 'confirm':
          await handleConfirmOrder(ctx, orderId)
          break
        case 'process':
          await handleProcessOrder(ctx, orderId)
          break
        case 'view':
          await handleViewOrder(ctx, orderId)
          break
        case 'cancel':
          await handleCancelOrder(ctx, orderId)
          break
        case 'refund':
          await handleRefundOrder(ctx, orderId)
          break
        default:
          await ctx.reply(`ℹ️ Функция "${action}" для заказа ${orderId} пока не реализована`)
          break
      }
    }
    // Проверяем новый формат callback_data для кнопок управления заказами
    else if (callbackData.includes('confirm_order_') || callbackData.includes('process_order_') || 
             callbackData.includes('cancel_order_') || callbackData.includes('refund_order_') ||
             callbackData.includes('view_order_')) {
      
      let action = ''
      let orderId = ''
      
      if (callbackData.startsWith('confirm_order_')) {
        action = 'confirm'
        orderId = callbackData.replace('confirm_order_', '')
      } else if (callbackData.startsWith('process_order_')) {
        action = 'process'
        orderId = callbackData.replace('process_order_', '')
      } else if (callbackData.startsWith('cancel_order_')) {
        action = 'cancel'
        orderId = callbackData.replace('cancel_order_', '')
      } else if (callbackData.startsWith('refund_order_')) {
        action = 'refund'
        orderId = callbackData.replace('refund_order_', '')
      } else if (callbackData.startsWith('view_order_')) {
        action = 'view'
        orderId = callbackData.replace('view_order_', '')
      }
      
      console.log(`🔧 Processing order management callback: action=${action}, orderId=${orderId}`)

      switch (action) {
        case 'confirm':
          await handleConfirmOrder(ctx, orderId)
          break
        case 'process':
          await handleProcessOrder(ctx, orderId)
          break
        case 'view':
          await handleViewOrder(ctx, orderId)
          break
        case 'cancel':
          await handleCancelOrder(ctx, orderId)
          break
        case 'refund':
          await handleRefundOrder(ctx, orderId)
          break
        default:
          await ctx.reply(`ℹ️ Функция "${action}" для заказа ${orderId} пока не реализована`)
          break
      }
    }
    // Проверяем формат callback_data для сообщений клиентам
    else if (callbackData.includes('_customer_')) {
      const parts = callbackData.split('_customer_')
      const action = parts[0] === 'message' ? 'message' : parts[0]
      const orderId = parts[1]
      
      console.log(`🔧 Processing customer callback: action=${action}, orderId=${orderId}`)
      
      switch (action) {
        case 'message':
          await handleMessageCustomer(ctx, orderId)
          break
        case 'contact':
          await handleContactCustomer(ctx, orderId)
          break
        default:
          await ctx.reply(`ℹ️ Функция "${action}" для клиента пока не реализована`)
          break
      }
    }
    // Проверяем специальные форматы отмены и возврата
    else if (callbackData.includes('cancel_no_refund_')) {
      const orderId = callbackData.replace('cancel_no_refund_', '')
      await handleCancelNoRefund(ctx, orderId)
    }
    else if (callbackData.includes('cancel_with_refund_')) {
      const orderId = callbackData.replace('cancel_with_refund_', '')
      await handleCancelWithRefund(ctx, orderId)
    }
    else if (callbackData.includes('full_refund_')) {
      const orderId = callbackData.replace('full_refund_', '')
      await handleFullRefund(ctx, orderId)
    }
    else if (callbackData.includes('partial_refund_')) {
      const orderId = callbackData.replace('partial_refund_', '')
      await handlePartialRefund(ctx, orderId)
    }
    // Проверяем фильтры заказов
    else if (callbackData.includes('filter_orders_')) {
      const status = callbackData.replace('filter_orders_', '')
      await handleFilterOrders(ctx, status)
    }
    // Обработка других callback форматов (оставляем старую логику)
    else {
      const [action, ...params] = callbackData.split('_')
      const entityId = params.join('_')

      console.log(`🔧 Processing generic callback: action=${action}, entityId=${entityId}`)

      switch (action) {
        case 'inventory':
          await handleInventoryStats(ctx)
          break
        case 'add':
          await handleAddInventory(ctx)
          break
        case 'plan':
          await handlePlanRestock(ctx)
          break
        case 'detailed':
          await handleDetailedStats(ctx)
          break
        case 'today':
          await handleTodayOrders(ctx)
          break
        case 'search':
          if (entityId === 'order') {
            await ctx.reply('🔍 Для поиска заказа используйте команду:\n/find_order <ID_заказа>')
          }
          break
        case 'order':
          if (entityId === 'stats') {
            // Перенаправляем на команду статистики
            await ctx.reply('📊 Получение статистики...')
            const fakeCtx = { ...ctx, match: '' }
            await bot.handleUpdate({ message: { text: '/order_stats' } } as any)
          }
          break
        case 'all':
          if (entityId === 'orders') {
            await ctx.reply('📋 Получение всех заказов...')
            const fakeCtx = { ...ctx, match: '' }
            await bot.handleUpdate({ message: { text: '/orders' } } as any)
          }
          break
        default:
          await ctx.reply(`ℹ️ Функция "${action}" пока не реализована`)
          break
      }
    }

  } catch (error) {
    console.error('❌ Error handling callback query:', error)
    try {
      await ctx.answerCallbackQuery({ text: '❌ Произошла ошибка' })
    } catch (answerError) {
      console.error('❌ Failed to answer callback query:', answerError)
    }
  }
})

// Handlers для callback actions

async function handleConfirmOrder(ctx: any, orderId: string) {
  try {
    console.log('✅ Confirming order:', orderId)
    
    // Обновляем статус заказа в базе данных
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ 
        status: 'CONFIRMED'
      })
    })

    if (response.ok) {
      await ctx.reply(`✅ Заказ ${orderId} подтвержден и принят в работу`)
    } else {
      const errorData = await response.json()
      await ctx.reply(`❌ Ошибка подтверждения заказа ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error confirming order:', error)
    await ctx.reply(`❌ Ошибка подтверждения заказа`)
  }
}

async function handleProcessOrder(ctx: any, orderId: string) {
  try {
    console.log('📦 Processing order:', orderId)
    
    // Обновляем статус заказа на "В обработке"
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ 
        status: 'PROCESSING'
      })
    })

    if (response.ok) {
      await ctx.reply(`📦 Заказ ${orderId} передан в обработку`)
    } else {
      const errorData = await response.json()
      await ctx.reply(`❌ Ошибка обработки заказа ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error processing order:', error)
    await ctx.reply(`❌ Ошибка обработки заказа`)
  }
}

async function handleViewOrder(ctx: any, orderId: string) {
  try {
    console.log('👁️ Viewing order:', orderId)
    
    // Получаем детали заказа
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })

    if (response.ok) {
      const order = await response.json()
      
      const orderDetails = `
📋 *ДЕТАЛИ ЗАКАЗА* #${order.orderNumber || orderId}

👤 *Клиент:* ${order.shippingName}
📧 *Email:* ${order.shippingEmail}
📱 *Телефон:* ${order.shippingPhone || 'Не указан'}
💰 *Сумма:* $${Number(order.total)}
📊 *Статус:* ${order.status}
💳 *Оплата:* ${order.paymentStatus}

🏠 *Адрес доставки:*
${order.shippingAddress}
${order.shippingCity}, ${order.shippingCountry}
${order.shippingZip}

📦 *Товары:*
${order.items?.map((item: any) => `• ${item.productName} x${item.quantity} - $${Number(item.price)}`).join('\n') || 'Товары не найдены'}

📅 *Создан:* ${new Date(order.createdAt).toLocaleString('ru-RU')}
      `.trim()

      // Кнопки для дальнейших действий
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: `confirm_order_${orderId}` },
            { text: '📦 В обработку', callback_data: `process_order_${orderId}` }
          ],
          [
            { text: '❌ Отменить заказ', callback_data: `cancel_order_${orderId}` },
            { text: '💸 Возврат средств', callback_data: `refund_order_${orderId}` }
          ]
        ]
      }

      await ctx.reply(orderDetails, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } else {
      await ctx.reply(`❌ Не удалось загрузить детали заказа ${orderId}`)
    }
  } catch (error) {
    console.error('Error viewing order:', error)
    await ctx.reply(`❌ Ошибка просмотра заказа`)
  }
}

async function handleMessageCustomer(ctx: any, orderId: string) {
  try {
    console.log('💬 Messaging customer for order:', orderId)
    
    await ctx.reply(`💬 Отправка сообщения клиенту по заказу ${orderId}:

Для отправки сообщения клиенту используйте формат:
\`message_${orderId}_Ваше сообщение здесь\`

Пример:
\`message_${orderId}_Ваш заказ готов к отправке\``, {
      parse_mode: 'Markdown'
    })
  } catch (error) {
    console.error('Error messaging customer:', error)
    await ctx.reply(`❌ Ошибка отправки сообщения`)
  }
}

async function handleContactCustomer(ctx: any, orderId: string) {
  try {
    console.log('📞 Contacting customer for order:', orderId)
    
    // Получаем контактную информацию клиента
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })

    if (response.ok) {
      const order = await response.json()
      
      await ctx.reply(`📞 *КОНТАКТНАЯ ИНФОРМАЦИЯ КЛИЕНТА*

📋 *Заказ:* #${order.orderNumber || orderId}
👤 *Имя:* ${order.shippingName}
📧 *Email:* ${order.shippingEmail}
📱 *Телефон:* ${order.shippingPhone || 'Не указан'}

🔗 *Быстрые действия:*
• Email: mailto:${order.shippingEmail}
${order.shippingPhone ? `• Телефон: tel:${order.shippingPhone}` : ''}`, {
        parse_mode: 'Markdown'
      })
    } else {
      await ctx.reply(`❌ Не удалось загрузить контактную информацию для заказа ${orderId}`)
    }
  } catch (error) {
    console.error('Error contacting customer:', error)
    await ctx.reply(`❌ Ошибка получения контактной информации`)
  }
}

async function handleUploadPhoto(ctx: any, orderId: string) {
  await ctx.reply(`📸 Для загрузки фото к заказу ${orderId}:
  
1. Отправьте сюда фото
2. В описании укажите: order_${orderId}
3. Фото будет автоматически привязано к заказу`)
}

async function handleSendPhoto(ctx: any, orderId: string) {
  try {
    console.log('📧 Sending photo for order:', orderId)
    
    // Отправляем фото клиенту через админ API
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/sign-orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({
        action: 'send_photo'
      })
    })

    if (response.ok) {
      await ctx.reply(`✅ Фото для заказа ${orderId} отправлено клиенту`)
    } else {
      const errorData = await response.json()
      await ctx.reply(`❌ Ошибка отправки фото: ${errorData.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error sending photo:', error)
    await ctx.reply(`❌ Ошибка отправки фото`)
  }
}

async function handleCancelOrder(ctx: any, orderId: string) {
  try {
    console.log('❌ Cancelling order:', orderId)
    
    // Создаем клавиатуру с вариантами отмены
    const keyboard = {
      inline_keyboard: [
        [
          { text: '❌ Отменить без возврата', callback_data: `cancel_no_refund_${orderId}` },
          { text: '💸 Отменить с возвратом', callback_data: `cancel_with_refund_${orderId}` }
        ],
        [
          { text: '🔙 Назад', callback_data: `view_order_${orderId}` }
        ]
      ]
    }

    await ctx.reply(`❌ *ОТМЕНА ЗАКАЗА* #${orderId}

Выберите тип отмены:

❌ *Без возврата* - заказ отменяется, средства не возвращаются
💸 *С возвратом* - заказ отменяется, средства возвращаются клиенту

⚠️ Отмена с возвратом запустит процесс возврата средств через WesternBid`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    await ctx.reply(`❌ Ошибка отмены заказа`)
  }
}

async function handleCancelNoRefund(ctx: any, orderId: string) {
  try {
    console.log('❌ Cancelling order without refund:', orderId)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ 
        status: 'CANCELLED'
      })
    })

    if (response.ok) {
      await ctx.reply(`❌ Заказ ${orderId} отменен без возврата средств`)
    } else {
      const errorData = await response.json()
      await ctx.reply(`❌ Ошибка отмены заказа ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error cancelling order without refund:', error)
    await ctx.reply(`❌ Ошибка отмены заказа`)
  }
}

async function handleCancelWithRefund(ctx: any, orderId: string) {
  try {
    console.log('💸 Cancelling order with refund:', orderId)
    
    // Отменяем заказ и обрабатываем возврат
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ 
        reason: 'Заказ отменен администратором',
        adminId: ctx.from?.id?.toString() || 'telegram_admin',
        notifyCustomer: true
      })
    })

    if (response.ok) {
      const result = await response.json()
      await ctx.reply(`💸 Заказ ${orderId} отменен с возвратом средств

✅ *Сумма возврата:* $${result.refundAmount}
🆔 *ID возврата:* ${result.refundId}
📧 *Клиент уведомлен по email*

${result.message}`)
    } else {
      const errorData = await response.json()
      await ctx.reply(`❌ Ошибка возврата по заказу ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error cancelling order with refund:', error)
    await ctx.reply(`❌ Ошибка обработки возврата`)
  }
}

async function handleRefundOrder(ctx: any, orderId: string) {
  try {
    console.log('💸 Refunding order:', orderId)
    
    // Получаем информацию о заказе для расчета возврата
    const orderResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })

    if (!orderResponse.ok) {
      await ctx.reply(`❌ Не удалось загрузить информацию о заказе ${orderId}`)
      return
    }

    const order = await orderResponse.json()
    
    // Создаем клавиатуру с вариантами возврата
    const keyboard = {
      inline_keyboard: [
        [
          { text: '💸 Полный возврат', callback_data: `full_refund_${orderId}` },
          { text: '💰 Частичный возврат', callback_data: `partial_refund_${orderId}` }
        ],
        [
          { text: '🔙 Назад', callback_data: `view_order_${orderId}` }
        ]
      ]
    }

    await ctx.reply(`💸 *ВОЗВРАТ СРЕДСТВ* по заказу #${order.orderNumber || orderId}

💰 *Сумма заказа:* $${Number(order.total)}
📊 *Статус:* ${order.status}
💳 *Оплата:* ${order.paymentStatus}

Выберите тип возврата:

💸 *Полный возврат* - вернуть всю сумму ($${Number(order.total)})
💰 *Частичный возврат* - вернуть часть суммы

⚠️ Возврат будет обработан через WesternBid, клиент получит уведомление по email`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  } catch (error) {
    console.error('Error refunding order:', error)
    await ctx.reply(`❌ Ошибка обработки возврата`)
  }
}

async function handleFullRefund(ctx: any, orderId: string) {
  try {
    console.log('💸 Processing full refund for order:', orderId)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ 
        reason: 'Полный возврат по решению администратора',
        adminId: ctx.from?.id?.toString() || 'telegram_admin',
        notifyCustomer: true
      })
    })

    if (response.ok) {
      const result = await response.json()
      await ctx.reply(`✅ *ПОЛНЫЙ ВОЗВРАТ ОБРАБОТАН*

💸 *Сумма возврата:* $${result.refundAmount}
🆔 *ID возврата:* ${result.refundId}
📧 *Клиент уведомлен по email*

${result.message}`)
    } else {
      const errorData = await response.json()
      await ctx.reply(`❌ Ошибка полного возврата по заказу ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error processing full refund:', error)
    await ctx.reply(`❌ Ошибка обработки полного возврата`)
  }
}

async function handlePartialRefund(ctx: any, orderId: string) {
  try {
    console.log('💰 Setting up partial refund for order:', orderId)
    
    await ctx.reply(`💰 *ЧАСТИЧНЫЙ ВОЗВРАТ* по заказу #${orderId}

Для обработки частичного возврата отправьте сообщение в формате:
\`partial_refund_${orderId}_СУММА_ПРИЧИНА\`

*Пример:*
\`partial_refund_${orderId}_50.00_Возврат за поврежденный товар\`

⚠️ Укажите сумму в долларах с точностью до центов`, {
      parse_mode: 'Markdown'
    })
  } catch (error) {
    console.error('Error setting up partial refund:', error)
    await ctx.reply(`❌ Ошибка настройки частичного возврата`)
  }
}

async function handleCustomerProfile(ctx: any, customerId: string) {
  await ctx.reply(`👤 Профиль клиента ${customerId}:
  
Функция просмотра профиля клиента пока в разработке.
Используйте админ панель для подробной информации.`)
}

async function handleAcceptOrder(ctx: any, orderId: string) {
  await handleConfirmOrder(ctx, orderId) // Используем ту же логику
}

async function handleRejectOrder(ctx: any, orderId: string) {
  await handleCancelOrder(ctx, orderId) // Используем ту же логику
}

async function handleChangeStatus(ctx: any, orderId: string) {
  await ctx.reply(`🔄 Изменение статуса заказа ${orderId}:

Доступные статусы:
• PENDING - В ожидании
• PROCESSING - В работе  
• COMPLETED - Завершен
• CANCELLED - Отменен

Отправьте сообщение в формате: status_${orderId}_НОВЫЙ_СТАТУС`)
}

// Вспомогательные функции для управления заказами

function getStatusEmoji(status: string): string {
  const statusEmojis: { [key: string]: string } = {
    'PENDING': '⏳',
    'CONFIRMED': '✅', 
    'PROCESSING': '🔄',
    'SHIPPED': '📦',
    'DELIVERED': '🎉',
    'CANCELLED': '❌',
    'REFUNDED': '💸',
    'PARTIALLY_REFUNDED': '💰'
  }
  return statusEmojis[status] || '❓'
}

async function handleFilterOrders(ctx: any, status: string) {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этой команде')
      return
    }

    console.log(`📋 Fetching orders with status: ${status}`)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/orders?status=${status}&limit=20`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      }
    })
    
    if (!response.ok) {
      await ctx.reply('❌ Ошибка получения заказов')
      return
    }
    
    const data = await response.json()
    const orders = data.orders || []
    
    if (orders.length === 0) {
      const statusName = getStatusName(status)
      await ctx.reply(`📋 ${statusName} заказов не найдено`)
      return
    }

    const statusEmoji = getStatusEmoji(status)
    const statusName = getStatusName(status)
    let message = `${statusEmoji} *${statusName.toUpperCase()} ЗАКАЗЫ*\n\n`
    
    // Создаем инлайн кнопки для каждого заказа
    const inlineKeyboards = []
    
    orders.slice(0, 10).forEach((order: any, index: number) => {
      const date = new Date(order.createdAt).toLocaleDateString('ru-RU')
      message += `${index + 1}. #${order.orderNumber || order.id.slice(0, 8)}\n`
      message += `   💰 $${Number(order.total)} | 👤 ${order.shippingName}\n`
      message += `   📅 ${date} | ${order.status}\n\n`
      
      // Добавляем кнопку управления для каждого заказа
      inlineKeyboards.push([
        { text: `📋 Управлять заказом #${order.orderNumber || order.id.slice(0, 8)}`, callback_data: `view_order_${order.id}` }
      ])
    })

    if (orders.length > 10) {
      message += `... и еще ${orders.length - 10} заказов\n\n`
    }

    // Добавляем кнопки для действий с заказами в конец
    inlineKeyboards.push([
      { text: '🔍 Найти заказ', callback_data: 'search_order' },
      { text: '📋 Все заказы', callback_data: 'all_orders' }
    ])

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboards
      }
    })

  } catch (error) {
    console.error('❌ Error filtering orders:', error)
    await ctx.reply('❌ Ошибка получения заказов')
  }
}

function getStatusName(status: string): string {
  const statusNames: { [key: string]: string } = {
    'PENDING': 'В ожидании',
    'CONFIRMED': 'Подтвержденные',
    'PROCESSING': 'В обработке', 
    'SHIPPED': 'Отправленные',
    'DELIVERED': 'Завершенные',
    'CANCELLED': 'Отмененные',
    'REFUNDED': 'Возвращенные'
  }
  return statusNames[status] || status
}

// Заглушки для функций уведомлений, которые пока не реализованы
async function handleInventoryStats(ctx: any) {
  await ctx.reply('📊 Статистика склада пока не реализована')
}

async function handleAddInventory(ctx: any) {
  await ctx.reply('➕ Добавление товаров пока не реализовано')
}

async function handlePlanRestock(ctx: any) {
  await ctx.reply('📝 Планирование закупки пока не реализовано')
}

async function handleDetailedStats(ctx: any) {
  await ctx.reply('📊 Подробная статистика пока не реализована')
}

async function handleTodayOrders(ctx: any) {
  await ctx.reply('📦 Заказы за день пока не реализованы')
}

// Обработка всех сообщений
bot.on('message', async (ctx) => {
  try {
    console.log(`📨 Received message from user ${ctx.from?.id}: ${ctx.message?.text}`)
    
    if (!ctx.from) return
    
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет доступа к этому боту')
      return
    }

    // Проверяем на команды изменения статуса
    if (ctx.message?.text && ctx.message.text.startsWith('status_')) {
      const parts = ctx.message.text.split('_')
      if (parts.length === 3) {
        const orderId = parts[1]
        const newStatus = parts[2]
        
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
            },
            body: JSON.stringify({ 
              status: newStatus 
            })
          })

          if (response.ok) {
            await ctx.reply(`✅ Статус заказа ${orderId} изменен на ${newStatus}`)
          } else {
            const errorData = await response.json()
            await ctx.reply(`❌ Ошибка изменения статуса заказа ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
          }
        } catch (error) {
          await ctx.reply(`❌ Ошибка изменения статуса`)
        }
        return
      }
    }

    // Проверяем на команды частичного возврата
    if (ctx.message?.text && ctx.message.text.startsWith('partial_refund_')) {
      const parts = ctx.message.text.split('_')
      if (parts.length >= 4) {
        const orderId = parts[2]
        const amount = parseFloat(parts[3])
        const reason = parts.slice(4).join(' ') || 'Частичный возврат'
        
        if (isNaN(amount) || amount <= 0) {
          await ctx.reply(`❌ Неверная сумма. Укажите положительное число`)
          return
        }
        
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}/refund`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
            },
            body: JSON.stringify({ 
              amount: amount,
              reason: reason,
              adminId: ctx.from?.id?.toString() || 'telegram_admin',
              notifyCustomer: true
            })
          })

          if (response.ok) {
            const result = await response.json()
            await ctx.reply(`✅ *ЧАСТИЧНЫЙ ВОЗВРАТ ОБРАБОТАН*

💰 *Сумма возврата:* $${result.refundAmount}
🆔 *ID возврата:* ${result.refundId}
📝 *Причина:* ${reason}
📧 *Клиент уведомлен по email*

${result.message}`)
          } else {
            const errorData = await response.json()
            await ctx.reply(`❌ Ошибка частичного возврата по заказу ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
          }
        } catch (error) {
          await ctx.reply(`❌ Ошибка обработки частичного возврата`)
        }
        return
      }
    }

    // Проверяем на команды отправки сообщения клиенту
    if (ctx.message?.text && ctx.message.text.startsWith('message_')) {
      const parts = ctx.message.text.split('_')
      if (parts.length >= 3) {
        const orderId = parts[1]
        const message = parts.slice(2).join(' ')
        
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
            },
            body: JSON.stringify({ 
              message: message
            })
          })

          if (response.ok) {
            await ctx.reply(`✅ Сообщение отправлено клиенту по заказу ${orderId}`)
          } else {
            const errorData = await response.json()
            await ctx.reply(`❌ Ошибка отправки сообщения клиенту: ${errorData.error || 'Неизвестная ошибка'}`)
          }
        } catch (error) {
          await ctx.reply(`❌ Ошибка отправки сообщения`)
        }
        return
      }
    }

    if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
      await ctx.reply('👋 Привет! Используйте команду /start для начала работы.')
    }
  } catch (error) {
    console.error('❌ Error handling message:', error)
  }
})

console.log('✅ Simple VobvorotAdminBot initialized successfully')