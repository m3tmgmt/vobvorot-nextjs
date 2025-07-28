import { NextRequest, NextResponse } from 'next/server'
import { CSRFProtection } from '@/lib/csrf-protection'
import { APIResponse } from '@/lib/api-security'

/**
 * GET /api/auth/csrf
 * Generate and return CSRF token for client-side requests
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Генерируем анонимный токен для всех пользователей
    const token = CSRFProtection.generateAnonymousToken()
    
    // Создаем ответ с токеном
    const response = APIResponse.success({ token }, 'CSRF token generated')
    
    // Устанавливаем токен в cookie для автоматической проверки
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 час
    })
    
    return response
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return APIResponse.error('Failed to generate CSRF token', 500)
  }
}