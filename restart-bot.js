const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const WEBHOOK_URL = 'https://vobvorot.com/api/telegram/webhook'
const WEBHOOK_SECRET = 'vobvorot_webhook_secret_2025'

async function restartBot() {
  console.log('🔄 Restarting bot...')
  
  // 1. Delete webhook
  console.log('🗑️ Deleting old webhook...')
  const deleteRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`)
  const deleteData = await deleteRes.json()
  console.log('Delete result:', deleteData)
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 2. Set new webhook
  console.log('📡 Setting new webhook...')
  const setRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ['message', 'callback_query', 'inline_query']
    })
  })
  const setData = await setRes.json()
  console.log('Set result:', setData)
  
  // 3. Check webhook info
  console.log('🔍 Checking webhook info...')
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
  const infoData = await infoRes.json()
  console.log('Webhook info:', JSON.stringify(infoData, null, 2))
  
  // 4. Get bot info
  console.log('🤖 Getting bot info...')
  const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`)
  const meData = await meRes.json()
  console.log('Bot info:', JSON.stringify(meData, null, 2))
}

restartBot().catch(console.error)