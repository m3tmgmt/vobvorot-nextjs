// ПРОВЕРКА РЕАЛЬНОЙ БД
require('dotenv').config()
const { Client } = require('pg')

async function checkRealDB() {
  const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL
  })
  
  try {
    await client.connect()
    console.log('✅ Подключено к РЕАЛЬНОЙ БД!')
    
    // 1. Проверяем таблицы
    console.log('\n📋 ТАБЛИЦЫ В БД:')
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    console.table(tables.rows)
    
    // 2. Проверяем структуру categories
    console.log('\n🏷️ СТРУКТУРА ТАБЛИЦЫ categories:')
    const categoryColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `)
    console.table(categoryColumns.rows)
    
    // 3. Проверяем есть ли товары
    console.log('\n📦 КОЛИЧЕСТВО ТОВАРОВ:')
    const productCount = await client.query('SELECT COUNT(*) FROM products')
    console.log('Всего товаров:', productCount.rows[0].count)
    
    // 4. Проверяем есть ли категории
    console.log('\n🏷️ КАТЕГОРИИ:')
    const categories = await client.query('SELECT * FROM categories LIMIT 5')
    console.table(categories.rows)
    
    // 5. Пример товаров
    console.log('\n📦 ПРИМЕРЫ ТОВАРОВ:')
    const products = await client.query(`
      SELECT p.id, p.name, p.price, p.status, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LIMIT 5
    `)
    console.table(products.rows)
    
  } catch (err) {
    console.error('❌ ОШИБКА:', err.message)
  } finally {
    await client.end()
  }
}

checkRealDB()