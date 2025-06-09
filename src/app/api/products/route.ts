import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (category) {
      where.category = {
        slug: category
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } }
      ]
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
        take: limit,
        skip: offset
      }),
      prisma.product.count({ where })
    ])

    const hasMore = offset + limit < total

    return NextResponse.json({
      products,
      hasMore,
      pagination: {
        total,
        limit,
        offset,
        hasMore
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// Database-dependent endpoint - commented out until database is configured
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     const { name, description, brand, categoryId, images, skus } = body

//     const product = await prisma.product.create({
//       data: {
//         name,
//         slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
//         description,
//         brand,
//         categoryId,
//         images: {
//           create: images?.map((img: any, index: number) => ({
//             url: img.url,
//             alt: img.alt || name,
//             isPrimary: index === 0
//           })) || []
//         },
//         skus: {
//           create: skus?.map((sku: any) => ({
//             sku: sku.sku,
//             size: sku.size,
//             color: sku.color,
//             price: sku.price,
//             stock: sku.stock || 0
//           })) || []
//         }
//       },
//       include: {
//         images: true,
//         skus: true,
//         category: true
//       }
//     })

//     return NextResponse.json(product, { status: 201 })
//   } catch (error) {
//     console.error('Error creating product:', error)
//     return NextResponse.json(
//       { error: 'Failed to create product' },
//       { status: 500 }
//     )
//   }
// }