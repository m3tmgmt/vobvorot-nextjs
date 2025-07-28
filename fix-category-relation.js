const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./prisma/dev.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
    return;
  }
  console.log('✅ Подключен к SQLite базе данных');
});

// Получаем ID категории EXVICPMOUR
db.get("SELECT id FROM categories WHERE slug = 'exvicpmour'", [], (err, category) => {
  if (err) {
    console.error('Ошибка поиска категории:', err.message);
    return;
  }
  
  if (!category) {
    console.error('❌ Категория EXVICPMOUR не найдена');
    db.close();
    return;
  }
  
  console.log('✅ Найдена категория EXVICPMOUR с ID:', category.id);
  
  // Обновляем товар Lv чтобы он ссылался на правильную категорию
  db.run("UPDATE products SET categoryId = ? WHERE name = 'Lv'", [category.id], function(err) {
    if (err) {
      console.error('Ошибка обновления товара:', err.message);
      return;
    }
    
    console.log('✅ Товар Lv привязан к категории EXVICPMOUR');
    
    // Проверяем результат
    db.all(`SELECT p.id, p.name, p.slug, p.description, c.name as categoryName, c.slug as categorySlug 
            FROM products p 
            LEFT JOIN categories c ON p.categoryId = c.id 
            WHERE p.name = 'Lv'`, [], (err, rows) => {
      if (err) {
        console.error('Ошибка проверки:', err.message);
      } else {
        console.log('\n📦 Обновленные товары:');
        rows.forEach(row => {
          console.log(`- ${row.name} (${row.slug})`);
          console.log(`  Описание: ${row.description}`);
          console.log(`  Категория: ${row.categoryName} (${row.categorySlug})`);
        });
      }
      
      // Проверяем SKU
      db.all(`SELECT ps.id, ps.sku, ps.price, ps.stock, p.name as productName
              FROM product_skus ps
              LEFT JOIN products p ON ps.productId = p.id
              WHERE p.name = 'Lv'`, [], (err, skus) => {
        if (err) {
          console.error('Ошибка проверки SKU:', err.message);
        } else {
          console.log('\n🏷️ SKU товара:');
          skus.forEach(sku => {
            console.log(`- ${sku.sku}: $${sku.price}, склад: ${sku.stock} шт.`);
          });
        }
        
        db.close();
      });
    });
  });
});