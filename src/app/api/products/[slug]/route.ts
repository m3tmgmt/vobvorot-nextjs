import { NextRequest, NextResponse } from 'next/server'
import { sharedProducts } from '@/lib/shared-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = sharedProducts.find(p => p.slug === slug)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Преобразуем в формат, ожидаемый фронтендом
    const formattedProduct = {
      ...product,
      skus: [
        {
          id: product.id,
          price: product.price,
          stock: product.stock,
          size: product.sizes?.[0],
          color: product.colors?.[0]
        }
      ]
    }

    return NextResponse.json(formattedProduct)
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