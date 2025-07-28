import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug') || '111-1749749482689'
    
    console.log('Testing product fetch for slug:', slug)
    
    // Try to find the product
    const product = await prisma.product.findFirst({
      where: { slug },
      include: {
        category: true,
        skus: true,
        images: true
      }
    })
    
    if (!product) {
      // Try to find any product
      const anyProduct = await prisma.product.findFirst({
        include: {
          category: true,
          skus: true
        }
      })
      
      return NextResponse.json({
        error: 'Product not found',
        slug,
        anyProductExists: !!anyProduct,
        sampleProduct: anyProduct ? {
          id: anyProduct.id,
          name: anyProduct.name,
          slug: anyProduct.slug,
          isActive: anyProduct.isActive,
          category: {
            name: anyProduct.category.name,
            isActive: anyProduct.category.isActive
          }
        } : null
      })
    }
    
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        isActive: product.isActive,
        category: {
          id: product.category.id,
          name: product.category.name,
          isActive: product.category.isActive
        },
        skus: product.skus.map(sku => ({
          id: sku.id,
          price: sku.price.toString(),
          stock: sku.stock,
          isActive: sku.isActive
        })),
        images: product.images.map(img => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary
        }))
      }
    })
  } catch (error) {
    console.error('Test product error:', error)
    return NextResponse.json({
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}