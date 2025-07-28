// Загружаем переменные
require('dotenv').config();

// Создаем Prisma клиент с принудительным использованием DIRECT_DATABASE_URL
const { PrismaClient } = require('@prisma/client');

async function testDirectPrisma() {
  // Принудительно используем DIRECT_DATABASE_URL вместо DATABASE_URL
  const directUrl = process.env.DIRECT_DATABASE_URL;
  console.log('🔍 Используем DIRECT_DATABASE_URL:', directUrl ? directUrl.substring(0, 50) + '...' : 'НЕ НАЙДЕН');
  
  // Временно заменим DATABASE_URL на DIRECT_DATABASE_URL
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = directUrl;
  
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
    datasources: {
      db: {
        url: directUrl
      }
    }
  });

  try {
    console.log('\n🔍 Тестирование прямого подключения через Prisma...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Подключение успешно:', result);
    
    // Проверяем количество товаров
    const productCount = await prisma.product.count();
    console.log(`📦 Товаров в базе данных: ${productCount}`);
    
    // Получаем товары
    const products = await prisma.product.findMany({
      include: {
        category: true,
        skus: true
      },
      take: 5
    });
    
    console.log('\n📋 Товары в базе данных:');
    products.forEach(product => {
      console.log(`- ${product.name} (${product.slug})`);
      console.log(`  Категория: ${product.category?.name || 'Нет'}`);
      console.log(`  SKU: ${product.skus?.length || 0} шт.`);
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
      console.log('\n✅ Товар "Lv" найден в PostgreSQL!');
      console.log(`   Категория: ${lvProduct.category?.name}`);
      console.log(`   SKU: ${lvProduct.skus?.length || 0} шт.`);
    } else {
      console.log('\n❌ Товар "Lv" НЕ найден в PostgreSQL');
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
  } finally {
    // Восстанавливаем оригинальный DATABASE_URL
    process.env.DATABASE_URL = originalDatabaseUrl;
    await prisma.$disconnect();
  }
}

testDirectPrisma();