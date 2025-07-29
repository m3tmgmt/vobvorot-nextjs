const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

async function testDatabaseConnection() {
  console.log('🔍 Проверка подключения к базе данных...')
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'))
  
  const prisma = new PrismaClient()
  
  try {
    // Проверка подключения
    await prisma.$connect()
    console.log('✅ Успешно подключено к базе данных!')
    
    // Проверка данных
    const productCount = await prisma.product.count()
    const orderCount = await prisma.order.count()
    const customerCount = await prisma.customer.count()
    const categoryCount = await prisma.category.count()
    
    console.log('\n📊 Статистика базы данных:')
    console.log(`- Товаров: ${productCount}`)
    console.log(`- Заказов: ${orderCount}`)
    console.log(`- Клиентов: ${customerCount}`)
    console.log(`- Категорий: ${categoryCount}`)
    
    // Проверка последних заказов
    const recentOrders = await prisma.order.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    })
    
    if (recentOrders.length > 0) {
      console.log('\n📦 Последние заказы:')
      recentOrders.forEach(order => {
        console.log(`- Заказ #${order.orderNumber} от ${order.customer.name} (${order.status})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()