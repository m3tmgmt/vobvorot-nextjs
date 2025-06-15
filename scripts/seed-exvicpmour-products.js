const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedExvicpmourProducts() {
  try {
    console.log('🌱 Starting EXVICPMOUR products seeding...')

    // Find or create EXVICPMOUR category
    let category = await prisma.category.findFirst({
      where: {
        slug: 'exvicpmour'
      }
    })

    if (!category) {
      console.log('📁 Creating EXVICPMOUR category...')
      category = await prisma.category.create({
        data: {
          name: 'EXVICPMOUR',
          slug: 'exvicpmour',
          description: 'Exclusive EXVICPMOUR collection',
          isActive: true
        }
      })
    }

    console.log(`📁 Category found/created: ${category.name} (ID: ${category.id})`)

    // Check if products already exist
    const existingProducts = await prisma.product.count({
      where: {
        categoryId: category.id
      }
    })

    if (existingProducts > 0) {
      console.log(`⚠️ ${existingProducts} EXVICPMOUR products already exist. Skipping seeding.`)
      return
    }

    // Create EXVICPMOUR products
    const products = [
      {
        name: 'EXVICPMOUR Premium Set',
        slug: 'exvicpmour-premium-set',
        description: 'Exclusive premium set from EXVICPMOUR collection with unique design and premium materials.',
        price: 299.99,
        stock: 50,
        images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop'
        ]
      },
      {
        name: 'EXVICPMOUR Classic Collection',
        slug: 'exvicpmour-classic-collection', 
        description: 'Timeless classic from EXVICPMOUR featuring elegant design and superior craftsmanship.',
        price: 199.99,
        stock: 75,
        images: [
          'https://images.unsplash.com/photo-1441985969846-03d8c68dd9b7?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1441985969846-03d8c68dd9b7?w=800&h=600&fit=crop'
        ]
      },
      {
        name: 'EXVICPMOUR Limited Edition',
        slug: 'exvicpmour-limited-edition',
        description: 'Rare limited edition piece from EXVICPMOUR. Only a few pieces available worldwide.',
        price: 499.99,
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop'
        ]
      },
      {
        name: 'EXVICPMOUR Signature Style',
        slug: 'exvicpmour-signature-style',
        description: 'The signature style that defines EXVICPMOUR brand. Modern aesthetics meets functionality.',
        price: 349.99,
        stock: 40,
        images: [
          'https://images.unsplash.com/photo-1441985969846-03d8c68dd9b7?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'
        ]
      },
      {
        name: 'EXVICPMOUR Essential',
        slug: 'exvicpmour-essential',
        description: 'Essential EXVICPMOUR item perfect for everyday use. Combines style with practicality.',
        price: 149.99,
        stock: 100,
        images: [
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1441985969846-03d8c68dd9b7?w=800&h=600&fit=crop'
        ]
      }
    ]

    console.log(`🛍️ Creating ${products.length} EXVICPMOUR products...`)

    for (const productData of products) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          categoryId: category.id,
          isActive: true,
          images: {
            create: productData.images.map((url, index) => ({
              url,
              alt: productData.name,
              isPrimary: index === 0
            }))
          },
          skus: {
            create: [{
              sku: `${productData.slug}-default`,
              price: productData.price,
              stock: productData.stock
            }]
          }
        },
        include: {
          images: true,
          skus: true
        }
      })

      console.log(`✅ Created product: ${product.name} (ID: ${product.id})`)
    }

    console.log('🎉 EXVICPMOUR products seeding completed successfully!')

    // Verify products were created
    const finalCount = await prisma.product.count({
      where: {
        categoryId: category.id,
        isActive: true
      }
    })

    console.log(`📊 Total active EXVICPMOUR products: ${finalCount}`)

  } catch (error) {
    console.error('❌ Error seeding EXVICPMOUR products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedExvicpmourProducts()
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedExvicpmourProducts }