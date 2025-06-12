import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Build configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Output configuration for production (Vercel optimized)
  output: process.env.VERCEL ? undefined : 'standalone',
  
  // Image optimization for VobVorot
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.vobvorot.com',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enhanced security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https://www.soundhelix.com https://res.cloudinary.com",
              "connect-src 'self' https://api.westernbid.com https://www.google-analytics.com https://vitals.vercel-insights.com https://www.soundhelix.com",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://vobvorot.com' : '*'
          }
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400'
          }
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400'
          }
        ],
      }
    ]
  },

  // Production redirects
  async redirects() {
    return [
      {
        source: '/vobvorot/:path*',
        destination: '/:path*',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/auth/signin?callbackUrl=/admin',
        permanent: false,
      }
    ]
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['zod', 'lucide-react'],
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: ['@prisma/client'],

  // Webpack optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Permanent fix for lodash "self is not defined" issue
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
      
      // Define global variables for server-side compatibility
      config.plugins.push(
        new webpack.DefinePlugin({
          'global.self': 'global',
          'self': 'global',
          'window': 'undefined',
        })
      )
      
      // Externalize problematic packages
      config.externals = config.externals || []
      config.externals.push(
        ({ request }: any, callback: any) => {
          // Only externalize when causing issues, not globally
          if (request === 'cloudinary' && !dev) {
            return callback(null, 'commonjs ' + request)
          }
          callback()
        }
      )
    }

    // Production optimizations - temporarily disabled
    // if (!dev) {
    //   config.optimization = {
    //     ...config.optimization,
    //     splitChunks: {
    //       chunks: 'all',
    //       cacheGroups: {
    //         vendor: {
    //           test: /[\\/]node_modules[\\/]/,
    //           name: 'vendors',
    //           chunks: 'all',
    //         },
    //       },
    //     },
    //   }
    // }

    // Bundle analyzer (only in development with ANALYZE=true)
    if (process.env.ANALYZE === 'true' && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: `${isServer ? 'server' : 'client'}.html`,
        })
      )
    }

    return config
  },

  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
    BUILD_TIME: new Date().toISOString(),
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  }
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: "vobvorot",
  project: "nextjs-store",

  // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps
  widenClientFileUpload: true,
  sourcemaps: {
    disable: false,
    deleteSourcemapsAfterUpload: true
  },
  disableLogger: true,
});
