import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * CSRF token generation and validation utilities
 */
export class CSRFProtection {
  private static readonly TOKEN_HEADER = 'X-CSRF-Token'
  private static readonly TOKEN_COOKIE = 'csrf-token'
  private static readonly SECRET_HEADER = 'X-API-Secret'

  /**
   * Generate a CSRF token
   */
  static generateToken(): string {
    return crypto.randomUUID()
  }

  /**
   * Validate CSRF token from request
   */
  static validateToken(request: NextRequest): boolean {
    const headerToken = request.headers.get(this.TOKEN_HEADER)
    const cookieToken = request.cookies.get(this.TOKEN_COOKIE)?.value

    if (!headerToken || !cookieToken) {
      return false
    }

    return headerToken === cookieToken
  }

  /**
   * Set CSRF token in response
   */
  static setToken(response: NextResponse, token: string): void {
    response.cookies.set(this.TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    response.headers.set(this.TOKEN_HEADER, token)
  }

  /**
   * Validate API secret for internal requests
   */
  static validateApiSecret(request: NextRequest): boolean {
    const secret = request.headers.get(this.SECRET_HEADER)
    const expectedSecret = process.env.API_SECRET

    if (!expectedSecret) {
      console.warn('API_SECRET not configured')
      return false
    }

    return secret === expectedSecret
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  /**
   * Sanitize HTML content (basic)
   */
  static sanitizeHTML(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/on\w+='[^']*'/gi, '') // Remove event handlers
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+\-\s()]/g, '').trim()
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static requests = new Map<string, { count: number; reset: number }>()

  /**
   * Check if request is within rate limits
   */
  static checkLimit(
    identifier: string, 
    maxRequests: number = 100, 
    windowMs: number = 60 * 1000
  ): { allowed: boolean; remaining: number; reset: number } {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean old entries
    this.requests.forEach((value, key) => {
      if (value.reset < windowStart) {
        this.requests.delete(key)
      }
    })

    const current = this.requests.get(identifier)
    
    if (!current || current.reset < windowStart) {
      // New window
      this.requests.set(identifier, { count: 1, reset: now + windowMs })
      return { allowed: true, remaining: maxRequests - 1, reset: now + windowMs }
    }

    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, reset: current.reset }
    }

    current.count++
    return { 
      allowed: true, 
      remaining: maxRequests - current.count, 
      reset: current.reset 
    }
  }
}

/**
 * Request validation schemas
 */
export const ValidationSchemas = {
  // User registration
  userRegistration: z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100)
  }),

  // User login
  userLogin: z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(128)
  }),

  // Product creation
  productCreation: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(5000),
    price: z.number().positive().max(999999),
    categoryId: z.string().uuid(),
    images: z.array(z.string().url()).max(10)
  }),

  // Order creation
  orderCreation: z.object({
    items: z.array(z.object({
      productId: z.string().uuid(),
      skuId: z.string().uuid(),
      quantity: z.number().int().positive().max(99)
    })).min(1).max(50),
    shippingAddress: z.object({
      firstName: z.string().min(1).max(50),
      lastName: z.string().min(1).max(50),
      address: z.string().min(1).max(255),
      city: z.string().min(1).max(100),
      postalCode: z.string().min(1).max(20),
      country: z.string().min(2).max(2)
    })
  }),

  // Contact form
  contactForm: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(255),
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(2000)
  }),

  // Review creation
  reviewCreation: z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional()
  })
}

/**
 * API response utilities
 */
export class APIResponse {
  /**
   * Create success response
   */
  static success<T>(data: T, message?: string, status: number = 200): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      message
    }, { status })
  }

  /**
   * Create error response
   */
  static error(
    message: string, 
    status: number = 400, 
    code?: string,
    details?: any
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code,
        details
      }
    }, { status })
  }

  /**
   * Create validation error response
   */
  static validationError(errors: z.ZodError): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.format()
      }
    }, { status: 422 })
  }

  /**
   * Create rate limit error response
   */
  static rateLimitError(reset: number): NextResponse {
    const response = NextResponse.json({
      success: false,
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }, { status: 429 })

    response.headers.set('Retry-After', Math.ceil((reset - Date.now()) / 1000).toString())
    return response
  }
}

/**
 * Middleware factory for API security
 */
export function createSecureAPIHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireCSRF?: boolean
    requireAuth?: boolean
    rateLimit?: { requests: number; window: number }
    validation?: z.ZodSchema<T>
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const rateCheck = RateLimiter.checkLimit(
          clientIP,
          options.rateLimit.requests,
          options.rateLimit.window
        )

        if (!rateCheck.allowed) {
          return APIResponse.rateLimitError(rateCheck.reset)
        }

        // Add rate limit headers
        const response = await handler(request, context)
        response.headers.set('X-RateLimit-Limit', options.rateLimit.requests.toString())
        response.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString())
        response.headers.set('X-RateLimit-Reset', rateCheck.reset.toString())
      }

      // CSRF protection for non-GET requests
      if (options.requireCSRF && request.method !== 'GET') {
        if (!CSRFProtection.validateToken(request) && !CSRFProtection.validateApiSecret(request)) {
          return APIResponse.error('CSRF token validation failed', 403, 'CSRF_ERROR')
        }
      }

      // Request validation
      if (options.validation && (request.method === 'POST' || request.method === 'PUT')) {
        try {
          const body = await request.json()
          const sanitizedBody = sanitizeObject(body)
          options.validation.parse(sanitizedBody)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return APIResponse.validationError(error)
          }
          return APIResponse.error('Invalid request body', 400, 'INVALID_BODY')
        }
      }

      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)
      return APIResponse.error('Internal server error', 500, 'INTERNAL_ERROR')
    }
  }
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return InputSanitizer.sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}