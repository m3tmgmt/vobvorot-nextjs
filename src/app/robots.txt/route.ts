import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://vobvorot.com'
  
  const robotsTxt = `User-agent: *
Allow: /

# Important pages
Allow: /products
Allow: /categories
Allow: /about
Allow: /contact
Allow: /training
Allow: /puzzle
Allow: /community

# Block admin and private areas
Disallow: /admin
Disallow: /api
Disallow: /account
Disallow: /auth
Disallow: /dashboard
Disallow: /_next
Disallow: /checkout
Disallow: /cart

# Block development and temporary files
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /tmp/
Disallow: /temp/

# Allow important files
Allow: /sitemap.xml
Allow: /favicon.ico
Allow: /robots.txt

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Specific bot instructions
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# Block problematic bots
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /`

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
    }
  })
}