const { PrismaClient } = require('@prisma/client');

async function addLvProduct() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Добавление товара "Lv" через Prisma...');
    
    // Создаем категорию EXVICPMOUR если её нет
    let category = await prisma.category.findFirst({
      where: { name: 'EXVICPMOUR' }
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'EXVICPMOUR',
          slug: 'exvicpmour',
          description: 'Коллекция EXVICPMOUR',
          isActive: true,
          sortOrder: 0
        }
      });
      console.log('✅ Категория EXVICPMOUR создана');
    } else {
      console.log('✅ Категория EXVICPMOUR уже существует');
    }
    
    // Проверяем есть ли уже товар Lv
    let product = await prisma.product.findFirst({
      where: { name: 'Lv' },
      include: { skus: true }
    });
    
    if (product) {
      console.log('✅ Товар "Lv" уже существует');
    } else {
      // Создаем товар Lv
      product = await prisma.product.create({
        data: {
          name: 'Lv',
          slug: 'lv',
          description: 'Supa dupa',
          brand: 'EXVICPMOUR',
          categoryId: category.id,
          isActive: true,
          skus: {
            create: {
              sku: 'lv-default',
              price: 1.0,
              stock: 5,
              isActive: true
            }
          },
          images: {
            create: {
              url: '/api/placeholder/500/500',
              alt: 'Lv Product Image',
              isPrimary: true
            }
          }
        },
        include: {
          category: true,
          skus: true,
          images: true
        }
      });
      console.log('✅ Товар "Lv" создан успешно');
    }
    
    // Проверяем итоговое состояние базы
    const totalProducts = await prisma.product.count();
    console.log(`📦 Всего товаров в базе: ${totalProducts}`);
    
    const allProducts = await prisma.product.findMany({
      include: {
        category: true,
        skus: true
      }
    });
    
    console.log('\n📋 Все товары в базе данных:');
    allProducts.forEach(p => {
      console.log(`- ${p.name} (${p.slug})`);
      console.log(`  Категория: ${p.category?.name || 'Нет'}`);
      console.log(`  SKU: ${p.skus?.length || 0} шт.`);
      if (p.skus && p.skus.length > 0) {
        console.log(`  Цена: $${p.skus[0].price}, Склад: ${p.skus[0].stock} шт.`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addLvProduct();