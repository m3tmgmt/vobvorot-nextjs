import Head from 'next/head'
import { SEOConfig, generateSocialMeta, getCanonicalUrl, generateAlternateLanguages } from '@/lib/seo'

interface SEOProps {
  config: SEOConfig
  structuredData?: object | object[]
  noIndex?: boolean
  canonical?: string
}

export function SEO({ config, structuredData, noIndex = false, canonical }: SEOProps) {
  const socialMeta = generateSocialMeta(config)
  const canonicalUrl = canonical || (config.url ? getCanonicalUrl(config.url) : undefined)
  const alternateLanguages = config.url ? generateAlternateLanguages(config.url) : []

  return (
    <Head>
      {/* Basic meta tags */}
      <title>{config.title}</title>
      <meta name="description" content={config.description} />
      {config.keywords && config.keywords.length > 0 && (
        <meta name="keywords" content={config.keywords.join(', ')} />
      )}

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Alternate languages */}
      {alternateLanguages.map(({ hrefLang, href }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}

      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />

      {/* Social media meta tags */}
      {Object.entries(socialMeta).map(([property, content]) => {
        if (property.startsWith('og:')) {
          return <meta key={property} property={property} content={content} />
        } else {
          return <meta key={property} name={property} content={content} />
        }
      })}

      {/* Structured data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              Array.isArray(structuredData) ? structuredData : [structuredData]
            )
          }}
        />
      )}

      {/* Additional meta tags for better indexing */}
      <meta name="author" content="VobVorot Store" />
      <meta name="publisher" content="VobVorot Store" />
      <meta name="theme-color" content="#ff6b9d" />
      <meta name="msapplication-TileColor" content="#ff6b9d" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://res.cloudinary.com" />
      
      {/* DNS prefetch for performance */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      
      {/* Favicon and icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Additional PWA meta tags */}
      <meta name="application-name" content="VobVorot Store" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="VobVorot" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
      <meta name="msapplication-tap-highlight" content="no" />

      {/* Viewport and mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      
      {/* Additional product-specific meta tags */}
      {config.type === 'product' && config.price && (
        <>
          <meta name="product:price:amount" content={config.price} />
          <meta name="product:price:currency" content={config.currency || 'USD'} />
          <meta name="product:availability" content={config.availability || 'in stock'} />
          {config.brand && <meta name="product:brand" content={config.brand} />}
          {config.category && <meta name="product:category" content={config.category} />}
        </>
      )}
    </Head>
  )
}

// Convenience components for common page types
export function ProductSEO({ 
  product, 
  structuredData,
  noIndex = false 
}: { 
  product: SEOConfig
  structuredData?: object
  noIndex?: boolean 
}) {
  return <SEO config={product} structuredData={structuredData} noIndex={noIndex} />
}

export function CategorySEO({ 
  category, 
  noIndex = false 
}: { 
  category: SEOConfig
  noIndex?: boolean 
}) {
  return <SEO config={category} noIndex={noIndex} />
}

export function PageSEO({ 
  title, 
  description, 
  canonical,
  noIndex = false 
}: { 
  title: string
  description: string
  canonical?: string
  noIndex?: boolean 
}) {
  return (
    <SEO 
      config={{ title, description, type: 'website' }} 
      canonical={canonical}
      noIndex={noIndex} 
    />
  )
}