const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create categories
  const vintageCategory = await prisma.category.create({
    data: {
      name: 'Vintage Accessories',
      slug: 'vintage-accessories',
      description: 'Unique vintage cameras, bags, and accessories'
    }
  })

  const customCategory = await prisma.category.create({
    data: {
      name: 'Custom Designs',
      slug: 'custom-designs',
      description: 'Custom adidas and handmade pieces'
    }
  })

  const exvicpmourCategory = await prisma.category.create({
    data: {
      name: 'EXVICPMOUR',
      slug: 'exvicpmour',
      description: 'Exclusive clothing collection'
    }
  })

  // Create products
  const product1 = await prisma.product.create({
    data: {
      name: 'Vintage Film Camera',
      slug: 'vintage-film-camera',
      description: 'Restored 35mm film camera from the Soviet era. Fully functional with original leather case.',
      brand: 'Zenit',
      categoryId: vintageCategory.id,
      images: {
        create: [
          {
            url: '/assets/images/product1.jpg',
            alt: 'Vintage Film Camera',
            isPrimary: true
          }
        ]
      },
      skus: {
        create: [
          {
            sku: 'VFC-001',
            price: 180.00,
            stock: 1,
            size: 'one size'
          }
        ]
      }
    }
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Custom Adidas Superstar',
      slug: 'custom-adidas-superstar',
      description: 'Hand-painted Adidas Superstars with unique Y2K-inspired design patterns.',
      brand: 'Adidas',
      categoryId: customCategory.id,
      images: {
        create: [
          {
            url: '/assets/images/product2.jpg',
            alt: 'Custom Adidas Superstar',
            isPrimary: true
          }
        ]
      },
      skus: {
        create: [
          {
            sku: 'CAS-001',
            price: 220.00,
            stock: 1,
            size: 'one size'
          }
        ]
      }
    }
  })

  const product3 = await prisma.product.create({
    data: {
      name: 'Vintage Leather Heels',
      slug: 'vintage-leather-heels',
      description: 'Authentic 1990s leather heels in excellent condition. Perfect for special occasions.',
      brand: 'Unknown',
      categoryId: exvicpmourCategory.id,
      images: {
        create: [
          {
            url: '/assets/images/vintage-leather-heels.jpg',
            alt: 'Vintage Leather Heels',
            isPrimary: true
          }
        ]
      },
      skus: {
        create: [
          {
            sku: 'VLH-001',
            price: 95.00,
            stock: 1,
            size: '37'
          }
        ]
      }
    }
  })

  const product4 = await prisma.product.create({
    data: {
      name: 'Handmade Textile Bag',
      slug: 'handmade-textile-bag',
      description: 'Unique textile bag with traditional Ukrainian patterns and modern functionality.',
      brand: 'vobvorot',
      categoryId: exvicpmourCategory.id,
      images: {
        create: [
          {
            url: '/assets/images/handmade-textile-bag.jpg',
            alt: 'Handmade Textile Bag',
            isPrimary: true
          }
        ]
      },
      skus: {
        create: [
          {
            sku: 'HTB-001',
            price: 75.00,
            stock: 2,
            size: 'one size'
          }
        ]
      }
    }
  })

  // Create a test user
  const testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@vobvorot.com'
    }
  })

  // Create some sample reviews
  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Absolutely love this camera! Works perfectly and the vintage aesthetic is amazing.',
      userId: testUser.id,
      productId: product1.id
    }
  })

  await prisma.review.create({
    data: {
      rating: 4,
      comment: 'Beautiful custom work on these shoes. Very unique design.',
      userId: testUser.id,
      productId: product2.id
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${await prisma.category.count()} categories`)
  console.log(`Created ${await prisma.product.count()} products`)
  console.log(`Created ${await prisma.user.count()} users`)
  console.log(`Created ${await prisma.review.count()} reviews`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })