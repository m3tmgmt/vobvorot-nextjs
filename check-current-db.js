const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const products = await prisma.product.count();
    const categories = await prisma.category.count();
    console.log('📊 Текущее состояние БД:');
    console.log('- Товаров:', products);
    console.log('- Категорий:', categories);
    
    const product = await prisma.product.findFirst({
      include: { category: true }
    });
    if (product) {
      console.log('\n📦 Товар в БД:');
      console.log('- Название:', product.name);
      console.log('- Цена:', product.price);
      console.log('- Категория:', product.category?.name || 'Без категории');
    }
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();