import { NextRequest, NextResponse } from 'next/server'
import { CSRFProtection } from '@/lib/csrf-protection'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Исключаем Telegram webhook endpoints из CSRF проверки
  const telegramEndpoints = [
    '/api/telegram/webhook',
    '/api/telegram/direct',
    '/api/telegram/test-debug',
    '/api/telegram/test-simple',
    '/api/telegram/webhook-direct',
    '/api/telegram/direct-crm',
    '/api/telegram/test-crm',
    '/api/telegram/webhook-stateless',
    '/api/telegram/hybrid-crm',
    '/api/telegram/ai-agent',
    '/api/telegram/smart-agent',
    '/api/telegram/ai-assistant',
    '/api/test-env',
    '/api/test-webhook',
    '/api/debug-webhook',
    '/api/test-webhook-simple'
  ]
  
  const isTelegramEndpoint = telegramEndpoints.some(endpoint => pathname.startsWith(endpoint))
  
  // Применяем CSRF защиту только к API endpoints, кроме Telegram
  if (pathname.startsWith('/api/') && !isTelegramEndpoint) {
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