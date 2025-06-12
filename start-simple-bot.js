// Простой бот для VobVorot без зависимостей
const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM';
const ADMIN_IDS = ['316593422', '1837334996'];

async function deleteWebhook() {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
  const result = await response.json();
  console.log('Webhook deleted:', result);
}

async function sendMessage(chatId, text, options = {}) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        ...options
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function processUpdate(update) {
  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const text = update.message.text;
    const username = update.message.from.username || 'Unknown';
    
    console.log(`Message from ${username} (${userId}): ${text}`);
    
    // Check admin
    if (!ADMIN_IDS.includes(userId.toString())) {
      await sendMessage(chatId, '❌ У вас нет доступа к этому боту');
      return;
    }
    
    // Process commands
    if (text === '/start') {
      const welcomeMessage = `
🎉 *VobvorotAdminBot работает!*

✅ Новый бот: @VobvorotAdminBot
✅ Токен: 7700098378...
✅ Ваш ID: ${userId}
✅ Доступ: Подтвержден

📱 *Доступные команды:*
/start - Это сообщение
/menu - Главное меню (в разработке)
/orders - Заказы (в разработке)
/products - Товары (в разработке)

🔧 Polling mode для отладки
      `;
      await sendMessage(chatId, welcomeMessage);
    } else if (text === '/menu') {
      await sendMessage(chatId, '📱 Главное меню в разработке...');
    } else if (text === '/orders') {
      await sendMessage(chatId, '📦 Управление заказами в разработке...');
    } else if (text === '/products') {
      await sendMessage(chatId, '🛍️ Управление товарами в разработке...');
    } else if (text.startsWith('/')) {
      await sendMessage(chatId, `❓ Неизвестная команда: ${text}\n\nИспользуйте /start для списка команд`);
    }
  }
}

async function startPolling() {
  console.log('🤖 Starting VobvorotAdminBot in polling mode...');
  console.log(`📋 Admin IDs: ${ADMIN_IDS.join(', ')}`);
  
  // Delete webhook first
  await deleteWebhook();
  
  let offset = 0;
  
  while (true) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`);
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          await processUpdate(update);
          offset = update.update_id + 1;
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start bot
startPolling().catch(console.error);