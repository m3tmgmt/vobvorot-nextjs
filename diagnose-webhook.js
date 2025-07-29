const https = require('https');

// Bot credentials
const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI';

// Function to make API calls to Telegram
function telegramApiCall(method) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test webhook locally
async function testWebhookLocally() {
  console.log('\n🔧 Testing Webhook Locally...\n');
  
  const testPayload = {
    update_id: 123456789,
    message: {
      message_id: 1,
      from: {
        id: 316593422,
        is_bot: false,
        first_name: "Test",
        username: "test_user"
      },
      chat: {
        id: 316593422,
        first_name: "Test",
        username: "test_user",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start"
    }
  };

  // Test with correct header
  console.log('1. Testing with correct secret token:');
  try {
    const response = await fetch('http://localhost:3000/api/telegram/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'vobvorot_webhook_secret_2025'
      },
      body: JSON.stringify(testPayload)
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    if (text) console.log(`   Response: ${text}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test without header
  console.log('\n2. Testing without secret token:');
  try {
    const response = await fetch('http://localhost:3000/api/telegram/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test with wrong header
  console.log('\n3. Testing with wrong secret token:');
  try {
    const response = await fetch('http://localhost:3000/api/telegram/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'wrong_token'
      },
      body: JSON.stringify(testPayload)
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

// Main diagnosis function
async function diagnoseWebhook() {
  console.log('🔍 TELEGRAM WEBHOOK DIAGNOSTIC REPORT');
  console.log('=====================================\n');

  try {
    // 1. Get webhook info
    console.log('1. Current Webhook Information:');
    const webhookInfo = await telegramApiCall('getWebhookInfo');
    
    if (webhookInfo.ok) {
      console.log(`   URL: ${webhookInfo.result.url || 'Not set'}`);
      console.log(`   Has secret token: ${webhookInfo.result.has_custom_certificate ? 'Yes' : 'No'}`);
      console.log(`   Pending updates: ${webhookInfo.result.pending_update_count}`);
      console.log(`   Last error: ${webhookInfo.result.last_error_message || 'None'}`);
      console.log(`   Last error date: ${webhookInfo.result.last_error_date ? new Date(webhookInfo.result.last_error_date * 1000).toISOString() : 'N/A'}`);
      console.log(`   Max connections: ${webhookInfo.result.max_connections}`);
      console.log(`   IP address: ${webhookInfo.result.ip_address || 'Not available'}`);
    }

    // 2. Check bot info
    console.log('\n2. Bot Information:');
    const botInfo = await telegramApiCall('getMe');
    if (botInfo.ok) {
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Bot name: ${botInfo.result.first_name}`);
      console.log(`   Bot ID: ${botInfo.result.id}`);
      console.log(`   Can join groups: ${botInfo.result.can_join_groups}`);
      console.log(`   Can read messages: ${botInfo.result.can_read_all_group_messages}`);
    }

    // 3. Environment check
    console.log('\n3. Environment Variables:');
    console.log(`   TELEGRAM_WEBHOOK_SECRET: ${process.env.TELEGRAM_WEBHOOK_SECRET ? 'Set' : 'NOT SET'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV || 'Not set'}`);

    // 4. List all webhook routes
    console.log('\n4. Available Webhook Routes:');
    const routes = [
      '/api/telegram/webhook',
      '/api/telegram/webhook-direct',
      '/api/telegram/webhook-minimal',
      '/api/telegram/webhook-stateless',
      '/api/telegram/ai-assistant',
      '/api/telegram/smart-agent',
      '/api/telegram/direct',
      '/api/telegram/direct-crm',
      '/api/telegram/hybrid-crm'
    ];
    routes.forEach(route => {
      console.log(`   - https://vobvorot.com${route}`);
    });

    // 5. Test local webhook if running locally
    if (process.env.NODE_ENV !== 'production') {
      await testWebhookLocally();
    }

    // 6. Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('==================\n');

    if (!webhookInfo.result.url) {
      console.log('⚠️  No webhook is currently set. Set it with:');
      console.log(`   curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \\`);
      console.log('        -H "Content-Type: application/json" \\');
      console.log('        -d \'{"url": "https://vobvorot.com/api/telegram/ai-assistant", "secret_token": "vobvorot_webhook_secret_2025"}\'');
    } else if (webhookInfo.result.url !== 'https://vobvorot.com/api/telegram/ai-assistant') {
      console.log(`⚠️  Webhook is set to wrong URL: ${webhookInfo.result.url}`);
      console.log('   Update it to: https://vobvorot.com/api/telegram/ai-assistant');
    }

    if (webhookInfo.result.last_error_message) {
      console.log(`\n⚠️  Last webhook error: ${webhookInfo.result.last_error_message}`);
      console.log('   This usually indicates a problem with the webhook endpoint.');
    }

    console.log('\n✅ To fix webhook issues:');
    console.log('1. Make sure TELEGRAM_WEBHOOK_SECRET is set in Vercel environment variables');
    console.log('2. Set webhook with secret token using the curl command above');
    console.log('3. Check Vercel function logs for detailed error messages');
    console.log('4. Ensure the bot route is properly deployed and accessible');

  } catch (error) {
    console.error('Error during diagnosis:', error);
  }
}

// Run diagnosis
diagnoseWebhook();