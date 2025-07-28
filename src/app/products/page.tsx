import { Metadata } from 'next'
import { generateSEOConfig, generateWebsiteStructuredData } from '@/lib/seo'
import ProductsPageClient from './ProductsPageClient'

export const metadata: Metadata = {
  title: 'All Products - Y2K Fashion Collection',
  description: 'Shop our complete collection of Y2K fashion, vintage clothing, and retro accessories at VobVorot Store. Unique pieces with free worldwide shipping.',
  keywords: [
    'Y2K fashion collection',
    'vintage clothing store',
    'retro fashion online',
    'alternative fashion',
    'cyber fashion',
    'nostalgic clothing',
    'unique fashion pieces',
    'Ukrainian design',
    'streetwear collection',
    'gothic fashion',
    'punk clothing',
    'millennium fashion'
  ],
  
  // Open Graph
  openGraph: {
    type: 'website',
    url: 'https://vobvorot.com/products',
    title: 'All Products - Y2K Fashion Collection | VobVorot Store',
    description: 'Shop our complete collection of Y2K fashion, vintage clothing, and retro accessories. Unique pieces with free worldwide shipping.',
    siteName: 'VobVorot Store',
    images: [
      {
        url: '/images/og-products.jpg',
        width: 1200,
        height: 630,
        alt: 'VobVorot Store - Y2K Fashion Collection',
      }
    ],
    locale: 'en_US',
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: '@vobvorot',
    creator: '@vobvorot',
    title: 'All Products - Y2K Fashion Collection | VobVorot Store',
    description: 'Shop our complete collection of Y2K fashion, vintage clothing, and retro accessories.',
    images: ['/images/og-products.jpg'],
  },
  
  // Canonical URL
  alternates: {
    canonical: 'https://vobvorot.com/products',
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

export default function ProductsPage() {
  // Generate structured data for the page
  const websiteData = generateWebsiteStructuredData()

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData)
        }}
      />
      
      {/* Client Component */}
      <ProductsPageClient />
    </>
  )
}