import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://vobvorot.com'
    const currentDate = new Date().toISOString().split('T')[0]
    
    const urls: SitemapUrl[] = []

    // Static pages
    const staticPages = [
      { path: '', priority: 1.0, changefreq: 'daily' as const },
      { path: '/products', priority: 0.9, changefreq: 'daily' as const },
      { path: '/categories', priority: 0.8, changefreq: 'weekly' as const },
      { path: '/about', priority: 0.7, changefreq: 'monthly' as const },
      { path: '/contact', priority: 0.6, changefreq: 'monthly' as const },
      { path: '/training', priority: 0.7, changefreq: 'weekly' as const },
      { path: '/puzzle', priority: 0.6, changefreq: 'weekly' as const },
      { path: '/community', priority: 0.7, changefreq: 'daily' as const },
      { path: '/auth/signin', priority: 0.5, changefreq: 'monthly' as const },
      { path: '/auth/signup', priority: 0.5, changefreq: 'monthly' as const }
    ]

    staticPages.forEach(({ path, priority, changefreq }) => {
      urls.push({
        loc: `${baseUrl}${path}`,
        lastmod: currentDate,
        changefreq,
        priority
      })
    })

    // Dynamic product pages
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      })

      products.forEach(product => {
        urls.push({
          loc: `${baseUrl}/products/${product.slug}`,
          lastmod: product.updatedAt.toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8
        })
      })
    } catch (error) {
      console.error('Error fetching products for sitemap:', error)
    }

    // Dynamic category pages
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      })

      categories.forEach(category => {
        urls.push({
          loc: `${baseUrl}/categories/${category.slug}`,
          lastmod: category.updatedAt.toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.7
        })
      })
    } catch (error) {
      console.error('Error fetching categories for sitemap:', error)
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
      }
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}