// 🚀 БЫСТРЫЙ ДОСТУП К БАЗЕ ДАННЫХ БЕЗ NEON CONSOLE
// Запустите: node quick-db-access.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function showMenu() {
  console.log('\n📊 УПРАВЛЕНИЕ МАГАЗИНОМ VOBVOROT')
  console.log('================================')
  console.log('1. 📦 Показать все товары')
  console.log('2. ➕ Добавить новый товар')
  console.log('3. ✏️  Изменить товар')
  console.log('4. 🗑️  Удалить товар')
  console.log('5. 📋 Показать все заказы')
  console.log('6. 📈 Статистика продаж')
  console.log('7. 🏷️  Управление категориями')
  console.log('8. ⭐ Показать отзывы')
  console.log('0. ❌ Выход')
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  readline.question('\nВыберите действие: ', async (choice) => {
    switch(choice) {
      case '1':
        await showProducts()
        break
      case '2':
        await addProduct()
        break
      case '3':
        await editProduct()
        break
      case '4':
        await deleteProduct()
        break
      case '5':
        await showOrders()
        break
      case '6':
        await showStats()
        break
      case '7':
        await manageCategories()
        break
      case '8':
        await showReviews()
        break
      case '0':
        await prisma.$disconnect()
        process.exit(0)
      default:
        console.log('❌ Неверный выбор')
    }
    readline.close()
    await showMenu()
  })
}

async function showProducts() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('\n📦 ТОВАРЫ:')
  console.log('ID | Название | Цена | В наличии | Категория')
  console.log('---|----------|------|-----------|----------')
  
  products.forEach(p => {
    console.log(`${p.id.substring(0,8)} | ${p.name.padEnd(20)} | $${(p.price/100).toFixed(2)} | ${p.inStock ? '✅' : '❌'} | ${p.category?.name || 'Без категории'}`)
  })
  
  console.log(`\nВсего товаров: ${products.length}`)
}

async function addProduct() {
  console.log('\n➕ ДОБАВЛЕНИЕ ТОВАРА')
  
  // Простой пример - в реальности нужен ввод от пользователя
  const newProduct = await prisma.product.create({
    data: {
      name: 'Новый товар ' + Date.now(),
      slug: 'new-product-' + Date.now(),
      price: 1000, // $10.00
      description: 'Описание нового товара',
      images: ['https://via.placeholder.com/300'],
      inStock: true,
      status: 'active'
    }
  })
  
  console.log('✅ Товар добавлен:', newProduct.name)
}

async function showOrders() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      orderItems: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  console.log('\n📋 ПОСЛЕДНИЕ ЗАКАЗЫ:')
  orders.forEach(order => {
    console.log(`\n🆔 Заказ #${order.orderNumber}`)
    console.log(`👤 Клиент: ${order.user?.email || order.email}`)
    console.log(`💰 Сумма: $${(order.total/100).toFixed(2)}`)
    console.log(`📅 Дата: ${order.createdAt.toLocaleDateString()}`)
    console.log(`📦 Статус: ${order.status}`)
    console.log('Товары:')
    order.orderItems.forEach(item => {
      console.log(`  - ${item.product.name} x${item.quantity} = $${(item.price/100).toFixed(2)}`)
    })
  })
}

async function showStats() {
  // Общая статистика
  const totalProducts = await prisma.product.count()
  const totalOrders = await prisma.order.count()
  const totalRevenue = await prisma.order.aggregate({
    _sum: { total: true }
  })
  
  // Продажи за последние 30 дней
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentOrders = await prisma.order.count({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    }
  })
  
  const recentRevenue = await prisma.order.aggregate({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    _sum: { total: true }
  })
  
  console.log('\n📈 СТАТИСТИКА МАГАЗИНА:')
  console.log('=======================')
  console.log(`📦 Всего товаров: ${totalProducts}`)
  console.log(`📋 Всего заказов: ${totalOrders}`)
  console.log(`💰 Общий доход: $${((totalRevenue._sum.total || 0)/100).toFixed(2)}`)
  console.log('\n📅 За последние 30 дней:')
  console.log(`📋 Заказов: ${recentOrders}`)
  console.log(`💰 Доход: $${((recentRevenue._sum.total || 0)/100).toFixed(2)}`)
}

async function manageCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  })
  
  console.log('\n🏷️  КАТЕГОРИИ:')
  console.log('ID | Название | Товаров')
  console.log('---|----------|--------')
  
  categories.forEach(c => {
    console.log(`${c.id.substring(0,8)} | ${c.name.padEnd(20)} | ${c._count.products}`)
  })
}

async function showReviews() {
  const reviews = await prisma.review.findMany({
    include: {
      product: true,
      user: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  
  console.log('\n⭐ ПОСЛЕДНИЕ ОТЗЫВЫ:')
  reviews.forEach(r => {
    console.log(`\n${'⭐'.repeat(r.rating)} ${r.rating}/5`)
    console.log(`📦 ${r.product.name}`)
    console.log(`👤 ${r.user?.name || 'Аноним'}`)
    console.log(`💬 ${r.comment}`)
    console.log(`✅ Проверен: ${r.verified ? 'Да' : 'Нет'}`)
  })
}

async function editProduct() {
  console.log('✏️  Функция редактирования - в разработке')
  console.log('Используйте Neon Console для редактирования')
}

async function deleteProduct() {
  console.log('🗑️  Функция удаления - в разработке')
  console.log('Используйте Neon Console для удаления')
}

// Запуск программы
showMenu().catch(async (e) => {
  console.error('❌ Ошибка:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})