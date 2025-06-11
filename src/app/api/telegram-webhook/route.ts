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
  // Update order status to processing
  await telegramCRM.sendMessage(`✅ Заказ #${orderId} принят в работу`);
}

async function handleRejectOrder(orderId: string, telegramCRM: any, crmDB: CRMDatabase) {
  // Update order status to cancelled
  await telegramCRM.sendMessage(`❌ Заказ #${orderId} отклонен`);
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