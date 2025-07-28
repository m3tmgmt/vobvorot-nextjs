const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProducts() {
  try {
    console.log('🔍 Проверяем товары в базе данных...')
    
    const products = await prisma.product.findMany({
      include: {
        skus: true,
        images: true,
        category: true
      }
    })
    
    console.log(`📦 Найдено товаров: ${products.length}`)
    
    for (const product of products) {
      console.log(`\n📦 ${product.name}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Slug: ${product.slug}`)
      console.log(`   Описание: ${product.description || 'Нет'}`)
      console.log(`   Категория: ${product.category?.name || 'Нет'}`)
      console.log(`   SKU: ${product.skus.length}`)
      console.log(`   Изображения: ${product.images.length}`)
      console.log(`   Видео: ${product.videoUrl ? 'Есть' : 'Нет'}`)
      console.log(`   Активен: ${product.isActive}`)
      console.log(`   Создан: ${product.createdAt}`)
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProducts()