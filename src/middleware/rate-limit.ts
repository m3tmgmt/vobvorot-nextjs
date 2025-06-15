import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Simple in-memory rate limiter as fallback
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  
  async limit(key: string, limit: number, window: number): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now()
    const resetTime = now + window * 1000
    
    const record = this.requests.get(key) || { count: 0, resetTime }
    
    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 0
      record.resetTime = resetTime
    }
    
    record.count++
    this.requests.set(key, record)
    
    // Clean up old entries
    if (this.requests.size > 10000) {
      for (const [k, v] of this.requests.entries()) {
        if (now > v.resetTime) {
          this.requests.delete(k)
        }
      }
    }
    
    return {
      success: record.count <= limit,
      limit,
      remaining: Math.max(0, limit - record.count),
      reset: record.resetTime
    }
  }
}

// Rate limiter instance
const memoryLimiter = new InMemoryRateLimiter()

// Upstash Redis client (if configured)
let redisClient: Redis | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error)
  }
}

export interface RateLimitOptions {
  limit?: number
  window?: number // in seconds
  identifier?: (req: NextRequest) => string
}

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const {
    limit = 60,
    window = 60,
    identifier = (req) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
  } = options
  
  const id = identifier(req)
  const key = `rate_limit:${req.nextUrl.pathname}:${id}`
  
  // Use Redis if available
  if (redisClient) {
    try {
      const multi = redisClient.multi()
      multi.incr(key)
      multi.expire(key, window)
      
      const results = await multi.exec() as any[]
      const count = (results?.[0]?.[1] as number) || 1
      
      return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset: Date.now() + window * 1000
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fall back to in-memory
    }
  }
  
  // Use in-memory rate limiter
  return memoryLimiter.limit(key, limit, window)
}

// Middleware helper for rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { success, limit, remaining, reset } = await rateLimit(req, options)
    
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
    
    const response = await handler(req)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())
    
    return response
  }
}

// Predefined rate limit configurations
export const rateLimits = {
  // Very restrictive for auth endpoints
  auth: { limit: 5, window: 900 }, // 5 requests per 15 minutes
  
  // Restrictive for payment endpoints
  payment: { limit: 10, window: 300 }, // 10 requests per 5 minutes
  
  // Moderate for API endpoints
  api: { limit: 60, window: 60 }, // 60 requests per minute
  
  // Lenient for public endpoints
  public: { limit: 100, window: 60 }, // 100 requests per minute
  
  // Very restrictive for admin endpoints
  admin: { limit: 30, window: 60 }, // 30 requests per minute
  
  // Upload endpoints
  upload: { limit: 10, window: 300 }, // 10 uploads per 5 minutes
  
  // Search endpoints
  search: { limit: 30, window: 60 }, // 30 searches per minute
}