// Локальное тестирование нового бота
require('dotenv').config();

const { Bot } = require('grammy');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = process.env.TELEGRAM_OWNER_CHAT_ID?.split(',') || [];

console.log('🤖 Локальное тестирование VobvorotAdminBot...');
console.log(`🔑 Token: ${BOT_TOKEN ? BOT_TOKEN.substring(0, 20) + '...' : 'НЕ НАЙДЕН'}`);
console.log(`👥 Admin IDs: ${ADMIN_IDS.join(', ')}`);

async function testLocalBot() {
  try {
    // Создаем бота
    const bot = new Bot(BOT_TOKEN);
    
    // Тестируем подключение
    const me = await bot.api.getMe();
    console.log('✅ Бот подключен:');
    console.log(`   ID: ${me.id}`);
    console.log(`   Username: @${me.username}`);
    console.log(`   Name: ${me.first_name}`);
    
    // Простая команда для тестирования
    bot.command('start', async (ctx) => {
      const userId = ctx.from?.id.toString();
      console.log(`📱 Получена команда /start от пользователя ${userId}`);
      
      if (ADMIN_IDS.includes(userId)) {
        await ctx.reply('✅ Добро пожаловать, админ! Бот работает локально.');
        console.log('✅ Ответ отправлен админу');
      } else {
        await ctx.reply('❌ У вас нет доступа к этому боту');
        console.log('❌ Доступ запрещен для пользователя');
      }
    });
    
    // Запускаем polling на 10 секунд
    console.log('\n🔄 Запускаем polling на 10 секунд...');
    console.log('💡 Отправьте /start боту @VobvorotAdminBot сейчас!');
    
    bot.start();
    
    // Останавливаем через 10 секунд
    setTimeout(async () => {
      await bot.stop();
      console.log('\n⏹️ Тестирование завершено');
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

testLocalBot();