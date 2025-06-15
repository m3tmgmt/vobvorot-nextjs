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

📺 Доступные команды для управления видео:

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

    // Парсим callback data
    const [action, ...params] = callbackData.split('_')
    const entityId = params.join('_')

    console.log(`🔧 Processing callback: action=${action}, entityId=${entityId}`)

    switch (action) {
      case 'confirm':
        if (params[0] === 'order') {
          await handleConfirmOrder(ctx, entityId)
        }
        break

      case 'upload':
        if (params[0] === 'photo') {
          await handleUploadPhoto(ctx, entityId)
        }
        break

      case 'send':
        if (params[0] === 'photo') {
          await handleSendPhoto(ctx, entityId)
        }
        break

      case 'cancel':
        if (params[0] === 'order') {
          await handleCancelOrder(ctx, entityId)
        }
        break

      case 'customer':
        await handleCustomerProfile(ctx, entityId)
        break

      case 'accept':
        if (params[0] === 'order') {
          await handleAcceptOrder(ctx, entityId)
        }
        break

      case 'reject':
        if (params[0] === 'order') {
          await handleRejectOrder(ctx, entityId)
        }
        break

      case 'status':
        await handleChangeStatus(ctx, entityId)
        break

      default:
        await ctx.reply(`ℹ️ Функция "${action}" пока не реализована`)
        break
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
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/sign-orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ 
        action: 'update_status',
        status: 'PROCESSING'
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
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/sign-orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ 
        action: 'update_status',
        status: 'CANCELLED'
      })
    })

    if (response.ok) {
      await ctx.reply(`❌ Заказ ${orderId} отменен`)
    } else {
      const errorData = await response.json()
      await ctx.reply(`❌ Ошибка отмены заказа ${orderId}: ${errorData.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error cancelling order:', error)
    await ctx.reply(`❌ Ошибка отмены заказа`)
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
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/sign-orders/${orderId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
            },
            body: JSON.stringify({ 
              action: 'update_status',
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

    if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
      await ctx.reply('👋 Привет! Используйте команду /start для начала работы.')
    }
  } catch (error) {
    console.error('❌ Error handling message:', error)
  }
})

console.log('✅ Simple VobvorotAdminBot initialized successfully')