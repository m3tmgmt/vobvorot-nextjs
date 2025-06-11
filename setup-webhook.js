// Скрипт для настройки webhook для Telegram бота
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = `${process.env.NEXTAUTH_URL}/api/telegram/webhook`;

async function setupWebhook() {
  try {
    console.log('🔧 Настраиваю webhook для бота...');
    console.log(`📡 URL: ${WEBHOOK_URL}`);
    
    // Устанавливаем webhook
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook успешно установлен!');
      
      // Проверяем статус webhook
      const infoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const info = await infoResponse.json();
      
      console.log('📊 Информация о webhook:', {
        url: info.result.url,
        has_custom_certificate: info.result.has_custom_certificate,
        pending_update_count: info.result.pending_update_count,
        last_error_date: info.result.last_error_date || 'Нет ошибок',
        max_connections: info.result.max_connections
      });
      
    } else {
      console.error('❌ Ошибка установки webhook:', result);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

async function removeWebhook() {
  try {
    console.log('🗑️ Удаляю webhook...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook удален!');
    } else {
      console.error('❌ Ошибка удаления webhook:', result);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Проверяем аргументы командной строки
const action = process.argv[2];

if (action === 'remove') {
  removeWebhook();
} else {
  setupWebhook();
}

console.log('\n💡 Использование:');
console.log('node setup-webhook.js - установить webhook');
console.log('node setup-webhook.js remove - удалить webhook');