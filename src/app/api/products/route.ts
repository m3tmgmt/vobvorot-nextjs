import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredProducts = mockProducts;

    if (category) {
      filteredProducts = mockProducts.filter(p => p.category.slug === category);
    }

    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    const products = filteredProducts.slice(offset, offset + limit);
    const total = filteredProducts.length;

    return NextResponse.json({
      products,
      hasMore: offset + limit < total,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
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