// Тестируем команды бота напрямую через API
const BOT_TOKEN = '7274106590:AAEu0baVLztVQO9YdnCjvo9fcb3SnMFQNe8';
const ADMIN_ID = '316593422'; // Ваш ID

async function testBotCommands() {
  try {
    console.log('🤖 Тестируем команды бота @VobvorotecomAdminBot...');
    
    // 1. Отправляем команду /start от имени админа
    console.log('\n📱 1. Отправляем /start команду...');
    const startResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_ID,
        text: '/start'
      })
    });
    
    const startResult = await startResponse.json();
    if (startResult.ok) {
      console.log('✅ Команда /start отправлена успешно');
      console.log(`   Message ID: ${startResult.result.message_id}`);
    } else {
      console.error('❌ Ошибка отправки /start:', startResult);
    }
    
    // 2. Проверяем webhook статус
    console.log('\n📡 2. Статус webhook:');
    const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const webhookInfo = await webhookResponse.json();
    
    if (webhookInfo.ok) {
      console.log('✅ Webhook информация:');
      console.log(`   URL: ${webhookInfo.result.url}`);
      console.log(`   Pending Updates: ${webhookInfo.result.pending_update_count}`);
      console.log(`   Last Error: ${webhookInfo.result.last_error_message || 'Нет ошибок'}`);
    }
    
    // 3. Проверяем доступные команды
    console.log('\n🔧 3. Устанавливаем команды бота...');
    const commandsResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: '🚀 Запустить бота' },
          { command: 'menu', description: '📱 Главное меню' },
          { command: 'orders', description: '📦 Управление заказами' },
          { command: 'products', description: '🛍️ Управление товарами' },
          { command: 'stats', description: '📊 Статистика' },
          { command: 'help', description: '❓ Помощь' }
        ]
      })
    });
    
    const commandsResult = await commandsResponse.json();
    if (commandsResult.ok) {
      console.log('✅ Команды бота установлены');
    } else {
      console.error('❌ Ошибка установки команд:', commandsResult);
    }
    
    // 4. Тестируем direct API call к нашему webhook
    console.log('\n🔗 4. Тестируем webhook endpoint...');
    const testUpdate = {
      update_id: 999999999,
      message: {
        message_id: 999,
        from: {
          id: parseInt(ADMIN_ID),
          is_bot: false,
          first_name: 'Test Admin',
          username: 'testadmin'
        },
        chat: {
          id: parseInt(ADMIN_ID),
          first_name: 'Test Admin',
          username: 'testadmin',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start'
      }
    };
    
    const webhookTestResponse = await fetch('https://vobvorot.com/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'vobvorot_webhook_secret_2024'
      },
      body: JSON.stringify(testUpdate)
    });
    
    if (webhookTestResponse.ok) {
      console.log('✅ Webhook endpoint отвечает');
      console.log(`   Status: ${webhookTestResponse.status}`);
    } else {
      console.error('❌ Webhook endpoint не отвечает:', webhookTestResponse.status);
    }
    
    console.log('\n🎉 Тестирование завершено!');
    console.log('\n💡 Следующие шаги:');
    console.log('1. Найти @VobvorotecomAdminBot в Telegram');
    console.log('2. Отправить /start');
    console.log('3. Проверить появление главного меню');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testBotCommands();