import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // Commented out until database is configured

const mockProducts = [
  {
    id: "1",
    name: "Vintage Leather Heels",
    slug: "vintage-leather-heels",
    description: "Authentic 90s leather heels with metallic details",
    brand: "Retro Collection",
    images: [
      { url: "/assets/images/vintage-leather-heels.jpg", alt: "Vintage Leather Heels", isPrimary: true }
    ],
    skus: [
      { id: "1", price: 89.99, stock: 3, size: "38", color: "black" }
    ],
    category: { name: "Shoes", slug: "shoes" },
    averageRating: 4.5
  },
  {
    id: "2", 
    name: "Handmade Textile Bag",
    slug: "handmade-textile-bag",
    description: "Unique handmade bag with Y2K aesthetic",
    brand: "vobvorot",
    images: [
      { url: "/assets/images/handmade-textile-bag.jpg", alt: "Handmade Textile Bag", isPrimary: true }
    ],
    skus: [
      { id: "2", price: 45.00, stock: 5, color: "multicolor" }
    ],
    category: { name: "Accessories", slug: "accessories" },
    averageRating: 4.8
  },
  {
    id: "3",
    name: "Ukrainian Fur Hat",
    slug: "ukrainian-fur-hat", 
    description: "Traditional Ukrainian fur hat, perfect for winter",
    brand: "Heritage",
    images: [
      { url: "/assets/images/product1.jpg", alt: "Ukrainian Fur Hat", isPrimary: true }
    ],
    skus: [
      { id: "3", price: 75.00, stock: 2, size: "L", color: "brown" }
    ],
    category: { name: "Hats", slug: "hats" },
    averageRating: 4.2
  },
  {
    id: "4",
    name: "EXVICPMOUR Custom Adidas",
    slug: "exvicpmour-custom-adidas",
    description: "Limited edition custom Adidas with Ukrainian design elements",
    brand: "EXVICPMOUR",
    images: [
      { url: "/assets/images/product2.jpg", alt: "EXVICPMOUR Custom Adidas", isPrimary: true }
    ],
    skus: [
      { id: "4", price: 299.99, stock: 1, size: "42", color: "black/gold" }
    ],
    category: { name: "EXVICPMOUR", slug: "exvicpmour" },
    averageRating: 5.0
  },
  {
    id: "5",
    name: "EXVICPMOUR Vintage Camera",
    slug: "exvicpmour-vintage-camera",
    description: "Restored 35mm film camera with custom EXVICPMOUR branding",
    brand: "EXVICPMOUR",
    images: [
      { url: "/assets/images/product1.jpg", alt: "EXVICPMOUR Vintage Camera", isPrimary: true }
    ],
    skus: [
      { id: "5", price: 450.00, stock: 1, color: "silver" }
    ],
    category: { name: "EXVICPMOUR", slug: "exvicpmour" },
    averageRating: 4.7
  },
  {
    id: "6",
    name: "EXVICPMOUR Designer Bag",
    slug: "exvicpmour-designer-bag",
    description: "Exclusive handcrafted bag with Y2K aesthetic and Ukrainian patterns",
    brand: "EXVICPMOUR",
    images: [
      { url: "/assets/images/handmade-textile-bag.jpg", alt: "EXVICPMOUR Designer Bag", isPrimary: true }
    ],
    skus: [
      { id: "6", price: 180.00, stock: 2, color: "black/silver" }
    ],
    category: { name: "EXVICPMOUR", slug: "exvicpmour" },
    averageRating: 4.6
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = mockProducts.find(p => p.slug === slug)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
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