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

async function getProductsHandler(request: NextRequest) {
  let params: any
  let sanitizedSearch: string | undefined
  let sanitizedCategory: string | undefined
  
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse query parameters manually for now
    params = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') === 'true',
      active: searchParams.get('active') !== 'false',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      page: Math.max(1, Number(searchParams.get('page')) || 1),
      limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20)),
      sort: searchParams.get('sort') || undefined,
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc'
    }

    // Sanitize search input
    sanitizedSearch = params.search ? InputSanitizer.sanitizeString(params.search) : undefined
    sanitizedCategory = params.category ? InputSanitizer.sanitizeString(params.category) : undefined

    // Build where clause with enhanced filtering
    const where: any = {
      isActive: params.active
    }

    if (sanitizedCategory) {
      where.category = {
        slug: sanitizedCategory
      }
    }

    if (sanitizedSearch) {
      where.OR = [
        { name: { contains: sanitizedSearch, mode: 'insensitive' } },
        { description: { contains: sanitizedSearch, mode: 'insensitive' } },
        { brand: { contains: sanitizedSearch, mode: 'insensitive' } }
      ]
    }


    // Price filtering
    if (params.minPrice || params.maxPrice) {
      where.skus = {
        some: {
          ...(params.minPrice && { price: { gte: params.minPrice } }),
          ...(params.maxPrice && { price: { lte: params.maxPrice } })
        }
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          skus: true,
          category: true
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: (params.page - 1) * params.limit
      }),
      prisma.product.count({ where })
    ])

    const hasMore = params.page * params.limit < total
    const totalPages = Math.ceil(total / params.limit)

    return APIResponse.success({
      products,
      pagination: {
        total,
        limit: params.limit,
        page: params.page,
        totalPages,
        hasMore,
        hasPrevious: params.page > 1
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return APIResponse.validationError(error)
    }
    
    logger.error('Failed to fetch products', {
      search: sanitizedSearch,
      category: sanitizedCategory,
      page: params.page,
      limit: params.limit
    }, error instanceof Error ? error : new Error(String(error)))
    
    return APIResponse.error('Failed to fetch products', 500)
  }
}

// Apply security middleware to GET handler
export const GET = createSecureAPIHandler(getProductsHandler, {
  rateLimit: { requests: 100, window: 60 * 1000 } // 100 requests per minute
})

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