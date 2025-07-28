import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
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
    const existingProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id
      },
      include: {
        images: true,
        skus: true
      }
    })

    if (existingProducts.length >= 5) {
      return NextResponse.json({
        success: true,
        message: `${existingProducts.length} EXVICPMOUR products already exist. Skipping seeding.`,
        products: existingProducts
      })
    }

    // Create EXVICPMOUR products
    const productsToCreate = [
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

    const createdProducts = []

    for (const productData of productsToCreate) {
      // Check if product with this slug already exists
      const existingProduct = await prisma.product.findUnique({
        where: { slug: productData.slug }
      })

      if (existingProduct) {
        console.log(`⚠️ Product ${productData.name} already exists. Skipping.`)
        continue
      }

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

      createdProducts.push(product)
      console.log(`✅ Created product: ${product.name} (ID: ${product.id})`)
    }

    // Get final count
    const finalProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true
      },
      include: {
        images: true,
        skus: true,
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdProducts.length} new EXVICPMOUR products`,
      created_products: createdProducts.length,
      total_products: finalProducts.length,
      products: finalProducts
    })

  } catch (error) {
    console.error('❌ Error seeding EXVICPMOUR products:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to seed EXVICPMOUR products'
    }, { status: 500 })
  }
}