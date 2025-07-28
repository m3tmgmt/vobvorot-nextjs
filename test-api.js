const { PrismaClient } = require('@prisma/client');

// Симулируем API роут
async function testProductsAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Тестирование API товаров...');
    
    // Получаем товары так же как в API route
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        skus: {
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        images: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      },
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📦 API вернул ${products.length} товаров`);
    
    products.forEach(product => {
      console.log(`\n🏷️ Товар: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Описание: ${product.description || 'Нет'}`);
      console.log(`   Категория: ${product.category?.name || 'Нет'}`);
      console.log(`   SKU: ${product.skus?.length || 0} шт.`);
      console.log(`   Изображения: ${product.images?.length || 0} шт.`);
      
      if (product.skus && product.skus.length > 0) {
        const sku = product.skus[0];
        console.log(`   Цена: $${sku.price}`);
        console.log(`   Склад: ${sku.stock} шт.`);
        console.log(`   SKU код: ${sku.sku}`);
      }
    });
    
    // Проверяем что товар Lv доступен для добавления в корзину
    const lvProduct = products.find(p => p.name === 'Lv');
    if (lvProduct && lvProduct.skus && lvProduct.skus.length > 0) {
      const availableSku = lvProduct.skus.find(s => s.isActive && s.stock > 0);
      if (availableSku) {
        console.log('\n✅ Товар "Lv" доступен для добавления в корзину!');
        console.log(`   SKU ID: ${availableSku.id}`);
        console.log(`   Цена: $${availableSku.price}`);
        console.log(`   Склад: ${availableSku.stock} шт.`);
      } else {
        console.log('\n❌ Товар "Lv" найден, но недоступен (нет активных SKU с остатком)');
      }
    } else {
      console.log('\n❌ Товар "Lv" не найден или у него нет SKU');
    }
    
  } catch (error) {
    console.error('❌ Ошибка API:', error.message);
    console.error('Это значит что API вернет ошибку 500, а не товары');
  } finally {
    await prisma.$disconnect();
  }
}

testProductsAPI();