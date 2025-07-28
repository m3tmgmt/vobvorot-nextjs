const { PrismaClient } = require('@prisma/client');

async function testSQLite() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Тестирование SQLite подключения...');
    
    // Проверяем количество товаров
    const productCount = await prisma.product.count();
    console.log(`📦 Товаров в SQLite базе данных: ${productCount}`);
    
    // Получаем товары
    const products = await prisma.product.findMany({
      include: {
        category: true,
        skus: true
      },
      take: 10
    });
    
    console.log('\n📋 Товары в базе данных:');
    products.forEach(product => {
      console.log(`- ${product.name} (${product.slug})`);
      console.log(`  Категория: ${product.category?.name || 'Нет'}`);
      console.log(`  SKU: ${product.skus?.length || 0} шт.`);
      if (product.skus && product.skus.length > 0) {
        const sku = product.skus[0];
        console.log(`  Цена: $${sku.price}`);
        console.log(`  Склад: ${sku.stock} шт.`);
      }
      console.log('');
    });
    
    // Ищем товар Lv
    const lvProduct = await prisma.product.findFirst({
      where: { name: 'Lv' },
      include: {
        category: true,
        skus: true
      }
    });
    
    if (lvProduct) {
      console.log('✅ Товар "Lv" найден в SQLite!');
      console.log(`   Категория: ${lvProduct.category?.name}`);
      console.log(`   SKU: ${lvProduct.skus?.length || 0} шт.`);
      if (lvProduct.skus && lvProduct.skus.length > 0) {
        console.log(`   Цена: $${lvProduct.skus[0].price}`);
        console.log(`   Склад: ${lvProduct.skus[0].stock} шт.`);
      }
    } else {
      console.log('❌ Товар "Lv" НЕ найден в SQLite');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSQLite();