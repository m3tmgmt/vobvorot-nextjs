import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateProductSEO, generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo'
import ProductPageClient from './ProductPageClient'
import { prisma } from '@/lib/prisma'
import { cleanupExpiredReservations } from '@/lib/inventory-management'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  images: { url: string; alt?: string; isPrimary: boolean }[]
  skus: { id: string; price: number; stock: number; reservedStock: number; size?: string; color?: string }[]
  category: { name: string; slug: string }
  video?: {
    url: string
    thumbnail?: string
    title?: string
  }
}

// Fetch product data for metadata generation
async function getProduct(slug: string): Promise<Product | null> {
  try {
    console.log(`Fetching product with slug: ${slug}`)
    
    // Clean up expired reservations to show accurate available stock
    await cleanupExpiredReservations()
    
    const product = await prisma.product.findFirst({
      where: { 
        slug,
        isActive: true,
        category: {
          isActive: true
        }
      },
      include: {
        images: true,
        skus: true,
        category: true
      }
    })
    
    if (!product) {
      console.log(`Product not found or inactive: ${slug}`)
      return null
    }
    
    console.log('Product fetched successfully:', product.id, product.name)
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || undefined,
      brand: product.brand || undefined,
      images: product.images.map(img => ({
        url: img.url,
        alt: img.alt || undefined,
        isPrimary: img.isPrimary
      })),
      skus: product.skus.map(sku => ({
        id: sku.id,
        price: Number(sku.price),
        stock: sku.stock,
        reservedStock: sku.reservedStock,
        size: sku.size || undefined,
        color: sku.color || undefined
      })),
      category: {
        name: product.category.name,
        slug: product.category.slug
      },
      video: product.videoUrl ? {
        url: product.videoUrl,
        thumbnail: undefined,
        title: undefined
      } : undefined
    }
  } catch (error) {
    console.error('Error fetching product for metadata:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) {
    return {
      title: 'Product Not Found | VobVorot Store',
      description: 'The requested product could not be found.',
      robots: { index: false, follow: false }
    }
  }

  // Generate SEO configuration using existing utility
  const seoConfig = generateProductSEO({
    name: product.name,
    description: product.description,
    price: product.skus[0]?.price,
    currency: 'USD',
    images: product.images,
    category: product.category.name,
    brand: product.brand,
    isActive: product.skus.some(sku => sku.stock > 0),
    slug: product.slug
  })

  // Generate structured data
  const structuredData = generateProductStructuredData({
    name: product.name,
    description: product.description,
    price: product.skus[0]?.price,
    currency: 'USD',
    images: product.images,
    brand: product.brand,
    category: product.category.name,
    isActive: product.skus.some(sku => sku.stock > 0),
    sku: product.skus[0]?.id
  })

  const baseUrl = process.env.NEXTAUTH_URL || 'https://vobvorot.com'
  const productUrl = `${baseUrl}/products/${product.slug}`
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
  const imageUrl = primaryImage ? `${baseUrl}${primaryImage.url}` : `${baseUrl}/images/og-default.jpg`

  return {
    title: product.name,
    description: seoConfig.description,
    keywords: seoConfig.keywords,
    
    // Canonical URL
    alternates: {
      canonical: productUrl,
    },
    
    // Open Graph
    openGraph: {
      type: 'website',
      url: productUrl,
      title: product.name,
      description: seoConfig.description,
      siteName: 'VobVorot Store',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ],
      locale: 'en_US',
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      site: '@vobvorot',
      creator: '@vobvorot',
      title: product.name,
      description: seoConfig.description,
      images: [imageUrl],
    },
    
    // Product-specific meta
    other: {
      'product:price:amount': product.skus[0]?.price?.toString() || '0',
      'product:price:currency': 'USD',
      'product:availability': product.skus.some(sku => sku.stock > 0) ? 'in stock' : 'out of stock',
      'product:brand': product.brand || 'VobVorot',
      'product:category': product.category.name,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) {
    notFound()
  }

  // Generate structured data for the page
  const productStructuredData = generateProductStructuredData({
    name: product.name,
    description: product.description,
    price: product.skus[0]?.price,
    currency: 'USD',
    images: product.images,
    brand: product.brand,
    category: product.category.name,
    isActive: product.skus.some(sku => (sku.stock - sku.reservedStock) > 0),
    sku: product.skus[0]?.id,
    condition: 'new' // Assuming new condition for fashion items
  })

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category.name, url: `/categories/${product.category.slug}` },
    { name: product.name, url: `/products/${product.slug}` }
  ])

  const allStructuredData = [productStructuredData, breadcrumbData]

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(allStructuredData)
        }}
      />
      
      {/* Client Component for Interactive Features */}
      <ProductPageClient product={product} />
    </>
  )
}