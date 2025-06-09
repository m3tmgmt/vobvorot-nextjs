import { MetadataRoute } from 'next'
// import { prisma } from '@/lib/prisma' // Disabled until database is configured

/**
 * Generate comprehensive sitemap for VobVorot store
 * Includes static pages, products, categories, and other dynamic content
 * Optimized for search engine crawling and indexing
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://vobvorot.com'
  const currentDate = new Date()

  // Database calls disabled until configured
  // When enabled, these should fetch actual products and categories
  const products: any[] = []
  const categories: any[] = []

  // Static pages with SEO priorities
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${baseUrl}/exvicpmour`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/community`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/training`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/puzzle`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4
    },
    // Legal pages
    {
      url: `${baseUrl}/legal`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/legal/returns`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/legal/shipping`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    // Auth pages (lower priority, exclude from main crawling)
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.2
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.2
    }
  ]

  // Dynamic product routes
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt || currentDate,
    changeFrequency: 'weekly',
    priority: 0.8
  }))

  // Category routes
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt || currentDate,
    changeFrequency: 'weekly',
    priority: 0.7
  }))

  // Future: Add blog routes when blog is implemented
  // const blogRoutes: MetadataRoute.Sitemap = []

  // Combine all routes and sort by priority (highest first)
  const allRoutes = [...staticRoutes, ...productRoutes, ...categoryRoutes]
  
  return allRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0))
}

/**
 * When database is configured, replace the empty arrays above with:
 * 
 * const products = await prisma.product.findMany({
 *   where: { isActive: true },
 *   select: { slug: true, updatedAt: true },
 *   orderBy: { updatedAt: 'desc' }
 * })
 * 
 * const categories = await prisma.category.findMany({
 *   where: { isActive: true },
 *   select: { slug: true, updatedAt: true }
 * })
 */