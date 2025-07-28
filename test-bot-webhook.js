const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const WEBHOOK_URL = 'https://vobvorot.com/api/telegram/direct'
const WEBHOOK_SECRET = 'vobvorot_webhook_secret_2025'

async function testBot() {
  console.log('🧪 Testing Telegram Bot...\n')
  
  // 1. Check webhook info
  console.log('1️⃣ Checking webhook status...')
  const webhookInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
  const webhookData = await webhookInfo.json()
  console.log('Webhook URL:', webhookData.result.url)
  console.log('Pending updates:', webhookData.result.pending_update_count)
  console.log('Last error:', webhookData.result.last_error_message || 'None')
  
  // 2. Test webhook endpoint
  console.log('\n2️⃣ Testing webhook endpoint...')
  const testUpdate = {
    update_id: Date.now(),
    message: {
      message_id: 1,
      from: {
        id: 316593422,
        is_bot: false,
        first_name: "Test",
        username: "test"
      },
      chat: {
        id: 316593422,
        first_name: "Test",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start"
    }
  }
  
  const webhookTest = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Bot-Api-Secret-Token': WEBHOOK_SECRET
    },
    body: JSON.stringify(testUpdate)
  })
  
  console.log('Webhook response status:', webhookTest.status)
  const webhookResponse = await webhookTest.json()
  console.log('Webhook response:', webhookResponse)
  
  // 3. Check debug endpoint
  console.log('\n3️⃣ Checking environment variables...')
  const debugResponse = await fetch('https://vobvorot.com/api/telegram/debug')
  const debugData = await debugResponse.json()
  console.log('Bot token exists:', debugData.bot_token_exists)
  console.log('Admin IDs raw:', debugData.admin_ids_raw)
  console.log('Admin IDs has newline:', debugData.admin_ids_raw?.includes('\\n'))
  
  console.log('\n✅ Test complete!')
  console.log('\n📱 Now try sending /start to @VobvorotAdminBot')
}

testBot().catch(console.error)