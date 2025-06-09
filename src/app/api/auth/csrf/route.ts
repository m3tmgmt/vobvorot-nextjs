import { NextRequest, NextResponse } from 'next/server'
import { CSRFProtection, APIResponse } from '@/lib/api-security'

/**
 * GET /api/auth/csrf
 * Generate and return CSRF token for client-side requests
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = CSRFProtection.generateToken()
    const response = APIResponse.success({ token }, 'CSRF token generated')
    
    CSRFProtection.setToken(response, token)
    
    return response
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return APIResponse.error('Failed to generate CSRF token', 500)
  }
}