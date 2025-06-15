import { NextRequest, NextResponse } from 'next/server';
import { createTelegramCRM, CRMDatabase } from '@/lib/telegram-crm';

// Telegram webhook handler for CRM bot commands
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const telegramCRM = createTelegramCRM();
    const crmDB = new CRMDatabase();
    
    if (!telegramCRM) {
      return NextResponse.json({ error: 'Telegram CRM not configured' }, { status: 500 });
    }

    // Handle callback queries (button presses)
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;
      
      // Parse callback data
      const [action, ...params] = callbackData.split('_');
      
      switch (action) {
        case 'accept':
          if (params[0] === 'order') {
            const orderId = params[1];
            await handleAcceptOrder(orderId, telegramCRM, crmDB);
          }
          break;
          
        case 'reject':
          if (params[0] === 'order') {
            const orderId = params[1];
            await handleRejectOrder(orderId, telegramCRM, crmDB);
          }
          break;
          
        case 'customer':
          const customerId = params[0];
          await handleShowCustomer(customerId, telegramCRM, crmDB);
          break;
          
        case 'detailed':
          if (params[0] === 'analytics') {
            await handleDetailedAnalytics(telegramCRM, crmDB);
          }
          break;
          
        case 'pending':
          if (params[0] === 'orders') {
            await handlePendingOrders(telegramCRM, crmDB);
          }
          break;
          
        default:
          await telegramCRM.sendMessage('❓ Неизвестная команда');
      }
      
      // Answer callback query to remove loading state
      await answerCallbackQuery(body.callback_query.id);
    }
    
    // Handle text messages (commands)
    if (body.message && body.message.text) {
      const text = body.message.text;
      const chatId = body.message.chat.id;
      
      // Only respond to owners
      const ownerChatIds = process.env.TELEGRAM_OWNER_CHAT_ID?.split(',').map(id => id.trim()) || [];
      if (!ownerChatIds.includes(chatId.toString())) {
        return NextResponse.json({ ok: true });
      }
      
      if (text.startsWith('/')) {
        await handleCommand(text, telegramCRM, crmDB);
      }
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle bot commands
async function handleCommand(command: string, telegramCRM: any, crmDB: CRMDatabase) {
  const [cmd, ...args] = command.split(' ');
  
  switch (cmd) {
    case '/start':
      await telegramCRM.sendMessage(`
🤖 <b>VobVorot CRM Bot</b>

Доступные команды:
/analytics - Аналитика за сегодня
/orders - Заказы в обработке
/customers - Управление клиентами
/inventory - Проверить запасы
/help - Список команд

🔔 Вы будете получать уведомления о:
• Новых заказах
• Изменениях статуса
• Ежедневной аналитике
• Предупреждениях о запасах
      `, { parse_mode: 'HTML' });
      break;
      
    case '/analytics':
      const analytics = await crmDB.getDailyAnalytics(new Date());
      await telegramCRM.sendDailyReport(analytics);
      break;
      
    case '/orders':
      await handlePendingOrders(telegramCRM, crmDB);
      break;
      
    case '/customers':
      await telegramCRM.sendMessage('👥 Управление клиентами:\n\nИспользуйте команду: /customer <email>');
      break;
      
    case '/customer':
      if (args.length > 0) {
        const email = args[0];
        const customer = await crmDB.getCustomer(email);
        if (customer) {
          await telegramCRM.showCustomerProfile(customer);
        } else {
          await telegramCRM.sendMessage('❌ Клиент не найден');
        }
      }
      break;
      
    case '/inventory':
      // This would check inventory levels
      await telegramCRM.sendMessage('📦 Проверка запасов...\n\n⚠️ Функция в разработке');
      break;
      
    case '/help':
      await telegramCRM.sendMessage(`
📋 <b>Команды CRM бота:</b>

/analytics - Аналитика продаж
/orders - Заказы на обработку
/customers - Управление клиентами
/customer <email> - Профиль клиента
/inventory - Состояние склада
/settings - Настройки уведомлений

💡 <b>Автоматические уведомления:</b>
• Новые заказы (мгновенно)
• Ежедневные отчеты (в 9:00)
• Еженедельные отчеты (понедельник)
• Предупреждения о запасах
      `, { parse_mode: 'HTML' });
      break;
      
    default:
      await telegramCRM.sendMessage('❓ Неизвестная команда. Используйте /help для списка команд.');
  }
}

// Handle order actions
async function handleAcceptOrder(orderId: string, telegramCRM: any, crmDB: CRMDatabase) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await telegramCRM.sendMessage('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Update order status to confirmed
    const response = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    })

    if (response.ok) {
      const result = await response.json()
      await telegramCRM.sendMessage(`✅ Заказ #${orderId} подтвержден и принят в работу`)
      
      // Notify customer if possible
      if (result.order?.customer?.telegramChatId) {
        try {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: result.order.customer.telegramChatId,
              text: `✅ Ваш заказ #${orderId} подтвержден и принят в работу!`
            })
          })
        } catch (error) {
          console.log('Could not notify customer:', error)
        }
      }
    } else {
      const error = await response.json()
      await telegramCRM.sendMessage(`❌ Ошибка при подтверждении заказа: ${error.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error accepting order:', error)
    await telegramCRM.sendMessage(`❌ Произошла ошибка при обработке заказа #${orderId}`)
  }
}

async function handleRejectOrder(orderId: string, telegramCRM: any, crmDB: CRMDatabase) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!adminApiKey) {
      await telegramCRM.sendMessage('❌ Ошибка: API ключ администратора не настроен')
      return
    }

    // Update order status to cancelled
    const response = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    })

    if (response.ok) {
      const result = await response.json()
      await telegramCRM.sendMessage(`❌ Заказ #${orderId} отклонен и отменен`)
      
      // Notify customer
      if (result.order?.customer?.telegramChatId) {
        try {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: result.order.customer.telegramChatId,
              text: `❌ К сожалению, ваш заказ #${orderId} был отменен. Если у вас есть вопросы, свяжитесь с поддержкой.`
            })
          })
        } catch (error) {
          console.log('Could not notify customer:', error)
        }
      }
      
      // TODO: Initiate refund process if payment was completed
      if (result.order?.paymentStatus === 'completed') {
        await telegramCRM.sendMessage(`💰 Внимание: Для заказа #${orderId} может потребоваться возврат средств`)
      }
    } else {
      const error = await response.json()
      await telegramCRM.sendMessage(`❌ Ошибка при отмене заказа: ${error.error || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Error rejecting order:', error)
    await telegramCRM.sendMessage(`❌ Произошла ошибка при отмене заказа #${orderId}`)
  }
}

async function handleShowCustomer(customerId: string, telegramCRM: any, crmDB: CRMDatabase) {
  // Show customer details
  await telegramCRM.sendMessage(`👤 Загружаю профиль клиента...`);
}

async function handleDetailedAnalytics(telegramCRM: any, crmDB: CRMDatabase) {
  const weeklyAnalytics = await crmDB.getWeeklyAnalytics(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date()
  );
  await telegramCRM.sendWeeklyReport(weeklyAnalytics);
}

async function handlePendingOrders(telegramCRM: any, crmDB: CRMDatabase) {
  await telegramCRM.sendMessage(`
📋 <b>ЗАКАЗЫ В ОБРАБОТКЕ</b>

Загружаю список заказов...
⏳ Пожалуйста, подождите
  `, { parse_mode: 'HTML' });
}

async function answerCallbackQuery(callbackQueryId: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId
      })
    });
  } catch (error) {
    console.error('Failed to answer callback query:', error);
  }
}