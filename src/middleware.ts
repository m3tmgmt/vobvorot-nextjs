import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // If user is not authenticated and trying to access protected routes
    if (!req.nextauth.token && (
      req.nextUrl.pathname.startsWith('/account') ||
      req.nextUrl.pathname.startsWith('/checkout')
    )) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname)
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
    }

    // If user is authenticated but trying to access auth pages
    if (req.nextauth.token && (
      req.nextUrl.pathname.startsWith('/auth/signin') ||
      req.nextUrl.pathname.startsWith('/auth/signup')
    )) {
      return NextResponse.redirect(new URL('/account', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let middleware handle the logic
    },
  }
)

export const config = {
  matcher: ['/account/:path*', '/auth/:path*', '/checkout/:path*']
}