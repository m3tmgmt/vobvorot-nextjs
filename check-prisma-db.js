// ПРОВЕРКА БД ЧЕРЕЗ PRISMA
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDB() {
  try {
    console.log('🔍 Проверка подключения к БД...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Установлена' : 'НЕ УСТАНОВЛЕНА')
    console.log('DIRECT_DATABASE_URL:', process.env.DIRECT_DATABASE_URL ? 'Установлена' : 'НЕ УСТАНОВЛЕНА')
    
    // 1. Проверяем подключение
    const test = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Подключение успешно!')
    
    // 2. Проверяем товары
    console.log('\n📦 ТОВАРЫ:')
    const productCount = await prisma.product.count()
    console.log('Всего товаров:', productCount)
    
    if (productCount > 0) {
      const products = await prisma.product.findMany({
        take: 3,
        include: { category: true }
      })
      console.log('\nПримеры товаров:')
      products.forEach(p => {
        console.log(`- ${p.name} ($${p.price/100}) - Категория: ${p.category?.name || 'Без категории'}`)
      })
    }
    
    // 3. Проверяем категории
    console.log('\n🏷️ КАТЕГОРИИ:')
    const categories = await prisma.category.findMany()
    console.log('Всего категорий:', categories.length)
    categories.forEach(c => {
      console.log(`- ${c.name} (${c.slug})`)
    })
    
    // 4. Проверяем структуру категорий
    console.log('\n🔍 Проверка структуры категорий...')
    const firstCategory = await prisma.category.findFirst()
    if (firstCategory) {
      console.log('Поля категории:', Object.keys(firstCategory))
    }
    
  } catch (error) {
    console.error('❌ ОШИБКА:', error.message)
    console.error('Детали:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDB()