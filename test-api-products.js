const { default: fetch } = require('node-fetch');

async function testProducts() {
  try {
    console.log('🔍 Тестирование API товаров...');
    const response = await fetch('http://localhost:3000/api/products');
    const data = await response.json();
    
    console.log('✅ Ответ получен:');
    console.log('- Статус:', response.status);
    console.log('- Успех:', data.success);
    console.log('- Количество товаров:', data.products?.length || 0);
    
    if (data.products && data.products.length > 0) {
      console.log('\n📦 Найденные товары:');
      data.products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (${product.slug})`);
        console.log(`   Категория: ${product.category?.name || 'Нет'}`);
        console.log(`   SKU: ${product.skus?.length || 0} шт.`);
        console.log(`   Цена: $${product.skus?.[0]?.price || 'N/A'}`);
        console.log(`   Склад: ${product.skus?.[0]?.stock || 0} шт.`);
        console.log('');
      });
    } else {
      console.log('❌ Товары не найдены или используются mock данные');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testProducts();