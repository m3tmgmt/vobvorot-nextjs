import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminApiKey, createAuthErrorResponse, createServerErrorResponse } from '@/lib/validation'
import { logger } from '@/lib/logger'

// Mock products data from products API
const mockProducts = [
  {
    id: "1",
    name: "Classic T-Shirt",
    slug: "classic-t-shirt",
    description: "Comfortable cotton t-shirt with premium quality fabric",
    price: 29.99,
    categoryName: "Clothing",
    categorySlug: "clothing",
    categoryEmoji: "👕",
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        alt: "Classic T-Shirt"
      }
    ],
    skus: [
      {
        sku: "classic-t-shirt-default",
        price: 29.99,
        stock: 50,
        size: "M",
        color: "Black"
      }
    ]
  },
  {
    id: "2", 
    name: "Designer Sneakers",
    slug: "designer-sneakers",
    description: "Trendy sneakers with modern design and comfort",
    price: 89.99,
    categoryName: "Shoes",
    categorySlug: "shoes",
    categoryEmoji: "👠",
    images: [
      {
        url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
        alt: "Designer Sneakers"
      }
    ],
    skus: [
      {
        sku: "designer-sneakers-default", 
        price: 89.99,
        stock: 25,
        size: "9",
        color: "White"
      }
    ]
  },
  {
    id: "3",
    name: "Luxury Watch",
    slug: "luxury-watch", 
    description: "Premium timepiece with elegant design",
    price: 299.99,
    categoryName: "Accessories",
    categorySlug: "accessories",
    categoryEmoji: "💍",
    images: [
      {
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        alt: "Luxury Watch"
      }
    ],
    skus: [
      {
        sku: "luxury-watch-default",
        price: 299.99, 
        stock: 15,
        size: "One Size",
        color: "Silver"
      }
    ]
  },
  {
    id: "4",
    name: "Stylish Hat",
    slug: "stylish-hat",
    description: "Fashionable hat perfect for any occasion", 
    price: 39.99,
    categoryName: "Hats",
    categorySlug: "hats",
    categoryEmoji: "🎩",
    images: [
      {
        url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500",
        alt: "Stylish Hat"
      }
    ],
    skus: [
      {
        sku: "stylish-hat-default",
        price: 39.99,
        stock: 30,
        size: "One Size", 
        color: "Black"
      }
    ]
  },
  {
    id: "5",
    name: "EXVICPMOUR Special Edition",
    slug: "exvicpmour-special-edition",
    description: "Limited edition EXVICPMOUR collection item",
    price: 149.99,
    categoryName: "EXVICPMOUR",
    categorySlug: "exvicpmour",
    categoryEmoji: "✨",
    images: [
      {
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500", 
        alt: "EXVICPMOUR Special Edition"
      }
    ],
    skus: [
      {
        sku: "exvicpmour-special-edition-default",
        price: 149.99,
        stock: 20,
        size: "One Size",
        color: "Gold"
      }
    ]
  },
  {
    id: "6",
    name: "Designer Handbag",
    slug: "designer-handbag",
    description: "Elegant handbag with premium materials",
    price: 199.99,
    categoryName: "Bags",
    categorySlug: "bags",
    categoryEmoji: "👜",
    images: [
      {
        url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
        alt: "Designer Handbag"
      }
    ],
    skus: [
      {
        sku: "designer-handbag-default", 
        price: 199.99,
        stock: 18,
        size: "Medium",
        color: "Brown"
      }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    if (!validateAdminApiKey(request)) {
      return createAuthErrorResponse('Admin access required')
    }

    logger.info('Starting product initialization from mock data')

    const result = await prisma.$transaction(async (tx) => {
      const createdCategories = new Map<string, string>()
      const createdProducts = []

      // Step 1: Create categories
      for (const mockProduct of mockProducts) {
        if (!createdCategories.has(mockProduct.categorySlug)) {
          // Check if category already exists
          let category = await tx.category.findUnique({
            where: { slug: mockProduct.categorySlug }
          })

          if (!category) {
            category = await tx.category.create({
              data: {
                name: mockProduct.categoryName,
                slug: mockProduct.categorySlug,
                description: `${mockProduct.categoryEmoji} ${mockProduct.categoryName} collection`,
                isActive: true,
                sortOrder: createdCategories.size
              }
            })
            
            logger.info('Created category:', {
              name: category.name,
              slug: category.slug
            })
          }

          createdCategories.set(mockProduct.categorySlug, category.id)
        }
      }

      // Step 2: Create products with SKUs and images
      for (const mockProduct of mockProducts) {
        // Check if product already exists
        const existingProduct = await tx.product.findUnique({
          where: { slug: mockProduct.slug }
        })

        if (existingProduct) {
          logger.info('Product already exists, skipping:', { slug: mockProduct.slug })
          continue
        }

        const categoryId = createdCategories.get(mockProduct.categorySlug)!

        // Create product
        const product = await tx.product.create({
          data: {
            name: mockProduct.name,
            slug: mockProduct.slug,
            description: mockProduct.description,
            categoryId,
            isActive: true,
            
            // Create images
            images: {
              create: mockProduct.images.map((image, index) => ({
                url: image.url,
                alt: image.alt,
                isPrimary: index === 0
              }))
            },
            
            // Create SKUs
            skus: {
              create: mockProduct.skus.map(skuData => ({
                sku: skuData.sku,
                price: skuData.price,
                stock: skuData.stock,
                reservedStock: 0, // Explicitly set
                size: skuData.size,
                color: skuData.color,
                isActive: true
              }))
            }
          },
          include: {
            category: true,
            images: true,
            skus: true
          }
        })

        createdProducts.push(product)
        
        logger.info('Created product:', {
          name: product.name,
          slug: product.slug,
          category: product.category.name,
          skusCount: product.skus.length,
          imagesCount: product.images.length
        })
      }

      return {
        categoriesCreated: createdCategories.size,
        productsCreated: createdProducts.length,
        products: createdProducts
      }
    })

    logger.info('Product initialization completed successfully', {
      categoriesCreated: result.categoriesCreated,
      productsCreated: result.productsCreated
    })

    return NextResponse.json({
      success: true,
      message: 'Products initialized successfully',
      data: {
        categoriesCreated: result.categoriesCreated,
        productsCreated: result.productsCreated,
        products: result.products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category.name,
          skus: p.skus.map(sku => ({
            id: sku.id,
            sku: sku.sku,
            stock: sku.stock,
            reservedStock: sku.reservedStock,
            price: sku.price
          }))
        }))
      }
    })

  } catch (error) {
    logger.error('Failed to initialize products', {}, 
      error instanceof Error ? error : new Error(String(error)))
    
    return createServerErrorResponse('Failed to initialize products')
  }
}

// GET method to check current database state
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization  
    if (!validateAdminApiKey(request)) {
      return createAuthErrorResponse('Admin access required')
    }

    const [categories, products, skus] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.productSku.count()
    ])

    const sampleProducts = await prisma.product.findMany({
      take: 5,
      include: {
        category: { select: { name: true } },
        skus: { 
          select: { 
            id: true, 
            sku: true, 
            stock: true, 
            reservedStock: true,
            isActive: true
          } 
        }
      }
    })

    return NextResponse.json({
      success: true,
      currentState: {
        categoriesCount: categories,
        productsCount: products,
        skusCount: skus
      },
      sampleProducts: sampleProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category?.name,
        skus: p.skus
      }))
    })

  } catch (error) {
    logger.error('Failed to check database state', {}, 
      error instanceof Error ? error : new Error(String(error)))
    
    return createServerErrorResponse('Failed to check database state')
  }
}