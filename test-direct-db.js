const { Client } = require('pg');

async function testDirectConnection() {
  const client = new Client({
    connectionString: 'postgresql://vobvorot_owner:WUJUYkjHT68V@ep-lively-hat-a1aqblz3.ap-southeast-1.aws.neon.tech/vobvorot?sslmode=require'
  });

  try {
    console.log('🔍 Тестирование прямого подключения к Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Подключение успешно!');
    
    // Проверяем таблицы
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Таблицы в базе данных:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Проверяем товары
    const productsResult = await client.query(`
      SELECT p.id, p.name, p.slug, p.description, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      ORDER BY p."createdAt" DESC
      LIMIT 10
    `);
    
    console.log(`\n📦 Товаров в базе: ${productsResult.rows.length}`);
    productsResult.rows.forEach(product => {
      console.log(`- ${product.name} (${product.slug})`);
      console.log(`  Категория: ${product.category_name || 'Нет'}`);
      console.log(`  Описание: ${product.description || 'Нет'}`);
    });
    
    // Ищем товар Lv
    const lvResult = await client.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p.name = 'Lv'
    `);
    
    if (lvResult.rows.length > 0) {
      console.log('\n✅ Товар "Lv" найден!');
      console.log('Детали:', lvResult.rows[0]);
    } else {
      console.log('\n❌ Товар "Lv" не найден в базе данных');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

testDirectConnection();