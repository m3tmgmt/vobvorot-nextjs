import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { logSecurityEvent } from '@/lib/payment-logger'
import { isSecurityEnabled, getPaymentConfig } from '@/lib/payment-config'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security configuration
interface SecurityConfig {
  maxRequestsPerMinute: number
  maxRequestsPerHour: number
  maxPayloadSize: number
  requiredHeaders: string[]
  bannedIPs: string[]
  rateLimitWindowMs: number
}

const securityConfig: SecurityConfig = {
  maxRequestsPerMinute: parseInt(process.env.PAYMENT_RATE_LIMIT_MINUTE || '10'),
  maxRequestsPerHour: parseInt(process.env.PAYMENT_RATE_LIMIT_HOUR || '100'),
  maxPayloadSize: parseInt(process.env.PAYMENT_MAX_PAYLOAD_SIZE || '1048576'), // 1MB
  requiredHeaders: ['user-agent', 'content-type'],
  bannedIPs: (process.env.PAYMENT_BANNED_IPS || '').split(',').filter(ip => ip.trim()),
  rateLimitWindowMs: 60 * 1000 // 1 minute
}

// Security middleware result
export interface SecurityCheckResult {
  allowed: boolean
  reason?: string
  statusCode?: number
  headers?: Record<string, string>
}

// IP address extraction
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }
  
  // Fallback to connection IP (may be proxy IP)
  return (request as any).ip || '127.0.0.1'
}

// Rate limiting
export function checkRateLimit(ip: string, endpoint: string): SecurityCheckResult {
  if (!isSecurityEnabled('enableRateLimiting')) {
    return { allowed: true }
  }

  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const windowStart = now - securityConfig.rateLimitWindowMs
  
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < windowStart) {
    // Reset or create new entry
    entry = { count: 1, resetTime: now + securityConfig.rateLimitWindowMs }
    rateLimitStore.set(key, entry)
    return { allowed: true }
  }
  
  entry.count++
  
  if (entry.count > securityConfig.maxRequestsPerMinute) {
    logSecurityEvent({
      event: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded for IP ${ip} on endpoint ${endpoint}`,
      ipAddress: ip,
      metadata: {
        endpoint,
        count: entry.count,
        limit: securityConfig.maxRequestsPerMinute
      }
    })
    
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      statusCode: 429,
      headers: {
        'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
        'X-RateLimit-Limit': securityConfig.maxRequestsPerMinute.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': entry.resetTime.toString()
      }
    }
  }
  
  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': securityConfig.maxRequestsPerMinute.toString(),
      'X-RateLimit-Remaining': (securityConfig.maxRequestsPerMinute - entry.count).toString(),
      'X-RateLimit-Reset': entry.resetTime.toString()
    }
  }
}

// IP whitelist/blacklist checking
export function checkIPPermissions(ip: string): SecurityCheckResult {
  // Check if IP is banned
  if (securityConfig.bannedIPs.includes(ip)) {
    logSecurityEvent({
      event: 'SUSPICIOUS_REQUEST',
      message: `Request from banned IP address: ${ip}`,
      ipAddress: ip,
      metadata: {
        reason: 'banned_ip'
      }
    })
    
    return {
      allowed: false,
      reason: 'IP address not allowed',
      statusCode: 403
    }
  }
  
  // Check whitelist if IP whitelisting is enabled
  if (isSecurityEnabled('enableIpWhitelisting')) {
    const config = getPaymentConfig()
    const allowedIPs = config.security.allowedIPs
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(ip)) {
      logSecurityEvent({
        event: 'SUSPICIOUS_REQUEST',
        message: `Request from non-whitelisted IP address: ${ip}`,
        ipAddress: ip,
        metadata: {
          reason: 'not_whitelisted',
          allowedIPs: allowedIPs.length
        }
      })
      
      return {
        allowed: false,
        reason: 'IP address not whitelisted',
        statusCode: 403
      }
    }
  }
  
  return { allowed: true }
}

// Payload size validation
export function checkPayloadSize(contentLength: string | null): SecurityCheckResult {
  if (!contentLength) {
    return { allowed: true }
  }
  
  const size = parseInt(contentLength)
  
  if (isNaN(size)) {
    return { allowed: true }
  }
  
  if (size > securityConfig.maxPayloadSize) {
    logSecurityEvent({
      event: 'SUSPICIOUS_REQUEST',
      message: `Payload size ${size} exceeds maximum allowed ${securityConfig.maxPayloadSize}`,
      metadata: {
        payloadSize: size,
        maxSize: securityConfig.maxPayloadSize,
        reason: 'payload_too_large'
      }
    })
    
    return {
      allowed: false,
      reason: 'Payload too large',
      statusCode: 413
    }
  }
  
  return { allowed: true }
}

// Header validation
export function checkRequiredHeaders(request: NextRequest): SecurityCheckResult {
  for (const headerName of securityConfig.requiredHeaders) {
    const headerValue = request.headers.get(headerName)
    
    if (!headerValue || headerValue.trim() === '') {
      logSecurityEvent({
        event: 'SUSPICIOUS_REQUEST',
        message: `Missing required header: ${headerName}`,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: {
          missingHeader: headerName,
          reason: 'missing_required_header'
        }
      })
      
      return {
        allowed: false,
        reason: `Missing required header: ${headerName}`,
        statusCode: 400
      }
    }
  }
  
  return { allowed: true }
}

// Suspicious pattern detection
export function detectSuspiciousPatterns(request: NextRequest, payload?: string): SecurityCheckResult {
  const userAgent = request.headers.get('user-agent') || ''
  const ip = getClientIP(request)
  
  // Check for bot-like user agents
  const suspiciousUAPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /automated/i,
    /curl/i,
    /wget/i,
    /python-requests/i
  ]
  
  const isSuspiciousUA = suspiciousUAPatterns.some(pattern => pattern.test(userAgent))
  
  if (isSuspiciousUA && !userAgent.includes('GoogleBot') && !userAgent.includes('Bingbot')) {
    logSecurityEvent({
      event: 'SUSPICIOUS_REQUEST',
      message: `Suspicious user agent detected: ${userAgent}`,
      ipAddress: ip,
      userAgent,
      metadata: {
        reason: 'suspicious_user_agent'
      }
    })
    
    // Log but don't block - some legitimate tools might trigger this
  }
  
  // Check payload for suspicious content
  if (payload) {
    const suspiciousPayloadPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /union.*select/i,
      /drop.*table/i,
      /delete.*from/i
    ]
    
    const hasSuspiciousContent = suspiciousPayloadPatterns.some(pattern => pattern.test(payload))
    
    if (hasSuspiciousContent) {
      logSecurityEvent({
        event: 'SUSPICIOUS_REQUEST',
        message: 'Suspicious content detected in payload',
        ipAddress: ip,
        userAgent,
        metadata: {
          reason: 'suspicious_payload_content',
          payloadLength: payload.length
        }
      })
      
      return {
        allowed: false,
        reason: 'Suspicious content detected',
        statusCode: 400
      }
    }
  }
  
  return { allowed: true }
}

// Comprehensive security check
export function performSecurityCheck(
  request: NextRequest, 
  endpoint: string,
  payload?: string
): SecurityCheckResult {
  const ip = getClientIP(request)
  
  // 1. Check IP permissions
  const ipCheck = checkIPPermissions(ip)
  if (!ipCheck.allowed) {
    return ipCheck
  }
  
  // 2. Check rate limiting
  const rateLimitCheck = checkRateLimit(ip, endpoint)
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck
  }
  
  // 3. Check payload size
  const contentLength = request.headers.get('content-length')
  const payloadSizeCheck = checkPayloadSize(contentLength)
  if (!payloadSizeCheck.allowed) {
    return payloadSizeCheck
  }
  
  // 4. Check required headers
  const headersCheck = checkRequiredHeaders(request)
  if (!headersCheck.allowed) {
    return headersCheck
  }
  
  // 5. Detect suspicious patterns
  const suspiciousPatternCheck = detectSuspiciousPatterns(request, payload)
  if (!suspiciousPatternCheck.allowed) {
    return suspiciousPatternCheck
  }
  
  return {
    allowed: true,
    headers: {
      ...rateLimitCheck.headers
    }
  }
}

// Generate webhook signature for verification
export function generateWebhookSignature(payload: string, secret: string): string {
  return createHash('sha256')
    .update(payload + secret)
    .digest('hex')
}

// Verify webhook signature with timing-safe comparison
export function verifyWebhookSignature(
  payload: string,
  receivedSignature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = generateWebhookSignature(payload, secret)
    
    // Remove 'sha256=' prefix if present
    const cleanReceivedSignature = receivedSignature.replace(/^sha256=/, '')
    
    // Use constant-time comparison to prevent timing attacks
    if (expectedSignature.length !== cleanReceivedSignature.length) {
      return false
    }
    
    let result = 0
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ cleanReceivedSignature.charCodeAt(i)
    }
    
    return result === 0
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Request fingerprinting for fraud detection
export function generateRequestFingerprint(request: NextRequest): string {
  const components = [
    getClientIP(request),
    request.headers.get('user-agent') || '',
    request.headers.get('accept') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('accept-encoding') || ''
  ]
  
  return createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 16)
}

// Clean up rate limit store periodically
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Initialize cleanup interval
if (typeof window === 'undefined') {
  // Only run on server side
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000) // Clean up every 5 minutes
}

// Export security utilities
export {
  securityConfig,
  rateLimitStore
}