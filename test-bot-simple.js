// Простой тест бота без импорта TypeScript файла
const { Bot } = require('grammy');

console.log('🤖 Тестируем подключение к Telegram Bot API...');

// Проверка переменных окружения
require('dotenv').config();

console.log('📋 Проверка переменных окружения:');
console.log(`✅ TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? 'установлен' : '❌ не установлен'}`);
console.log(`✅ TELEGRAM_OWNER_CHAT_ID: ${process.env.TELEGRAM_OWNER_CHAT_ID || '❌ не установлен'}`);
console.log(`✅ ADMIN_API_KEY: ${process.env.ADMIN_API_KEY ? 'установлен' : '❌ не установлен'}`);
console.log(`✅ NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ не установлен'}`);
console.log(`✅ CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? 'установлен' : '❌ не установлен'}`);

const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.split(',') || [];
console.log(`👥 Админы: ${ADMIN_IDS.join(', ')}`);

async function testBotConnection() {
  try {
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    
    console.log('🚀 Проверяю подключение к боту...');
    
    // Получаем информацию о боте
    const me = await bot.api.getMe();
    console.log(`✅ Бот подключен: @${me.username} (${me.first_name})`);
    console.log(`🆔 ID бота: ${me.id}`);
    
    // Проверяем веб-хук
    const webhookInfo = await bot.api.getWebhookInfo();
    console.log('📡 Webhook info:', {
      url: webhookInfo.url || 'не установлен (polling режим)',
      pending_update_count: webhookInfo.pending_update_count,
      has_custom_certificate: webhookInfo.has_custom_certificate,
      last_error_date: webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000) : 'нет ошибок'
    });
    
    console.log('✅ Все проверки прошли успешно!');
    console.log('🎯 Бот готов к работе!');
    
    // Тестируем отправку сообщения админу
    if (ADMIN_IDS.length > 0) {
      console.log('📤 Тестирую отправку сообщения админу...');
      try {
        await bot.api.sendMessage(ADMIN_IDS[0], '🧪 Тестовое сообщение от бота VobVorot!\n\n✅ Бот успешно настроен и готов к работе.');
        console.log('✅ Тестовое сообщение отправлено!');
      } catch (msgError) {
        console.log('⚠️ Не удалось отправить тестовое сообщение:', msgError.message);
        console.log('💡 Возможно, бот не запущен в чате или заблокирован');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при подключении к боту:', error.message);
    return false;
  }
}

// Запускаем тестирование
testBotConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Тестирование завершено успешно!');
      console.log('📱 Теперь можете отправить /start боту в Telegram');
    } else {
      console.log('\n❌ Тестирование не прошло');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(console.error);