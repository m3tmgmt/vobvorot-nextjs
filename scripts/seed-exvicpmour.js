require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedExvicpmourCategory() {
  try {
    // Check if EXVICPMOUR category exists
    let exvicpmourCategory = await prisma.category.findUnique({
      where: { slug: 'exvicpmour' }
    })

    if (!exvicpmourCategory) {
      // Create EXVICPMOUR category
      exvicpmourCategory = await prisma.category.create({
        data: {
          name: 'EXVICPMOUR',
          slug: 'exvicpmour',
          description: 'Exclusive EXVICPMOUR collection',
          isActive: true,
          sortOrder: 1
        }
      })
      console.log('✅ Created EXVICPMOUR category:', exvicpmourCategory.id)
    } else {
      console.log('✅ EXVICPMOUR category already exists:', exvicpmourCategory.id)
    }

    // Check if we have EXVICPMOUR products
    const existingProducts = await prisma.product.findMany({
      where: { categoryId: exvicpmourCategory.id }
    })

    if (existingProducts.length === 0) {
      // Create sample EXVICPMOUR products
      const products = [
        {
          name: 'EXVICPMOUR Signature Hoodie',
          slug: 'exvicpmour-signature-hoodie',
          description: 'Premium oversized hoodie with Y2K aesthetic',
          price: 89.99,
          stock: 50,
          imageUrl: '/images/products/hoodie-1.jpg'
        },
        {
          name: 'EXVICPMOUR Metallic Top',
          slug: 'exvicpmour-metallic-top', 
          description: 'Futuristic metallic crop top',
          price: 65.99,
          stock: 30,
          imageUrl: '/images/products/top-1.jpg'
        },
        {
          name: 'EXVICPMOUR Cargo Pants',
          slug: 'exvicpmour-cargo-pants',
          description: 'Tech-wear inspired cargo pants',
          price: 120.99,
          stock: 25,
          imageUrl: '/images/products/pants-1.jpg'
        }
      ]

      for (const productData of products) {
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
            categoryId: exvicpmourCategory.id,
            isActive: true,
            images: {
              create: [{
                url: productData.imageUrl,
                alt: productData.name,
                isPrimary: true
              }]
            },
            skus: {
              create: [{
                sku: `${productData.slug}-default`,
                price: productData.price,
                stock: productData.stock
              }]
            }
          }
        })
        console.log(`✅ Created product: ${product.name}`)
      }
    } else {
      console.log(`✅ Found ${existingProducts.length} existing EXVICPMOUR products`)
    }

    console.log('🎉 EXVICPMOUR seeding completed!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedExvicpmourCategory()