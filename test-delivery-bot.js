// Тестирование функций доставки в боте
const { Bot } = require('grammy')

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const bot = new Bot(BOT_TOKEN)

// Webhook URL для локального тестирования
const WEBHOOK_URL = 'http://localhost:3000/api/telegram/ai-assistant'

// Тестовые команды
const testCommands = [
  'покажи зоны доставки',
  'можно доставить в США',
  'рассчитай доставку для заказа 1740570565',
  'статус доставки заказа 1740570565'
]

async function sendTestCommand(command, userId = '316593422') {
  console.log(`\n🔄 Отправляю команду: "${command}"`)
  
  const update = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: parseInt(userId),
        is_bot: false,
        first_name: 'Test',
        username: 'testuser'
      },
      chat: {
        id: parseInt(userId),
        first_name: 'Test',
        username: 'testuser',
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: command
    }
  }
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'not-used-in-dev'
      },
      body: JSON.stringify(update)
    })
    
    const result = await response.text()
    console.log(`✅ Ответ получен (статус ${response.status})`)
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  }
}

async function runTests() {
  console.log('🚀 Начинаем тестирование функций доставки...')
  console.log('⚠️  Убедитесь, что сервер запущен: npm run dev')
  console.log('⚠️  Проверяйте ответы в Telegram')
  
  // Даем время на запуск сервера
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Последовательно отправляем команды
  for (const command of testCommands) {
    await sendTestCommand(command)
    // Ждем между командами
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  console.log('\n✅ Тестирование завершено!')
  console.log('📱 Проверьте ответы бота в Telegram')
}

// Запуск тестов
runTests().catch(console.error)