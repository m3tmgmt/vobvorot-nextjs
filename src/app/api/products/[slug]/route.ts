import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const product = await prisma.product.findFirst({
      where: { 
        slug,
        isActive: true 
      },
      include: {
        images: true,
        skus: {
          where: { isActive: true }
        },
        category: true
      }
    })
    
    // Check if category is active
    if (product && !product.category.isActive) {
      console.log(`Product ${slug} found but category ${product.category.name} is inactive`)
      return NextResponse.json(
        { error: 'Product category is not active' },
        { status: 404 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // ✅ CRITICAL: Calculate availableStock for each SKU (same as in /products API)
    const enhancedProduct = {
      ...product,
      skus: product.skus.map(sku => {
        const availableStock = Math.max(0, sku.stock - (sku.reservedStock || 0))
        
        // Debug logging for stock calculations
        if (sku.reservedStock > 0 || sku.stock <= 10) {
          console.log('📊 Product slug API stock calculation:', {
            productName: product.name,
            slug: product.slug,
            skuId: sku.id,
            size: sku.size,
            stock: sku.stock,
            reservedStock: sku.reservedStock,
            calculatedAvailable: availableStock,
            timestamp: new Date().toISOString()
          })
        }
        
        return {
          ...sku,
          availableStock: availableStock,
          totalStock: sku.stock,
          reservedStock: sku.reservedStock || 0
        }
      })
    }

    return NextResponse.json(enhancedProduct, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// Database-dependent endpoints - commented out until database is configured
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ slug: string }> }
// ) {
//   try {
//     const { slug } = await params
//     const body = await request.json()
//     const { name, description, brand, categoryId } = body

//     const product = await prisma.product.update({
//       where: { slug },
//       data: {
//         name,
//         slug: name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined,
//         description,
//         brand,
//         categoryId
//       },
//       include: {
//         images: true,
//         skus: true,
//         category: true
//       }
//     })

//     return NextResponse.json(product)
//   } catch (error) {
//     console.error('Error updating product:', error)
//     return NextResponse.json(
//       { error: 'Failed to update product' },
//       { status: 500 }
//     )
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ slug: string }> }
// ) {
//   try {
//     const { slug } = await params
//     await prisma.product.delete({
//       where: { slug }
//     })

//     return NextResponse.json({ message: 'Product deleted successfully' })
//   } catch (error) {
//     console.error('Error deleting product:', error)
//     return NextResponse.json(
//       { error: 'Failed to delete product' },
//       { status: 500 }
//     )
//   }
// }