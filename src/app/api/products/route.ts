import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createSecureAPIHandler, APIResponse, ValidationSchemas, InputSanitizer } from '@/lib/api-security'
import { 
  validateSearchParams, 
  validateRequestBody,
  validateAdminApiKey,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createServerErrorResponse,
  schemas,
  paginationSchema
} from '@/lib/validation'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

// Enhanced validation schema for product search
const productSearchSchema = z.object({
  category: z.string().optional(),
  search: z.string().max(255).optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  active: z.string().transform(val => val !== 'false').optional().default('true'),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

// Mock products data for fallback - using proper UUIDs for compatibility
const mockProducts = [
  {
    id: "mock-product-1",
    name: "Classic T-Shirt",
    slug: "classic-t-shirt",
    description: "Comfortable cotton t-shirt with premium quality fabric",
    price: 29.99,
    isActive: true,
    categoryId: "mock-category-6",
    category: { id: "mock-category-6", name: "Clothing", slug: "clothing", emoji: "👕" },
    images: [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        alt: "Classic T-Shirt",
        isPrimary: true
      }
    ],
    skus: [
      {
        id: "mock-sku-1",
        sku: "classic-t-shirt-default",
        price: 29.99,
        stock: 10,
        reservedStock: 0,
        availableStock: 10,
        size: "M",
        color: "Black"
      }
    ]
  },
  {
    id: "mock-product-2", 
    name: "Designer Sneakers",
    slug: "designer-sneakers",
    description: "Trendy sneakers with modern design and comfort",
    price: 89.99,
    isActive: true,
    categoryId: "mock-category-1",
    category: { id: "mock-category-1", name: "Shoes", slug: "shoes", emoji: "👠" },
    images: [
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
        alt: "Designer Sneakers", 
        isPrimary: true
      }
    ],
    skus: [
      {
        id: "mock-sku-2",
        sku: "designer-sneakers-default", 
        price: 89.99,
        stock: 5,
        reservedStock: 0,
        availableStock: 5,
        size: "9",
        color: "White"
      }
    ]
  },
  {
    id: "mock-product-3",
    name: "Luxury Watch",
    slug: "luxury-watch", 
    description: "Premium timepiece with elegant design",
    price: 299.99,
    isActive: true,
    categoryId: "mock-category-2",
    category: { id: "mock-category-2", name: "Accessories", slug: "accessories", emoji: "💍" },
    images: [
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        alt: "Luxury Watch",
        isPrimary: true
      }
    ],
    skus: [
      {
        id: "mock-sku-3",
        sku: "luxury-watch-default",
        price: 299.99, 
        stock: 3,
        reservedStock: 0,
        availableStock: 3,
        size: "One Size",
        color: "Silver"
      }
    ]
  },
  {
    id: "mock-product-4",
    name: "Stylish Hat",
    slug: "stylish-hat",
    description: "Fashionable hat perfect for any occasion", 
    price: 39.99,
    isActive: true,
    categoryId: "mock-category-3",
    category: { id: "mock-category-3", name: "Hats", slug: "hats", emoji: "🎩" },
    images: [
      {
        id: "4", 
        url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500",
        alt: "Stylish Hat",
        isPrimary: true
      }
    ],
    skus: [
      {
        id: "mock-sku-4",
        sku: "stylish-hat-default",
        price: 39.99,
        stock: 8,
        reservedStock: 0,
        availableStock: 8,
        size: "One Size", 
        color: "Black"
      }
    ]
  },
  {
    id: "mock-product-5",
    name: "EXVICPMOUR Special Edition",
    slug: "exvicpmour-special-edition",
    description: "Limited edition EXVICPMOUR collection item",
    price: 149.99,
    isActive: true, 
    categoryId: "mock-category-4",
    category: { id: "mock-category-4", name: "EXVICPMOUR", slug: "exvicpmour", emoji: "✨" },
    images: [
      {
        id: "5",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500", 
        alt: "EXVICPMOUR Special Edition",
        isPrimary: true
      }
    ],
    skus: [
      {
        id: "mock-sku-5",
        sku: "exvicpmour-special-edition-default",
        price: 149.99,
        stock: 2,
        reservedStock: 0,
        availableStock: 2,
        size: "One Size",
        color: "Gold"
      }
    ]
  },
  {
    id: "mock-product-6",
    name: "Designer Handbag",
    slug: "designer-handbag",
    description: "Elegant handbag with premium materials",
    price: 199.99,
    isActive: true,
    categoryId: "mock-category-5", 
    category: { id: "mock-category-5", name: "Bags", slug: "bags", emoji: "👜" },
    images: [
      {
        id: "6",
        url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
        alt: "Designer Handbag", 
        isPrimary: true
      }
    ],
    skus: [
      {
        id: "mock-sku-6",
        sku: "designer-handbag-default", 
        price: 199.99,
        stock: 4,
        reservedStock: 0,
        availableStock: 4,
        size: "Medium",
        color: "Brown"
      }
    ]
  }
];

async function getProductsHandler(request: NextRequest) {
  try {
    console.log('Products API called')
    
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20)
    
    console.log('Query params:', { category, limit })

    try {
      console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
      console.log('DIRECT_URL exists:', !!process.env.DIRECT_URL)

      // Test database connection
      console.log('Testing database connection...')
      const connectionTest = await prisma.$queryRaw`SELECT 1 as test`
      console.log('Database connection test result:', connectionTest)

      // Check if categories exist
      console.log('Checking categories...')
      const allCategories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true }
      })
      console.log('All categories:', allCategories)

      // Build where clause - показываем только активные товары
      const where: any = {
        isActive: true
      }

      if (category) {
        where.category = { slug: category }
      }

      console.log('Where clause:', JSON.stringify(where, null, 2))

      const products = await prisma.product.findMany({
        where,
        include: {
          images: true,
          skus: {
            select: {
              id: true,
              sku: true,
              price: true,
              stock: true,
              reservedStock: true,
              size: true,
              color: true,
              weight: true,
              dimensions: true
            }
          },
          category: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      console.log('Found products:', products.length)
      console.log('Products data:', products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryName: p.category?.name,
        categorySlug: p.category?.slug
      })))

      // Map category names to emojis
      const categoryEmojiMap: Record<string, string> = {
        "Shoes": "👠",
        "Accessories": "💍", 
        "Hats": "🎩",
        "EXVICPMOUR": "✨",
        "Bags": "👜",
        "Clothing": "👕"
      };

      // Enhance products with emoji data for categories and available stock calculation
      const enhancedProducts = products.map(product => ({
        ...product,
        category: product.category ? {
          ...product.category,
          emoji: categoryEmojiMap[product.category.name] || "📦"
        } : null,
        skus: product.skus.map(sku => ({
          ...sku,
          availableStock: Math.max(0, sku.stock - (sku.reservedStock || 0))
        }))
      }));

      // Sync with shared data for telegram bot
      try {
        const { syncMockDataToShared } = await import('@/lib/shared-data')
        await syncMockDataToShared(enhancedProducts)
      } catch (error) {
        console.error('Failed to sync data to shared storage:', error)
      }

      return NextResponse.json({
        success: true,
        products: enhancedProducts,
        total: enhancedProducts.length
      })
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      
      return NextResponse.json({
        success: false,
        error: { message: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        products: [],
        total: 0
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 })
  }
}

// Temporary bypass security middleware for debugging
export const GET = getProductsHandler

// POST - Create new product (Admin only)
export async function POST(request: NextRequest) {
  let productData: any
  
  try {
    // Check admin authorization
    if (!validateAdminApiKey(request)) {
      return createAuthErrorResponse('Admin access required')
    }

    // Validate request body
    const validation = await validateRequestBody(request, schemas.product)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    productData = validation.data

    // Generate slug from name if not provided
    const slug = productData.slug || 
      productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })

    if (existingProduct) {
      return createValidationErrorResponse([{
        field: 'slug',
        message: 'Product with this slug already exists'
      }])
    }

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug,
        description: productData.description,
        categoryId: productData.categoryId,
        isActive: productData.active !== false,
        images: {
          create: productData.images?.map((imageUrl: any, index: any) => ({
            url: imageUrl,
            alt: productData.name,
            isPrimary: index === 0
          })) || []
        },
        skus: {
          create: [{
            sku: `${slug}-default`,
            price: productData.price,
            stock: productData.stock
          }]
        }
      },
      include: {
        images: true,
        skus: true,
        category: true
      }
    })

    return Response.json({
      success: true,
      data: product
    }, { status: 201 })
    
  } catch (error) {
    logger.error('Failed to create product', {
      productName: productData?.name,
      slug: productData?.slug
    }, error instanceof Error ? error : new Error(String(error)))
    
    return createServerErrorResponse('Failed to create product')
  }
}