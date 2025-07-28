// Тестовый запуск Telegram бота
const { bot } = require('./src/lib/telegram-bot.ts');

console.log('🤖 Запускаю Telegram бота для тестирования...');

// Проверка переменных окружения
console.log('📋 Проверка переменных окружения:');
console.log(`✅ TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? 'установлен' : '❌ не установлен'}`);
console.log(`✅ TELEGRAM_OWNER_CHAT_ID: ${process.env.TELEGRAM_OWNER_CHAT_ID || '❌ не установлен'}`);
console.log(`✅ ADMIN_API_KEY: ${process.env.ADMIN_API_KEY ? 'установлен' : '❌ не установлен'}`);
console.log(`✅ NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ не установлен'}`);
console.log(`✅ CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? 'установлен' : '❌ не установлен'}`);

async function testBot() {
  try {
    console.log('🚀 Начинаю тестирование бота...');
    
    // Получаем информацию о боте
    const me = await bot.api.getMe();
    console.log(`✅ Бот подключен: @${me.username} (${me.first_name})`);
    
    // Проверяем веб-хук
    const webhookInfo = await bot.api.getWebhookInfo();
    console.log('📡 Webhook info:', {
      url: webhookInfo.url || 'не установлен',
      pending_update_count: webhookInfo.pending_update_count,
      has_custom_certificate: webhookInfo.has_custom_certificate
    });
    
    console.log('✅ Все проверки прошли успешно!');
    console.log('🎯 Бот готов к работе!');
    
    // Запускаем бота
    console.log('▶️ Запускаю polling...');
    await bot.start({
      onStart: () => {
        console.log('🤖 Бот успешно запущен и ожидает сообщения!');
        console.log('💡 Отправьте /start боту для тестирования');
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании бота:', error);
    process.exit(1);
  }
}

// Обработка сигналов для корректного завершения
process.once('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершаю работу бота...');
  bot.stop();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершаю работу бота...');
  bot.stop();
  process.exit(0);
});

// Запускаем тестирование
testBot().catch(console.error);