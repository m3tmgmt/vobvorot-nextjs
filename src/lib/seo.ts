// SEO utility functions and configurations for VobVorot store

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  price?: string
  currency?: string
  availability?: 'in stock' | 'out of stock' | 'preorder'
  brand?: string
  category?: string
}

export const defaultSEO: SEOConfig = {
  title: 'VobVorot - Vintage & Custom Fashion Store',
  description: 'Discover unique vintage pieces and custom designs from Ukraine. VobVorot offers authentic vintage cameras, handmade accessories, custom Adidas, and exclusive fashion with worldwide shipping.',
  keywords: [
    'vintage fashion',
    'custom designs',
    'Ukrainian fashion',
    'vintage cameras',
    'handmade accessories',
    'custom adidas',
    'authentic vintage',
    'luxury vintage',
    'designer vintage',
    'sustainable fashion',
    'unique pieces',
    'collector items',
    'artisan crafted',
    'vintage style',
    'retro fashion',
    'exclusive clothing'
  ],
  image: '/images/og-default.jpg',
  type: 'website'
}

export function generateSEOConfig(config: Partial<SEOConfig> = {}): SEOConfig {
  return {
    ...defaultSEO,
    ...config,
    title: config.title ? `${config.title} | VobVorot` : defaultSEO.title,
    keywords: config.keywords ? [...(defaultSEO.keywords || []), ...(config.keywords || [])] : defaultSEO.keywords
  }
}

export function generateProductSEO(product: {
  name: string
  description?: string
  price?: number
  currency?: string
  images?: { url: string; alt?: string }[]
  category?: string
  brand?: string
  isActive?: boolean
  slug?: string
}): SEOConfig {
  const price = product.price ? product.price.toString() : undefined
  const currency = product.currency || 'USD'
  const availability = product.isActive ? 'in stock' : 'out of stock'
  
  return generateSEOConfig({
    title: product.name,
    description: product.description || `${product.name} - Premium Y2K fashion piece from VobVorot Store. ${defaultSEO.description}`,
    image: product.images?.[0]?.url || defaultSEO.image,
    type: 'product',
    price,
    currency,
    availability,
    brand: product.brand || 'VobVorot',
    category: product.category,
    url: product.slug ? `/products/${product.slug}` : undefined,
    keywords: [
      product.name.toLowerCase(),
      product.category?.toLowerCase(),
      product.brand?.toLowerCase(),
      'buy online',
      'fashion store'
    ].filter(Boolean) as string[]
  })
}

export function generateCategorySEO(category: {
  name: string
  description?: string
  slug?: string
}): SEOConfig {
  return generateSEOConfig({
    title: `${category.name} Collection`,
    description: category.description || `Shop ${category.name} at VobVorot Store. ${defaultSEO.description}`,
    url: category.slug ? `/categories/${category.slug}` : undefined,
    keywords: [
      category.name.toLowerCase(),
      'collection',
      'shop',
      'buy online'
    ]
  })
}

export function generateBlogSEO(article: {
  title: string
  excerpt?: string
  slug?: string
  publishedAt?: string
  author?: string
  tags?: string[]
  image?: string
}): SEOConfig {
  return generateSEOConfig({
    title: article.title,
    description: article.excerpt || `${article.title} - Read the latest from VobVorot Store blog.`,
    image: article.image || defaultSEO.image,
    type: 'article',
    url: article.slug ? `/blog/${article.slug}` : undefined,
    keywords: article.tags || []
  })
}

// Structured data generators
/**
 * Generate comprehensive structured data for a product according to Schema.org standards
 * Improves SEO and enables rich snippets in search results
 * 
 * @param product - Product information for structured data generation
 * @returns JSON-LD structured data object
 */
export function generateProductStructuredData(product: {
  name: string
  description?: string
  price?: number
  currency?: string
  images?: { url: string; alt?: string }[]
  brand?: string
  category?: string
  isActive?: boolean
  sku?: string
  rating?: number
  reviewCount?: number
  condition?: 'new' | 'used' | 'refurbished'
  mpn?: string // Manufacturer Part Number
  gtin?: string // Global Trade Item Number
  weight?: string
  dimensions?: { length?: string; width?: string; height?: string }
  slug?: string
  createdAt?: Date
  updatedAt?: Date
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map(img => img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`) || [],
    brand: {
      '@type': 'Brand',
      name: product.brand || 'VobVorot'
    },
    category: product.category,
    sku: product.sku,
    productID: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price?.toString(),
      priceCurrency: product.currency || 'USD',
      availability: product.isActive 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      itemCondition: `https://schema.org/${product.condition === 'new' ? 'NewCondition' : product.condition === 'used' ? 'UsedCondition' : 'RefurbishedCondition'}`,
      seller: {
        '@type': 'Organization',
        name: 'VobVorot Store',
        url: baseUrl
      },
      url: `${baseUrl}/products/${product.slug || product.sku}`,
      validFrom: new Date().toISOString(),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 1 year
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'USD'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: ['US', 'CA', 'GB', 'AU', 'UA']
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          },
          cutoffTime: '14:00',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 7,
            maxValue: 14,
            unitCode: 'DAY'
          }
        }
      }
    }
  }

  // Add optional fields if available
  if (product.mpn) structuredData.mpn = product.mpn
  if (product.gtin) structuredData.gtin = product.gtin
  if (product.weight) structuredData.weight = { '@type': 'QuantitativeValue', value: product.weight }
  
  if (product.dimensions) {
    structuredData.depth = product.dimensions.length ? { '@type': 'QuantitativeValue', value: product.dimensions.length } : undefined
    structuredData.width = product.dimensions.width ? { '@type': 'QuantitativeValue', value: product.dimensions.width } : undefined
    structuredData.height = product.dimensions.height ? { '@type': 'QuantitativeValue', value: product.dimensions.height } : undefined
  }

  if (product.rating && product.reviewCount) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1
    }
  }

  // Add timestamps for freshness signals
  if (product.createdAt) {
    structuredData.dateCreated = product.createdAt.toISOString()
  }
  if (product.updatedAt) {
    structuredData.dateModified = product.updatedAt.toISOString()
  }

  return structuredData
}

/**
 * Generate FAQ structured data for better search visibility
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Generate review structured data for products
 */
export function generateReviewStructuredData(reviews: Array<{
  author: string
  rating: number
  comment: string
  createdAt: Date
}>) {
  return reviews.map(review => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    reviewBody: review.comment,
    datePublished: review.createdAt.toISOString()
  }))
}

/**
 * Generate collection/category structured data
 */
export function generateCollectionStructuredData(collection: {
  name: string
  description?: string
  image?: string
  products: Array<{ name: string; url: string; image?: string }>
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    image: collection.image,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: collection.products.length,
      itemListElement: collection.products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: product.url.startsWith('http') ? product.url : `${baseUrl}${product.url}`,
        name: product.name,
        image: product.image
      }))
    }
  }
}

export function generateBreadcrumbStructuredData(breadcrumbs: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
    }))
  }
}

export function generateOrganizationStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VobVorot Store',
    description: defaultSEO.description,
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    sameAs: [
      'https://instagram.com/vobvorot',
      'https://tiktok.com/@vobvorot',
      'https://twitter.com/vobvorot'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'hello@vobvorot.com'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'UA'
    }
  }
}

export function generateWebsiteStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'VobVorot Store',
    description: defaultSEO.description,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }
}

// URL and canonical utilities
export function getCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function generateAlternateLanguages(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  return [
    { hrefLang: 'en', href: `${baseUrl}${path}` },
    { hrefLang: 'uk', href: `${baseUrl}/uk${path}` },
    { hrefLang: 'x-default', href: `${baseUrl}${path}` }
  ]
}

// Social media meta tags
export function generateSocialMeta(config: SEOConfig) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
  const fullImageUrl = config.image?.startsWith('http') 
    ? config.image 
    : `${baseUrl}${config.image || defaultSEO.image}`
  
  return {
    // Open Graph
    'og:title': config.title,
    'og:description': config.description,
    'og:image': fullImageUrl,
    'og:image:alt': config.title,
    'og:type': config.type || 'website',
    'og:url': config.url ? getCanonicalUrl(config.url) : baseUrl,
    'og:site_name': 'VobVorot Store',
    'og:locale': 'en_US',
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': config.title,
    'twitter:description': config.description,
    'twitter:image': fullImageUrl,
    'twitter:image:alt': config.title,
    'twitter:site': '@vobvorot',
    'twitter:creator': '@vobvorot',
    
    // Product specific
    ...(config.type === 'product' && config.price && {
      'product:price:amount': config.price,
      'product:price:currency': config.currency || 'USD',
      'product:availability': config.availability || 'in stock',
      'product:brand': config.brand || 'VobVorot',
      'product:category': config.category
    })
  }
}