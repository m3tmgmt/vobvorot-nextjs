// Скрипт миграции данных в Supabase
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();

console.log('🚀 МИГРАЦИЯ НА SUPABASE (vobvorot-store)\n');

async function migrateToSupabase() {
  // Подключаемся к SQLite для чтения данных
  const sqliteDb = new sqlite3.Database('./prisma/dev.db');
  
  // Создаем клиент для Supabase (используем .env)
  const supabase = new PrismaClient();
  
  try {
    console.log('1️⃣ Проверяем подключение к Supabase...');
    await supabase.$connect();
    console.log('✅ Подключено к Supabase!\n');
    
    // Читаем данные из SQLite
    console.log('2️⃣ Читаем данные из локальной БД...');
    
    // Категории
    const categories = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM categories', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`Найдено категорий: ${categories.length}`);
    
    // Товары
    const products = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM products', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`Найдено товаров: ${products.length}`);
    
    // SKU
    const skus = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM product_skus', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    console.log(`Найдено SKU: ${skus.length}\n`);
    
    // Переносим данные
    console.log('3️⃣ Переносим данные в Supabase...\n');
    
    // Категории
    for (const cat of categories) {
      await supabase.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: cat.description,
          emoji: cat.emoji || '📦'
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          emoji: cat.emoji || '📦'
        }
      });
      console.log(`✅ Категория: ${cat.name}`);
    }
    
    console.log('');
    
    // Товары
    for (const prod of products) {
      const created = await supabase.product.upsert({
        where: { slug: prod.slug },
        update: {
          name: prod.name,
          description: prod.description,
          brand: prod.brand,
          categoryId: prod.categoryId,
          isActive: prod.isActive === 1
        },
        create: {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          brand: prod.brand,
          categoryId: prod.categoryId,
          isActive: prod.isActive === 1,
          createdAt: new Date(prod.createdAt),
          updatedAt: new Date(prod.updatedAt)
        }
      });
      console.log(`✅ Товар: ${prod.name}`);
      
      // SKU для товара
      const productSkus = skus.filter(s => s.productId === prod.id);
      for (const sku of productSkus) {
        await supabase.productSku.create({
          data: {
            id: sku.id,
            sku: sku.sku,
            size: sku.size,
            price: parseFloat(sku.price),
            compareAtPrice: sku.compareAtPrice ? parseFloat(sku.compareAtPrice) : null,
            stock: parseInt(sku.stock),
            productId: created.id
          }
        });
        console.log(`  ✅ Размер ${sku.size}: ${sku.price} руб`);
      }
    }
    
    // Проверяем результат
    console.log('\n4️⃣ Проверяем результат...');
    const totalProducts = await supabase.product.count();
    const totalCategories = await supabase.category.count();
    const totalSkus = await supabase.productSku.count();
    
    console.log(`\n✅ МИГРАЦИЯ ЗАВЕРШЕНА!`);
    console.log(`Товаров в Supabase: ${totalProducts}`);
    console.log(`Категорий в Supabase: ${totalCategories}`);
    console.log(`SKU в Supabase: ${totalSkus}`);
    
    console.log('\n📝 Следующие шаги:');
    console.log('1. Скопируйте Connection String из Supabase Dashboard');
    console.log('2. Обновите DATABASE_URL в .env файле');
    console.log('3. Обновите переменную на Vercel');
    console.log('4. Задеплойте: npx vercel --prod --token yGHkW9HSoepeo4Q8ZnSBEKwn');
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
  } finally {
    sqliteDb.close();
    await supabase.$disconnect();
  }
}

// Запускаем миграцию
migrateToSupabase();