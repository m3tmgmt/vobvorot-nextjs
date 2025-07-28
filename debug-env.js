console.log('🔍 Проверка переменных окружения:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DIRECT_DATABASE_URL:', process.env.DIRECT_DATABASE_URL);

// Проверим также что видит Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

console.log('\n🔧 Конфигурация Prisma:');
// Попробуем получить внутреннюю информацию о подключении
try {
  console.log('Prisma datasourceUrl:', prisma._engineConfig?.datasourceUrl || 'неизвестно');
  console.log('Prisma datamodelPath:', prisma._engineConfig?.datamodelPath || 'неизвестно');
} catch (error) {
  console.log('Не удалось получить конфигурацию Prisma:', error.message);
}

prisma.$disconnect();