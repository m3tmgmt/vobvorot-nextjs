import { PrismaClient } from '@prisma/client'

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

  const furCategory = await prisma.category.create({
    data: {
      name: 'Fur Accessories',
      slug: 'fur-accessories',
      description: 'Luxury fur hats and accessories'
    }
  })

  // Create products
  const product1 = await prisma.product.create({
    data: {
      name: 'Unique Vintage Item',
      slug: 'unique-vintage-item',
      description: 'A one-of-a-kind vintage piece with incredible history and character. Perfect for collectors and fashion enthusiasts.',
      brand: 'vobvorot',
      categoryId: vintageCategory.id,
      images: {
        create: [
          {
            url: '/assets/images/product1.jpg',
            alt: 'Unique Vintage Item',
            // isPrimary: true
          }
        ]
      },
      skus: {
        create: [
          {
            sku: 'UVI-001',
            price: 150.00,
            stock: 1,
            size: 'one size'
          }
        ]
      }
    }
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Custom Design Piece',
      slug: 'custom-design-piece',
      description: 'Handcrafted custom design piece made with attention to detail and unique Ukrainian craftsmanship.',
      brand: 'vobvorot',
      categoryId: customCategory.id,
      images: {
        create: [
          {
            url: '/assets/images/product2.jpg',
            alt: 'Custom Design Piece',
            // isPrimary: true
          }
        ]
      },
      skus: {
        create: [
          {
            sku: 'CDP-001',
            price: 200.00,
            stock: 1,
            size: 'one size'
          }
        ]
      }
    }
  })

  // Create additional sample products for EXVICPMOUR collection
  const exvicpmourProducts = [
    {
      name: 'Vintage Film Camera',
      slug: 'vintage-film-camera',
      description: 'Restored 35mm film camera from the Soviet era. Fully functional with original leather case.',
      brand: 'Zenit',
      price: 180.00
    },
    {
      name: 'Custom Adidas Superstar',
      slug: 'custom-adidas-superstar',
      description: 'Hand-painted Adidas Superstars with unique Y2K-inspired design patterns.',
      brand: 'Adidas',
      price: 220.00
    },
    {
      name: 'Ukrainian Fur Hat',
      slug: 'ukrainian-fur-hat',
      description: 'Traditional Ukrainian fur hat made from ethically sourced materials.',
      brand: 'Traditional',
      price: 165.00
    },
    {
      name: 'Vintage Leather Heels',
      slug: 'vintage-leather-heels',
      description: 'Authentic 1990s leather heels in excellent condition. Perfect for special occasions.',
      brand: 'Unknown',
      price: 95.00
    },
    {
      name: 'Handmade Textile Bag',
      slug: 'handmade-textile-bag',
      description: 'Unique textile bag with traditional Ukrainian patterns and modern functionality.',
      brand: 'vobvorot',
      price: 75.00
    }
  ]

  for (let i = 0; i < exvicpmourProducts.length; i++) {
    const productData = exvicpmourProducts[i]
    await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        brand: productData.brand,
        categoryId: exvicpmourCategory.id,
        images: {
          create: [
            {
              url: `/assets/images/${productData.slug}.jpg`,
              alt: productData.name,
              // isPrimary: true
            }
          ]
        },
        skus: {
          create: [
            {
              sku: `EXV-${String(i + 1).padStart(3, '0')}`,
              price: productData.price,
              stock: Math.floor(Math.random() * 5) + 1,
              size: 'one size'
            }
          ]
        }
      }
    })
  }

  // Create a test user
  const testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@vobvorot.com',
      password: 'test-password' // или хеш пароля
    }
  })

  // Create some sample reviews
  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Absolutely love this piece! The quality is amazing and it arrived quickly.',
      userId: testUser.id,
      productId: product1.id
    }
  })

  await prisma.review.create({
    data: {
      rating: 4,
      comment: 'Beautiful custom work. Very happy with the purchase.',
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