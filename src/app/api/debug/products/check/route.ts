import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
    }
    
    // Find product by slug
    const product = await prisma.product.findFirst({
      where: { slug },
      include: {
        images: true,
        skus: true,
        category: true
      }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found', slug }, { status: 404 })
    }
    
    // Also check if any products are visible
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: { name: true, isActive: true }
        },
        skus: {
          where: { isActive: true }
        }
      },
      take: 5
    })
    
    return NextResponse.json({
      foundProduct: product,
      activeProductsCount: allProducts.length,
      sampleActiveProducts: allProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryActive: p.category.isActive,
        skuCount: p.skus.length
      }))
    })
  } catch (error) {
    console.error('Debug check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}