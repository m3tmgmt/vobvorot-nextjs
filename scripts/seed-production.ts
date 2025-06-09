#!/usr/bin/env tsx

/**
 * Production Seed Script
 * 
 * Seeds the production database with essential data:
 * - Default admin user
 * - Basic categories
 * - Essential system data
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface SeedConfig {
  adminEmail: string
  adminPassword: string
  siteName: string
  defaultCurrency: string
}

const config: SeedConfig = {
  adminEmail: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  siteName: process.env.SITE_NAME || 'VobVorot Store',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD'
}

async function seedAdminUser() {
  console.log('Creating admin user...')
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: config.adminEmail }
  })

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...')
    return existingAdmin
  }

  const hashedPassword = await bcrypt.hash(config.adminPassword, 12)

  const admin = await prisma.user.create({
    data: {
      email: config.adminEmail,
      name: 'Administrator',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
      newsletter: false,
      language: 'en'
    }
  })

  console.log(`Admin user created: ${admin.email}`)
  return admin
}

async function seedCategories() {
  console.log('Creating default categories...')

  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and gardening supplies',
      isActive: true,
      sortOrder: 3
    },
    {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Sports equipment and outdoor gear',
      isActive: true,
      sortOrder: 4
    },
    {
      name: 'Books & Media',
      slug: 'books-media',
      description: 'Books, movies, music, and digital media',
      isActive: true,
      sortOrder: 5
    }
  ]

  for (const categoryData of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: categoryData.slug }
    })

    if (!existing) {
      const category = await prisma.category.create({
        data: categoryData
      })
      console.log(`Created category: ${category.name}`)
    } else {
      console.log(`Category already exists: ${categoryData.name}`)
    }
  }

  // Create subcategories for Electronics
  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'electronics' }
  })

  if (electronicsCategory) {
    const subcategories = [
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Mobile phones and accessories',
        parentId: electronicsCategory.id,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Laptops and computers',
        parentId: electronicsCategory.id,
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Gaming consoles and accessories',
        parentId: electronicsCategory.id,
        isActive: true,
        sortOrder: 3
      }
    ]

    for (const subcategoryData of subcategories) {
      const existing = await prisma.category.findUnique({
        where: { slug: subcategoryData.slug }
      })

      if (!existing) {
        const subcategory = await prisma.category.create({
          data: subcategoryData
        })
        console.log(`Created subcategory: ${subcategory.name}`)
      }
    }
  }
}

async function seedSampleProduct() {
  console.log('Creating sample product...')

  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'electronics' }
  })

  if (!electronicsCategory) {
    console.log('Electronics category not found, skipping sample product')
    return
  }

  const existingProduct = await prisma.product.findUnique({
    where: { slug: 'sample-product' }
  })

  if (existingProduct) {
    console.log('Sample product already exists, skipping...')
    return
  }

  const product = await prisma.product.create({
    data: {
      name: 'Sample Product',
      slug: 'sample-product',
      description: 'This is a sample product for testing purposes. Please replace with actual products.',
      brand: 'Sample Brand',
      categoryId: electronicsCategory.id,
      isActive: true,
      metaTitle: 'Sample Product - VobVorot Store',
      metaDescription: 'Sample product for testing the store functionality'
    }
  })

  // Create sample SKU
  await prisma.productSku.create({
    data: {
      sku: 'SAMPLE-001',
      price: 99.99,
      stock: 10,
      productId: product.id,
      isActive: true,
      lowStockThreshold: 3
    }
  })

  // Create sample image
  await prisma.productImage.create({
    data: {
      url: 'https://via.placeholder.com/400x400?text=Sample+Product',
      alt: 'Sample Product Image',
      isPrimary: true,
      productId: product.id
    }
  })

  console.log(`Created sample product: ${product.name}`)
}

async function verifyData() {
  console.log('\nVerifying seeded data...')

  const userCount = await prisma.user.count()
  const categoryCount = await prisma.category.count()
  const productCount = await prisma.product.count()

  console.log(`Users: ${userCount}`)
  console.log(`Categories: ${categoryCount}`)
  console.log(`Products: ${productCount}`)

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (adminUser) {
    console.log(`Admin user: ${adminUser.email}`)
  }
}

async function main() {
  console.log('🌱 Starting production database seeding...')

  try {
    await seedAdminUser()
    await seedCategories()
    await seedSampleProduct()
    await verifyData()

    console.log('\n✅ Production seeding completed successfully!')
    console.log('\nIMPORTANT NOTES:')
    console.log('- Change the default admin password immediately')
    console.log('- Remove the sample product when adding real products')
    console.log('- Review all default settings before going live')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })