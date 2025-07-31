// Проверка реальных имен колонок в БД
const { Client } = require('pg');

async function checkColumns() {
  const client = new Client({
    connectionString: "postgresql://postgres.rrxkyqsqeumfmhxbtcty:VobvorotSecure2025@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });

  try {
    await client.connect();
    
    // Проверяем колонки в categories
    console.log('📂 КОЛОНКИ В ТАБЛИЦЕ categories:');
    const catColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    catColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
    // Проверяем есть ли emoji
    const hasEmoji = catColumns.rows.some(r => r.column_name === 'emoji');
    console.log(`\n✅ Поле emoji: ${hasEmoji ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'}`);
    
    // Проверяем колонки в products  
    console.log('\n📦 КОЛОНКИ В ТАБЛИЦЕ products:');
    const prodColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    prodColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
    // Проверяем есть ли categoryId
    const hasCategoryId = prodColumns.rows.some(r => r.column_name === 'categoryId');
    console.log(`\n✅ Поле categoryId: ${hasCategoryId ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();