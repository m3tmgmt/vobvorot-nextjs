// Сравнение схемы Prisma с реальной БД
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function compareSchema() {
  console.log('🔍 СРАВНЕНИЕ СХЕМЫ PRISMA С БАЗОЙ ДАННЫХ\n');
  
  try {
    // 1. Читаем модели из schema.prisma
    const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf8');
    const modelMatches = schemaContent.match(/model\s+(\w+)\s*{/g);
    const prismaModels = modelMatches.map(m => {
      const modelName = m.match(/model\s+(\w+)/)[1];
      // Конвертируем в snake_case для таблиц
      return modelName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's';
    });
    
    // Особые случаи
    const specialCases = {
      'users': 'users', // уже множественное
      'categorys': 'categories', // неправильное множественное
      'addresss': 'addresses',
      'order_logs': 'order_logs', // уже snake_case
      'product_skus': 'product_skus',
      'product_images': 'product_images',
      'stock_reservations': 'stock_reservations',
      'order_items': 'order_items',
      'user_addresss': 'user_addresses',
      'wishlist_items': 'wishlist_items',
      'sign_orders': 'sign_orders',
      'future_letters': 'future_letters',
      'verification_tokens': 'verification_tokens'
    };
    
    const expectedTables = prismaModels.map(t => specialCases[t] || t);
    
    // 2. Получаем реальные таблицы из БД
    const dbTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const actualTables = dbTables.map(t => t.table_name);
    
    // 3. Сравниваем
    console.log('📋 ОЖИДАЕМЫЕ ТАБЛИЦЫ (из schema.prisma):');
    console.log(expectedTables.sort().join(', '));
    console.log(`Всего: ${expectedTables.length}\n`);
    
    console.log('📊 РЕАЛЬНЫЕ ТАБЛИЦЫ (в Supabase):');
    console.log(actualTables.join(', '));
    console.log(`Всего: ${actualTables.length}\n`);
    
    // 4. Находим различия
    const missingInDb = expectedTables.filter(t => !actualTables.includes(t));
    const extraInDb = actualTables.filter(t => !expectedTables.includes(t));
    
    if (missingInDb.length > 0) {
      console.log('❌ ОТСУТСТВУЮТ В БД:');
      console.log(missingInDb.join(', '));
    }
    
    if (extraInDb.length > 0) {
      console.log('\n⚠️  ЛИШНИЕ В БД:');
      console.log(extraInDb.join(', '));
    }
    
    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log('✅ ВСЕ ТАБЛИЦЫ СООТВЕТСТВУЮТ СХЕМЕ!');
    }
    
    // 5. Проверяем критические поля
    console.log('\n🔑 ПРОВЕРКА КРИТИЧЕСКИХ ПОЛЕЙ:');
    
    // Проверяем поле emoji в categories
    const emojiCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'emoji'
    `;
    console.log(`- categories.emoji: ${emojiCheck[0].count > 0 ? '✅ ЕСТЬ' : '❌ ОТСУТСТВУЕТ'}`);
    
    // Проверяем поля в products
    const productFields = ['name', 'slug', 'description', 'categoryId', 'isActive'];
    for (const field of productFields) {
      const check = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = ${field}
      `;
      console.log(`- products.${field}: ${check[0].count > 0 ? '✅' : '❌'}`);
    }
    
    // Проверяем поля в product_skus
    const skuFields = ['sku', 'price', 'stock', 'productId'];
    for (const field of skuFields) {
      const check = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = 'product_skus' AND column_name = ${field}
      `;
      console.log(`- product_skus.${field}: ${check[0].count > 0 ? '✅' : '❌'}`);
    }
    
    console.log('\n✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

compareSchema();