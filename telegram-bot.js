const { Bot } = require('grammy');

require('dotenv').config();

// Загрузка переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const OWNER_TELEGRAM_ID = parseInt(process.env.OWNER_TELEGRAM_ID || '0');
const ADDITIONAL_ADMIN_ID = parseInt(process.env.ADDITIONAL_ADMIN_ID || '0');
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';

// Проверка наличия необходимых переменных окружения
if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не установлен в переменных окружения');
  process.exit(1);
}

if (!ADMIN_API_KEY) {
  console.error('❌ ADMIN_API_KEY не установлен в переменных окружения');
  process.exit(1);
}

if (!OWNER_TELEGRAM_ID) {
  console.error('❌ OWNER_TELEGRAM_ID не установлен в переменных окружения');
  process.exit(1);
}

// Список разрешенных админов
const ALLOWED_ADMINS = [OWNER_TELEGRAM_ID, ADDITIONAL_ADMIN_ID];

// Функция проверки доступа
const isAdmin = (userId) => ALLOWED_ADMINS.includes(userId);

const bot = new Bot(BOT_TOKEN);

// Admin commands
bot.command('start', async (ctx) => {
  const userId = ctx.from.id;
  
  if (isAdmin(userId)) {
    const userRole = userId === OWNER_TELEGRAM_ID ? 'Владелец' : 'Администратор';
    await ctx.reply(
      `🎯 Добро пожаловать в админ панель vobvorot!\n\n` +
      `👤 Статус: ${userRole}\n\n` +
      '📊 Доступные команды:\n' +
      '/products - Просмотр товаров\n' +
      '/orders - Просмотр заказов\n' +
      '/add_product - Добавить товар\n' +
      '/categories - Управление категориями\n' +
      '/stats - Статистика магазина'
    );
  } else {
    await ctx.reply('❌ У вас нет доступа к этому боту.');
  }
});

// Products command
bot.command('products', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!isAdmin(userId)) {
    await ctx.reply('❌ У вас нет доступа к этой команде.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      let message = '📦 Товары в магазине:\n\n';
      
      data.products.slice(0, 5).forEach((product, index) => {
        message += `${index + 1}. ${product.name}\n`;
        message += `   💰 $${product.skus[0]?.price || 'N/A'}\n`;
        message += `   📦 ${product.skus[0]?.stock || 0} в наличии\n`;
        message += `   🏷️ ${product.category.name}\n\n`;
      });
      
      if (data.products.length > 5) {
        message += `... и еще ${data.products.length - 5} товаров`;
      }
      
      await ctx.reply(message);
    } else {
      await ctx.reply('❌ Товары не найдены.');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    await ctx.reply('❌ Ошибка при получении товаров.');
  }
});

// Stats command
bot.command('stats', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!isAdmin(userId)) {
    await ctx.reply('❌ У вас нет доступа к этой команде.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    const totalProducts = data.products ? data.products.length : 0;
    const totalStock = data.products ? 
      data.products.reduce((sum, product) => sum + (product.skus[0]?.stock || 0), 0) : 0;
    
    const message = `📊 Статистика магазина:\n\n` +
      `📦 Всего товаров: ${totalProducts}\n` +
      `🏪 Общий остаток: ${totalStock} единиц\n` +
      `🌐 Сайт: ${API_BASE_URL}\n` +
      `✅ Статус: Работает`;
    
    await ctx.reply(message);
  } catch (error) {
    console.error('Error fetching stats:', error);
    await ctx.reply('❌ Ошибка при получении статистики.');
  }
});

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start bot
bot.start().then(() => {
  console.log('🤖 Telegram бот запущен!');
  console.log(`👤 Владелец ID: ${OWNER_TELEGRAM_ID}`);
  console.log(`👤 Дополнительный админ ID: ${ADDITIONAL_ADMIN_ID}`);
  console.log(`🔗 Подключен к: ${API_BASE_URL}`);
}).catch(console.error);