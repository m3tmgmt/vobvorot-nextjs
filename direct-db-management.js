// 🚀 ПРЯМОЕ УПРАВЛЕНИЕ БД БЕЗ NEON CONSOLE
// Работает сразу, не нужны пароли от Neon!

require('dotenv').config()
const { Client } = require('pg')

// Подключение напрямую к вашей БД
const client = new Client({
  connectionString: process.env.DIRECT_DATABASE_URL || 
    "postgresql://vobvorot_owner:WUJUYkjHT68V@ep-lively-hat-a1aqblz3.ap-southeast-1.aws.neon.tech/vobvorot?sslmode=require"
})

async function main() {
  try {
    await client.connect()
    console.log('✅ Подключено к базе данных!')
    
    while (true) {
      console.log('\n🛍️ УПРАВЛЕНИЕ МАГАЗИНОМ VOBVOROT')
      console.log('================================')
      console.log('1. 📦 Показать товары')
      console.log('2. ➕ Добавить товар')  
      console.log('3. ✏️  Изменить цену товара')
      console.log('4. 📋 Показать заказы')
      console.log('5. 📊 Статистика')
      console.log('6. 🔍 SQL запрос (для опытных)')
      console.log('0. ❌ Выход')
      
      const choice = await question('\nВыберите действие: ')
      
      switch(choice) {
        case '1':
          await showProducts()
          break
        case '2':
          await addProduct()
          break
        case '3':
          await updatePrice()
          break
        case '4':
          await showOrders()
          break
        case '5':
          await showStats()
          break
        case '6':
          await runSQL()
          break
        case '0':
          await client.end()
          process.exit(0)
        default:
          console.log('❌ Неверный выбор')
      }
    }
  } catch (err) {
    console.error('❌ Ошибка:', err.message)
    process.exit(1)
  }
}

async function showProducts() {
  const res = await client.query(`
    SELECT p.id, p.name, p.price, p.in_stock, p.quantity, c.name as category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC
    LIMIT 20
  `)
  
  console.log('\n📦 АКТИВНЫЕ ТОВАРЫ:')
  console.table(res.rows.map(p => ({
    'ID': p.id.substring(0, 8),
    'Название': p.name,
    'Цена': `$${(p.price/100).toFixed(2)}`,
    'В наличии': p.in_stock ? '✅' : '❌',
    'Кол-во': p.quantity || 0,
    'Категория': p.category || 'Без категории'
  })))
}

async function addProduct() {
  console.log('\n➕ ДОБАВЛЕНИЕ НОВОГО ТОВАРА')
  
  const name = await question('Название товара: ')
  const price = await question('Цена (в долларах, например 10.50): ')
  const description = await question('Описание: ')
  const quantity = await question('Количество на складе: ')
  
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const priceInCents = Math.round(parseFloat(price) * 100)
  
  try {
    const res = await client.query(`
      INSERT INTO products (name, slug, price, description, quantity, in_stock, status, images)
      VALUES ($1, $2, $3, $4, $5, true, 'active', $6)
      RETURNING id, name
    `, [name, slug, priceInCents, description, parseInt(quantity), ['https://via.placeholder.com/300']])
    
    console.log(`✅ Товар "${res.rows[0].name}" добавлен! ID: ${res.rows[0].id}`)
  } catch (err) {
    console.log('❌ Ошибка:', err.message)
  }
}

async function updatePrice() {
  await showProducts()
  
  const id = await question('\nВведите ID товара (8 символов): ')
  const newPrice = await question('Новая цена (в долларах): ')
  
  try {
    const priceInCents = Math.round(parseFloat(newPrice) * 100)
    const res = await client.query(
      'UPDATE products SET price = $1 WHERE id LIKE $2 RETURNING name',
      [priceInCents, id + '%']
    )
    
    if (res.rowCount > 0) {
      console.log(`✅ Цена товара "${res.rows[0].name}" обновлена!`)
    } else {
      console.log('❌ Товар не найден')
    }
  } catch (err) {
    console.log('❌ Ошибка:', err.message)
  }
}

async function showOrders() {
  const res = await client.query(`
    SELECT o.id, o.order_number, o.email, o.total, o.status, o.created_at
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 10
  `)
  
  console.log('\n📋 ПОСЛЕДНИЕ ЗАКАЗЫ:')
  console.table(res.rows.map(o => ({
    'Номер': o.order_number,
    'Email': o.email,
    'Сумма': `$${(o.total/100).toFixed(2)}`,
    'Статус': o.status,
    'Дата': new Date(o.created_at).toLocaleDateString()
  })))
}

async function showStats() {
  const stats = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM products WHERE status = 'active') as products,
      (SELECT COUNT(*) FROM orders) as orders,
      (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '30 days') as recent_orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders) as total_revenue,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE created_at > NOW() - INTERVAL '30 days') as recent_revenue
  `)
  
  const s = stats.rows[0]
  console.log('\n📊 СТАТИСТИКА МАГАЗИНА:')
  console.log('=======================')
  console.log(`📦 Активных товаров: ${s.products}`)
  console.log(`📋 Всего заказов: ${s.orders}`)
  console.log(`💰 Общий доход: $${(s.total_revenue/100).toFixed(2)}`)
  console.log('\n📅 За последние 30 дней:')
  console.log(`📋 Заказов: ${s.recent_orders}`)
  console.log(`💰 Доход: $${(s.recent_revenue/100).toFixed(2)}`)
}

async function runSQL() {
  console.log('\n🔍 ВВЕДИТЕ SQL ЗАПРОС:')
  console.log('Примеры:')
  console.log('- SELECT * FROM products LIMIT 5')
  console.log('- UPDATE products SET in_stock = false WHERE quantity = 0')
  console.log('- SELECT COUNT(*) FROM orders WHERE status = \'pending\'')
  
  const sql = await question('\nSQL: ')
  
  try {
    const res = await client.query(sql)
    if (res.rows && res.rows.length > 0) {
      console.table(res.rows)
    } else {
      console.log(`✅ Выполнено. Затронуто строк: ${res.rowCount}`)
    }
  } catch (err) {
    console.log('❌ Ошибка:', err.message)
  }
}

function question(prompt) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise(resolve => {
    readline.question(prompt, answer => {
      readline.close()
      resolve(answer)
    })
  })
}

// Запуск
console.log('🚀 Запуск системы управления магазином...')
main()