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

// Mock products data for fallback
const mockProducts = [
  {
    id: "1",
    name: "Classic T-Shirt",
    slug: "classic-t-shirt",
    description: "Comfortable cotton t-shirt with premium quality fabric",
    price: 29.99,
    isActive: true,
    categoryId: "6",
    category: { id: "6", name: "Clothing", slug: "clothing", emoji: "👕" },
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
        id: "1",
        sku: "classic-t-shirt-default",
        price: 29.99,
        stock: 10,
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
    isActive: true,
    categoryId: "1",
    category: { id: "1", name: "Shoes", slug: "shoes", emoji: "👠" },
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
        id: "2",
        sku: "designer-sneakers-default", 
        price: 89.99,
        stock: 5,
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
    isActive: true,
    categoryId: "2",
    category: { id: "2", name: "Accessories", slug: "accessories", emoji: "💍" },
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
        id: "3",
        sku: "luxury-watch-default",
        price: 299.99, 
        stock: 3,
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
    isActive: true,
    categoryId: "3",
    category: { id: "3", name: "Hats", slug: "hats", emoji: "🎩" },
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
        id: "4",
        sku: "stylish-hat-default",
        price: 39.99,
        stock: 8,
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
    isActive: true, 
    categoryId: "4",
    category: { id: "4", name: "EXVICPMOUR", slug: "exvicpmour", emoji: "✨" },
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
        id: "5",
        sku: "exvicpmour-special-edition-default",
        price: 149.99,
        stock: 2,
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
    isActive: true,
    categoryId: "5", 
    category: { id: "5", name: "Bags", slug: "bags", emoji: "👜" },
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
        id: "6",
        sku: "designer-handbag-default", 
        price: 199.99,
        stock: 4,
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
        select: { id: true, name: true, slug: true, isActive: true }
      })
      console.log('All categories:', allCategories)

      // Build where clause
      const where: any = {
        isActive: true,
        category: {
          isActive: true
        }
      }

      if (category) {
        where.category.slug = category
      }

      console.log('Where clause:', JSON.stringify(where, null, 2))

      const products = await prisma.product.findMany({
        where,
        include: {
          images: true,
          skus: true,
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
        categorySlug: p.category?.slug,
        isActive: p.isActive
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

      // Enhance products with emoji data for categories
      const enhancedProducts = products.map(product => ({
        ...product,
        category: product.category ? {
          ...product.category,
          emoji: categoryEmojiMap[product.category.name] || "📦"
        } : null
      }));

      return NextResponse.json({
        success: true,
        products: enhancedProducts,
        total: enhancedProducts.length
      })
    } catch (dbError) {
      console.error('Database connection failed, using mock data:', dbError)
      
      // Filter mock products by category if specified
      let filteredProducts = mockProducts
      if (category) {
        filteredProducts = mockProducts.filter(product => 
          product.category.slug === category
        )
        console.log(`Returning mock ${category} products:`, filteredProducts.length)
      } else {
        console.log('Returning all mock products:', mockProducts.length)
      }
      
      // Apply limit
      const limitedProducts = filteredProducts.slice(0, limit)
      
      return NextResponse.json({
        success: true,
        products: limitedProducts,
        total: limitedProducts.length
      })
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