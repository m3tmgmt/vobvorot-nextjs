const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();

// PostgreSQL клиент
const prisma = new PrismaClient();

// SQLite клиент
const sqliteDb = new sqlite3.Database('./prisma/dev.db');

async function migrateData() {
  try {
    console.log('🚀 Начинаем миграцию данных из SQLite в PostgreSQL...');

    // Получаем категории из SQLite
    const categories = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📁 Найдено ${categories.length} категорий`);

    // Мигрируем категории
    for (const cat of categories) {
      try {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {
            name: cat.name,
            description: cat.description
          },
          create: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            isActive: true,
            sortOrder: 0
          }
        });
        console.log(`✅ Категория ${cat.name} мигрирована`);
      } catch (error) {
        console.error(`❌ Ошибка миграции категории ${cat.name}:`, error.message);
      }
    }

    // Получаем товары из SQLite
    const products = await new Promise((resolve, reject) => {
      sqliteDb.all(`
        SELECT p.*, c.slug as categorySlug 
        FROM products p 
        LEFT JOIN categories c ON p.categoryId = c.id
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📦 Найдено ${products.length} товаров`);

    // Мигрируем товары
    for (const prod of products) {
      try {
        // Находим категорию в PostgreSQL
        const category = await prisma.category.findUnique({
          where: { slug: prod.categorySlug }
        });

        if (!category) {
          console.error(`❌ Категория ${prod.categorySlug} не найдена для товара ${prod.name}`);
          continue;
        }

        const migratedProduct = await prisma.product.upsert({
          where: { slug: prod.slug },
          update: {
            name: prod.name,
            description: prod.description,
            brand: prod.brand,
            categoryId: category.id
          },
          create: {
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            brand: prod.brand,
            categoryId: category.id,
            isActive: true
          }
        });

        console.log(`✅ Товар ${prod.name} мигрирован`);

        // Мигрируем SKU для этого товара
        const skus = await new Promise((resolve, reject) => {
          sqliteDb.all('SELECT * FROM product_skus WHERE productId = ?', [prod.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        for (const sku of skus) {
          try {
            await prisma.productSku.upsert({
              where: { sku: sku.sku },
              update: {
                price: parseFloat(sku.price),
                stock: sku.stock,
                size: sku.size,
                color: sku.color
              },
              create: {
                sku: sku.sku,
                price: parseFloat(sku.price),
                stock: sku.stock,
                size: sku.size,
                color: sku.color,
                productId: migratedProduct.id,
                isActive: true
              }
            });
            console.log(`  ✅ SKU ${sku.sku} мигрирован`);
          } catch (error) {
            console.error(`  ❌ Ошибка миграции SKU ${sku.sku}:`, error.message);
          }
        }

        // Мигрируем изображения для этого товара
        const images = await new Promise((resolve, reject) => {
          sqliteDb.all('SELECT * FROM product_images WHERE productId = ?', [prod.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        for (const img of images) {
          try {
            await prisma.productImage.create({
              data: {
                url: img.url,
                alt: img.alt,
                isPrimary: img.isPrimary === 1,
                productId: migratedProduct.id
              }
            });
            console.log(`  ✅ Изображение ${img.url} мигрировано`);
          } catch (error) {
            // Если изображение уже существует, пропускаем
            if (!error.message.includes('Unique constraint')) {
              console.error(`  ❌ Ошибка миграции изображения:`, error.message);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Ошибка миграции товара ${prod.name}:`, error.message);
      }
    }

    console.log('✅ Миграция завершена!');

    // Проверяем результат
    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.category.count();
    const totalSkus = await prisma.productSku.count();

    console.log(`\n📊 Результат миграции:`);
    console.log(`- Категории: ${totalCategories}`);
    console.log(`- Товары: ${totalProducts}`);
    console.log(`- SKU: ${totalSkus}`);

  } catch (error) {
    console.error('❌ Общая ошибка миграции:', error);
  } finally {
    await prisma.$disconnect();
    sqliteDb.close();
  }
}

migrateData();