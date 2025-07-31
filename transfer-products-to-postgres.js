// Переносим товары из SQLite в PostgreSQL
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();

// Клиент для PostgreSQL (продакшн)
const prisma = new PrismaClient();

// Подключение к SQLite
const sqliteDb = new sqlite3.Database('./prisma/dev.db');

async function transferProducts() {
  console.log('🚀 Переносим товары из SQLite в PostgreSQL...\n');
  
  try {
    // 1. Сначала добавим поле emoji если его нет
    console.log('1️⃣ Добавляем поле emoji в категории...');
    try {
      await prisma.$executeRaw`ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📦'`;
      console.log('✅ Поле emoji добавлено\n');
    } catch (error) {
      console.log('⚠️  Поле emoji уже существует или ошибка:', error.message, '\n');
    }
    
    // 2. Получаем данные из SQLite
    console.log('2️⃣ Читаем данные из SQLite...');
    
    // Получаем категории
    const categories = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM categories', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`Найдено категорий: ${categories.length}`);
    
    // Получаем товары
    const products = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM products', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`Найдено товаров: ${products.length}`);
    
    // Получаем SKU
    const skus = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM product_skus', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    console.log(`Найдено SKU: ${skus.length}\n`);
    
    // 3. Переносим категории
    console.log('3️⃣ Переносим категории...');
    for (const category of categories) {
      try {
        await prisma.category.upsert({
          where: { slug: category.slug },
          update: {
            name: category.name,
            description: category.description,
            emoji: category.emoji || '📦'
          },
          create: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            emoji: category.emoji || '📦'
          }
        });
        console.log(`✅ Категория ${category.name} перенесена`);
      } catch (error) {
        console.log(`⚠️  Ошибка с категорией ${category.name}:`, error.message);
      }
    }
    
    // 4. Переносим товары
    console.log('\n4️⃣ Переносим товары...');
    for (const product of products) {
      try {
        const createdProduct = await prisma.product.upsert({
          where: { slug: product.slug },
          update: {
            name: product.name,
            description: product.description,
            brand: product.brand,
            categoryId: product.categoryId,
            isActive: product.isActive === 1
          },
          create: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            brand: product.brand,
            categoryId: product.categoryId,
            isActive: product.isActive === 1,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt)
          }
        });
        console.log(`✅ Товар "${product.name}" перенесен`);
        
        // Переносим SKU для этого товара
        const productSkus = skus.filter(sku => sku.productId === product.id);
        for (const sku of productSkus) {
          try {
            await prisma.productSku.create({
              data: {
                id: sku.id,
                sku: sku.sku,
                size: sku.size,
                price: parseFloat(sku.price),
                compareAtPrice: sku.compareAtPrice ? parseFloat(sku.compareAtPrice) : null,
                stock: parseInt(sku.stock),
                productId: createdProduct.id
              }
            });
            console.log(`  ✅ SKU размер ${sku.size} - ${sku.price} руб`);
          } catch (error) {
            console.log(`  ⚠️  Ошибка с SKU:`, error.message);
          }
        }
      } catch (error) {
        console.log(`⚠️  Ошибка с товаром ${product.name}:`, error.message);
      }
    }
    
    // 5. Проверяем результат
    console.log('\n5️⃣ Проверяем результат...');
    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.category.count();
    const totalSkus = await prisma.productSku.count();
    
    console.log(`\n✅ ГОТОВО!`);
    console.log(`Товаров в PostgreSQL: ${totalProducts}`);
    console.log(`Категорий в PostgreSQL: ${totalCategories}`);
    console.log(`SKU в PostgreSQL: ${totalSkus}`);
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    sqliteDb.close();
    await prisma.$disconnect();
  }
}

transferProducts();