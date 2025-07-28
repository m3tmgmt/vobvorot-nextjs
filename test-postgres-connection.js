const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Тестирование подключения к PostgreSQL...');
    
    // Проверяем подключение
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Подключение успешно:', result);
    
    // Проверяем количество товаров
    const productCount = await prisma.product.count();
    console.log(`📦 Товаров в базе данных: ${productCount}`);
    
    // Получаем список товаров
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
    
    // Проверяем есть ли товар Lv
    const lvProduct = await prisma.product.findFirst({
      where: { name: 'Lv' },
      include: {
        category: true,
        skus: true
      }
    });
    
    if (lvProduct) {
      console.log('✅ Товар "Lv" найден в базе данных!');
      console.log(`   Категория: ${lvProduct.category?.name}`);
      console.log(`   SKU: ${lvProduct.skus?.length || 0} шт.`);
    } else {
      console.log('❌ Товар "Lv" НЕ найден в базе данных');
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    console.error('Детали:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();