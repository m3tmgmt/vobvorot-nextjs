const sqlite3 = require('sqlite3').verbose();

// Создаем соединение с базой данных
const db = new sqlite3.Database('./prisma/dev.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
    return;
  }
  console.log('✅ Подключен к SQLite базе данных');
});

// Функция для генерации уникального ID
function generateId() {
  return 'lv_product_' + Date.now();
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Создаем категорию EXVICPMOUR если её нет
const categoryId = generateId();
const categorySlug = 'exvicpmour';

db.run(`INSERT OR IGNORE INTO categories (id, name, slug, description) 
        VALUES (?, ?, ?, ?)`, 
        [categoryId, 'EXVICPMOUR', categorySlug, 'Коллекция EXVICPMOUR'], 
        function(err) {
  if (err) {
    console.error('Ошибка создания категории:', err.message);
    return;
  }
  console.log('✅ Категория EXVICPMOUR создана или уже существует');
  
  // Добавляем товар Lv
  const productId = generateId();
  const productSlug = generateSlug('Lv');
  
  db.run(`INSERT OR REPLACE INTO products (id, name, slug, description, brand, categoryId, updatedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [productId, 'Lv', productSlug, 'Supa dupa', 'EXVICPMOUR', categoryId, new Date().toISOString()],
          function(err) {
    if (err) {
      console.error('Ошибка создания товара:', err.message);
      return;
    }
    console.log('✅ Товар Lv создан');
    
    // Добавляем SKU для товара
    const skuId = generateId();
    db.run(`INSERT OR REPLACE INTO product_skus (id, sku, price, stock, productId)
            VALUES (?, ?, ?, ?, ?)`,
            [skuId, 'lv-default', 1.0, 5, productId],
            function(err) {
      if (err) {
        console.error('Ошибка создания SKU:', err.message);
        return;
      }
      console.log('✅ SKU для товара Lv создан');
      
      // Добавляем изображения (если есть)
      const imageId = generateId();
      db.run(`INSERT OR REPLACE INTO product_images (id, url, alt, isPrimary, productId)
              VALUES (?, ?, ?, ?, ?)`,
              [imageId, '/api/placeholder/500/500', 'Lv Product Image', 1, productId],
              function(err) {
        if (err) {
          console.error('Ошибка создания изображения:', err.message);
        } else {
          console.log('✅ Изображение для товара Lv создано');
        }
        
        // Проверяем что товар создан
        db.all("SELECT p.id, p.name, p.slug, p.description, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.name = 'Lv'", 
               [], (err, rows) => {
          if (err) {
            console.error('Ошибка проверки товара:', err.message);
          } else {
            console.log('📦 Товары в базе данных:');
            rows.forEach(row => {
              console.log(`- ${row.name} (${row.slug}) - ${row.categoryName}`);
            });
          }
          db.close();
        });
      });
    });
  });
});