import { NextRequest, NextResponse } from 'next/server'
import { CSRFProtection } from '@/lib/csrf-protection'

export async function middleware(request: NextRequest) {
  // Применяем CSRF защиту только к API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const csrfCheck = await CSRFProtection.protectEndpoint(request)
    
    if (!csrfCheck.isValid) {
      return NextResponse.json(
        { error: csrfCheck.error || 'CSRF validation failed' },
        { status: 403 }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}