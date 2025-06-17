import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, rateLimits } from './middleware/rate-limit'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Apply rate limiting based on path
  let rateLimitConfig = rateLimits.api // default
  
  if (path.startsWith('/api/auth/')) {
    rateLimitConfig = rateLimits.auth
  } else if (path.startsWith('/api/admin/')) {
    rateLimitConfig = rateLimits.admin
  } else if (path.startsWith('/api/payments/') || path.startsWith('/api/webhooks/')) {
    rateLimitConfig = rateLimits.payment
  } else if (path.startsWith('/api/upload/')) {
    rateLimitConfig = rateLimits.upload
  } else if (path.startsWith('/api/search/')) {
    rateLimitConfig = rateLimits.search
  } else if (path.startsWith('/api/public/')) {
    rateLimitConfig = rateLimits.public
  }
  
  // Apply rate limiting
  const { success, limit, remaining, reset } = await rateLimit(request, rateLimitConfig)
  
  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  // Add security headers
  const response = NextResponse.next()
  
  // Rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Temporarily disable middleware for debugging
    // '/api/:path*',
    // '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}