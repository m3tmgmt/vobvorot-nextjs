const https = require('https');

const TELEGRAM_BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI';
const WEBHOOK_SECRET = 'vobvorot_webhook_secret_2025';
const WEBHOOK_URL = 'https://vobvorot.com/api/telegram/ai-assistant';

console.log('🔍 Проверка статуса Telegram Webhook...\n');

// Функция для проверки webhook info
function checkWebhookInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Функция для тестирования webhook
function testWebhook() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      message: {
        message_id: 1,
        from: {
          id: 316593422,
          username: 'admin',
          first_name: 'Admin'
        },
        chat: {
          id: 316593422,
          type: 'private'
        },
        text: '/start',
        date: Math.floor(Date.now() / 1000)
      }
    });

    const options = {
      hostname: 'vobvorot.com',
      port: 443,
      path: '/api/telegram/ai-assistant',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length,
        'x-telegram-bot-api-secret-token': WEBHOOK_SECRET
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.write(testData);
    req.end();
  });
}

// Главная функция
async function main() {
  try {
    // Проверка webhook info
    console.log('1️⃣ Получение информации о webhook из Telegram API...');
    const webhookInfo = await checkWebhookInfo();
    
    if (webhookInfo.ok) {
      const result = webhookInfo.result;
      console.log('✅ Webhook URL:', result.url);
      console.log('📊 Pending updates:', result.pending_update_count);
      
      if (result.last_error_date) {
        const errorDate = new Date(result.last_error_date * 1000);
        console.log('❌ Последняя ошибка:', errorDate.toLocaleString());
        console.log('❌ Сообщение об ошибке:', result.last_error_message);
      } else {
        console.log('✅ Ошибок нет');
      }
      
      console.log('🌐 IP адрес:', result.ip_address);
      console.log('🔗 Max connections:', result.max_connections);
    } else {
      console.log('❌ Ошибка получения информации о webhook:', webhookInfo);
    }
    
    // Тест webhook
    console.log('\n2️⃣ Тестирование webhook endpoint...');
    const testResult = await testWebhook();
    
    console.log('📡 Status Code:', testResult.statusCode);
    console.log('📄 Response:', testResult.body);
    
    if (testResult.statusCode === 200) {
      console.log('✅ Webhook работает корректно!');
    } else {
      console.log('❌ Webhook возвращает ошибку:', testResult.statusCode);
      
      if (testResult.statusCode === 401) {
        console.log('\n⚠️  ПРОБЛЕМА: Неверный secret token');
        console.log('📋 Решение: Добавьте переменные окружения в Vercel:');
        console.log('   TELEGRAM_WEBHOOK_SECRET=vobvorot_webhook_secret_2025');
        console.log('   GEMINI_API_KEY=AIzaSyAYSLsD4XW40XJm5uv6w71bYoZkTAeoU7Y');
        console.log('\n📖 Подробная инструкция: FIX_TELEGRAM_WEBHOOK.md');
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

main();