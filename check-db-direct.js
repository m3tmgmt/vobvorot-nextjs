// Проверяем БД напрямую через Railway URL
require('dotenv').config();
const pg = require('pg');

// URL из DIRECT_DATABASE_URL
const connectionString = process.env.DIRECT_DATABASE_URL;
console.log('Подключаемся к:', connectionString ? 'База данных найдена' : 'URL не найден');

const client = new pg.Client({
  connectionString: connectionString
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Подключено к БД');
    
    // Проверяем товары
    const productsResult = await client.query('SELECT COUNT(*) FROM products');
    console.log('\n📦 ТОВАРЫ:');
    console.log('Количество:', productsResult.rows[0].count);
    
    // Смотрим конкретные товары
    const products = await client.query('SELECT id, name, slug, "categoryId", price FROM products LIMIT 10');
    if (products.rows.length > 0) {
      console.log('\nНайденные товары:');
      products.rows.forEach(p => {
        console.log(`- ${p.name} (${p.slug}) - ${p.price} руб`);
      });
    }
    
    // Проверяем категории
    const categoriesResult = await client.query('SELECT * FROM categories');
    console.log('\n📂 КАТЕГОРИИ:');
    console.log('Количество:', categoriesResult.rows.length);
    categoriesResult.rows.forEach(c => {
      console.log(`- ${c.name} (${c.slug})`);
    });
    
    // Проверяем есть ли поле emoji
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      AND column_name = 'emoji'
    `);
    console.log('\n❓ Поле emoji:', columnsResult.rows.length > 0 ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();