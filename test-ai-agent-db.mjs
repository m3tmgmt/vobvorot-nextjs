// Тест подключения AI агента к базе данных
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Загружаем .env.local с перезаписью
config({ path: '.env.local', override: true })

console.log('🤖 Проверка AI агента и базы данных\n')

console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'))
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ установлен' : '❌ не установлен')

const prisma = new PrismaClient()

async function testAIAgent() {
  try {
    await prisma.$connect()
    console.log('\n✅ Подключение к production базе данных успешно!')
    
    // Проверяем, что это правильная база
    const [activeProducts, orders, customers, categories] = await Promise.all([
      prisma.product.count({ where: { status: 'active' } }),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.category.count()
    ])
    
    console.log('\n📊 База данных PRODUCTION:')
    console.log(`- Активных товаров: ${activeProducts}`)
    console.log(`- Заказов: ${orders}`)
    console.log(`- Клиентов: ${customers}`)
    console.log(`- Категорий: ${categories}`)
    
    // Проверяем примеры данных
    const sampleProduct = await prisma.product.findFirst({
      where: { status: 'active' },
      include: { category: true }
    })
    
    if (sampleProduct) {
      console.log(`\n📦 Пример товара: ${sampleProduct.name} (${sampleProduct.price} ₽)`)
      console.log(`   Категория: ${sampleProduct.category?.name || 'Без категории'}`)
    }
    
    console.log('\n🎯 AI агент готов к работе с production базой данных!')
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAIAgent()