// Проверяем работу API в разное время
const fetch = require('node-fetch');

async function checkAPI() {
  console.log('🔍 Проверяем API сайта...\n');
  
  try {
    // 1. Проверяем основной API
    const response = await fetch('https://vobvorot.com/api/products');
    const data = await response.json();
    
    console.log('📊 Ответ API:');
    console.log('- Статус:', response.status);
    console.log('- Успех:', data.success);
    console.log('- Количество товаров:', data.total || 0);
    
    if (data.error) {
      console.log('- Ошибка:', data.error.message);
      console.log('- Детали:', data.error.details);
    }
    
    if (data.products && data.products.length > 0) {
      console.log('\n📦 Найденные товары:');
      data.products.forEach(p => {
        console.log(`- ${p.name} (${p.slug})`);
      });
    }
    
    // 2. Проверяем главную страницу
    console.log('\n🏠 Проверяем главную страницу...');
    const mainPage = await fetch('https://vobvorot.com');
    console.log('- Статус главной:', mainPage.status);
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error.message);
  }
}

checkAPI();