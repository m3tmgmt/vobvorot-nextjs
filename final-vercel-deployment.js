// Финальное развертывание на Vercel с правильными переменными окружения
const { execSync } = require('child_process')

console.log('🚀 Финальное развертывание AI ассистента на Vercel...')

// Правильные значения переменных окружения (без \n символов)
const envVars = {
  'TELEGRAM_OWNER_CHAT_ID': '1837334996,316593422',
  'NEXTAUTH_URL': 'https://vobvorot.com',
  'TELEGRAM_WEBHOOK_SECRET': 'vobvorot_webhook_secret_2025'
}

console.log('\n🔧 Настройка переменных окружения в Vercel...')

// Функция для безопасной установки переменной в Vercel
function setVercelEnv(key, value) {
  try {
    // Удаляем существующую переменную
    try {
      execSync(`vercel env rm ${key} production --yes`, { stdio: 'pipe' })
    } catch (e) {
      // Игнорируем ошибку если переменной не было
    }
    
    // Добавляем новую переменную
    execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'pipe' })
    console.log(`✅ Установлена ${key}`)
    return true
  } catch (error) {
    console.log(`❌ Ошибка установки ${key}: ${error.message}`)
    return false
  }
}

// Устанавливаем все переменные
let successCount = 0
Object.entries(envVars).forEach(([key, value]) => {
  if (setVercelEnv(key, value)) {
    successCount++
  }
})

console.log(`\n📊 Установлено ${successCount}/${Object.keys(envVars).length} переменных`)

if (successCount === Object.keys(envVars).length) {
  console.log('\n🚀 Запускаем production deployment...')
  
  try {
    // Запускаем deployment
    const deployResult = execSync('vercel --prod', { encoding: 'utf8' })
    console.log('✅ Deployment успешно завершен!')
    console.log(deployResult)
    
    // Обновляем Telegram webhook
    console.log('\n🔗 Обновление Telegram webhook...')
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
    const webhookUrl = 'https://vobvorot.com/api/telegram/ai-assistant'
    const webhookSecret = 'vobvorot_webhook_secret_2025'
    
    const webhookResult = execSync(`curl -X POST "https://api.telegram.org/bot${botToken}/setWebhook" \\
      -H "Content-Type: application/json" \\
      -d '{"url": "${webhookUrl}", "secret_token": "${webhookSecret}", "allowed_updates": ["message", "callback_query"]}'`, 
      { encoding: 'utf8' })
    
    console.log('🔗 Webhook ответ:', webhookResult)
    
    // Финальная проверка
    console.log('\n🧪 Проверка deployment...')
    
    const healthCheck = execSync(`curl -s -o /dev/null -w "%{http_code}" https://vobvorot.com/api/telegram/ai-assistant`, 
      { encoding: 'utf8' })
    
    if (healthCheck === '200' || healthCheck === '405') {
      console.log('✅ Endpoint отвечает корректно')
      
      console.log('\n🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО УСПЕШНО!')
      console.log('┌─────────────────────────────────────────┐')
      console.log('│  🤖 AI АССИСТЕНТ VOBVOROT v2.0         │')
      console.log('│                                         │')
      console.log('│  ✅ 106 функций в 12 категориях        │')
      console.log('│  🧠 AI обработка с retry логикой        │')  
      console.log('│  🔒 Rate limiting и подтверждения       │')
      console.log('│  📊 Логирование и мониторинг            │')
      console.log('│  🌐 Production deployment готов         │')
      console.log('└─────────────────────────────────────────┘')
      
      console.log('\n📋 Функции по категориям:')
      console.log('📦 Заказы (15): управление заказами и статусами')
      console.log('🛍 Товары (20): каталог, цены, остатки') 
      console.log('👥 CRM (16): клиенты, история, сегментация')
      console.log('📊 Аналитика (15): отчеты, метрики, прогнозы')
      console.log('💳 Платежи (8): обработка и возвраты')
      console.log('🚚 Доставка (10): логистика и отслеживание')
      console.log('⭐ Отзывы (6): модерация и ответы')
      console.log('🎬 Видео (10): контент-менеджмент')
      console.log('📂 Категории (6): структура каталога')
      console.log('🔧 Система (10): администрирование')
      console.log('🤖 AI (5): автоматизация процессов')
      console.log('📢 Маркетинг (5): промо и кампании')
      
      console.log('\n🎯 Тестирование бота:')
      console.log('1. Откройте Telegram')
      console.log('2. Найдите бота @vobvorot_bot')
      console.log('3. Отправьте /start')
      console.log('4. Попробуйте команды: "статистика", "заказы", "товары"')
      
    } else {
      console.log(`❌ Endpoint не отвечает (код: ${healthCheck})`)
    }
    
  } catch (error) {
    console.log('❌ Ошибка deployment:', error.message)
  }
} else {
  console.log('❌ Не удалось установить все переменные окружения')
  console.log('Попробуйте выполнить команды вручную:')
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`vercel env add ${key} production`)
    console.log(`# Введите: ${value}`)
  })
}