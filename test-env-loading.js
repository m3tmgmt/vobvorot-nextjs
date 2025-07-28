// Явная загрузка .env файла
require('dotenv').config();

console.log('🔍 Проверка загрузки переменных из .env:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'загружен' : 'НЕ загружен');
console.log('DIRECT_DATABASE_URL:', process.env.DIRECT_DATABASE_URL ? 'загружен' : 'НЕ загружен');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
}
if (process.env.DIRECT_DATABASE_URL) {
  console.log('DIRECT_DATABASE_URL:', process.env.DIRECT_DATABASE_URL.substring(0, 50) + '...');
}

// Теперь тестируем Prisma подключение
const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
  });

  try {
    console.log('\n🔍 Тестирование Prisma подключения...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Подключение успешно:', result);
    
    // Проверяем количество товаров
    const productCount = await prisma.product.count();
    console.log(`📦 Товаров в базе данных: ${productCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();