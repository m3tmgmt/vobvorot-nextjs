require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Try to count categories
    const categoryCount = await prisma.category.count()
    console.log(`✅ Found ${categoryCount} categories`)
    
    // Look for EXVICPMOUR category
    const exvicpmourCategory = await prisma.category.findUnique({
      where: { slug: 'exvicpmour' }
    })
    
    if (exvicpmourCategory) {
      console.log('✅ EXVICPMOUR category exists:', exvicpmourCategory.id)
      
      // Count products in EXVICPMOUR category
      const productCount = await prisma.product.count({
        where: { 
          categoryId: exvicpmourCategory.id,
          isActive: true 
        }
      })
      console.log(`✅ Found ${productCount} active EXVICPMOUR products`)
    } else {
      console.log('❌ EXVICPMOUR category not found')
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()