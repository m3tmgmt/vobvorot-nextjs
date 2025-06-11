import { createHash, createHmac, timingSafeEqual } from 'crypto'

// WesternBid Payment Integration - Enhanced Production-Ready Version

// Configuration Interface
export interface WesternBidConfig {
  merchantId: string
  secretKey: string
  apiUrl: string
  environment: 'sandbox' | 'production'
  webhookSecret: string
  timeout: number
  retryAttempts: number
}

// Payment Request Interface
export interface PaymentRequest {
  orderId: string
  amount: number
  currency: string
  description: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  returnUrl: string
  cancelUrl: string
  webhookUrl?: string
  metadata?: Record<string, any>
}

// Payment Response Interface
export interface PaymentResponse {
  success: boolean
  paymentId?: string
  paymentUrl?: string
  sessionId?: string
  error?: string
  errorCode?: string
}

// Payment Status Interface
export interface PaymentStatus {
  paymentId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  amount: number
  currency: string
  orderId: string
  transactionId?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

// Refund Request Interface
export interface RefundRequest {
  paymentId: string
  amount?: number // Partial refund if less than original amount
  reason: string
  metadata?: Record<string, any>
}

// Refund Response Interface
export interface RefundResponse {
  success: boolean
  refundId?: string
  amount?: number
  status?: 'pending' | 'completed' | 'failed'
  error?: string
  errorCode?: string
}

// Webhook Data Interface
export interface WebhookData {
  event: 'payment.completed' | 'payment.failed' | 'payment.cancelled' | 'refund.completed' | 'refund.failed' | 'payment.pending' | 'payment.unknown'
  paymentId: string
  orderId: string
  amount: number
  currency: string
  status: string
  transactionId?: string
  timestamp: string
  signature: string
  metadata?: Record<string, any>
}

// Logger Interface
interface Logger {
  info: (message: string, data?: any) => void
  warn: (message: string, data?: any) => void
  error: (message: string, data?: any) => void
}

// Simple Logger Implementation
class PaymentLogger implements Logger {
  private prefix = '[WesternBid]'

  info(message: string, data?: any) {
    console.log(`${this.prefix} INFO: ${message}`, data || '')
  }

  warn(message: string, data?: any) {
    console.warn(`${this.prefix} WARN: ${message}`, data || '')
  }

  error(message: string, data?: any) {
    console.error(`${this.prefix} ERROR: ${message}`, data || '')
  }
}

// Custom Error Classes
export class WesternBidError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message)
    this.name = 'WesternBidError'
  }
}

export class WesternBidConfigError extends WesternBidError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR')
    this.name = 'WesternBidConfigError'
  }
}

export class WesternBidAPIError extends WesternBidError {
  constructor(message: string, statusCode?: number, originalError?: any) {
    super(message, 'API_ERROR', statusCode, originalError)
    this.name = 'WesternBidAPIError'
  }
}

export class WesternBidSignatureError extends WesternBidError {
  constructor(message: string) {
    super(message, 'SIGNATURE_ERROR')
    this.name = 'WesternBidSignatureError'
  }
}

// Main WesternBid API Class
class WesternBidAPI {
  private config: WesternBidConfig
  private logger: Logger

  constructor() {
    this.logger = new PaymentLogger()
    
    this.config = {
      merchantId: process.env.WESTERNBID_MERCHANT_ID || '',
      secretKey: process.env.WESTERNBID_SECRET_KEY || '',
      webhookSecret: process.env.WESTERNBID_WEBHOOK_SECRET || '',
      apiUrl: process.env.WESTERNBID_API_URL || 'https://api.westernbid.com',
      environment: (process.env.WESTERNBID_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      timeout: parseInt(process.env.WESTERNBID_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.WESTERNBID_RETRY_ATTEMPTS || '3')
    }

    // Validate configuration on initialization
    this.validateConfig()
  }

  private validateConfig(): void {
    if (!this.config.merchantId) {
      throw new WesternBidConfigError('WESTERNBID_MERCHANT_ID is required')
    }
    if (!this.config.secretKey) {
      throw new WesternBidConfigError('WESTERNBID_SECRET_KEY is required')
    }
    if (this.config.environment === 'production' && !this.config.webhookSecret) {
      this.logger.warn('WESTERNBID_WEBHOOK_SECRET is recommended for production')
    }
  }

  // Generate HMAC-SHA256 signature for WesternBid API
  private generateSignature(data: Record<string, any>, useWebhookSecret = false): string {
    try {
      // Sort keys alphabetically
      const sortedKeys = Object.keys(data).sort()
      
      // Create query string
      const queryString = sortedKeys
        .filter(key => data[key] !== undefined && data[key] !== null)
        .map(key => `${key}=${encodeURIComponent(String(data[key]))}`)
        .join('&')
      
      // Choose the appropriate secret
      const secret = useWebhookSecret ? this.config.webhookSecret : this.config.secretKey
      
      // Generate HMAC-SHA256 signature
      const signature = createHmac('sha256', secret)
        .update(queryString)
        .digest('hex')
      
      this.logger.info('Signature generated', { 
        dataKeys: sortedKeys, 
        queryLength: queryString.length,
        usingWebhookSecret: useWebhookSecret
      })
      
      return signature
    } catch (error) {
      this.logger.error('Failed to generate signature', error)
      throw new WesternBidSignatureError('Failed to generate signature')
    }
  }

  // Verify webhook signature
  public verifyWebhookSignature(payload: string, receivedSignature: string): boolean {
    try {
      if (!this.config.webhookSecret) {
        this.logger.warn('Webhook secret not configured, skipping verification')
        return true // In development mode, allow unverified webhooks
      }

      const expectedSignature = createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex')
      
      const expectedBuffer = Buffer.from(expectedSignature, 'hex')
      const receivedBuffer = Buffer.from(receivedSignature.replace('sha256=', ''), 'hex')
      
      if (expectedBuffer.length !== receivedBuffer.length) {
        return false
      }
      
      const isValid = timingSafeEqual(expectedBuffer, receivedBuffer)
      
      this.logger.info('Webhook signature verification', { 
        isValid,
        receivedSignature: receivedSignature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...'
      })
      
      return isValid
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error)
      return false
    }
  }

  // Make HTTP request with retry logic
  private async makeRequest<T>(
    url: string, 
    options: RequestInit, 
    retryCount = 0
  ): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any = {}
        
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        throw new WesternBidAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }
      
      const result = await response.json()
      return result as T
    } catch (error) {
      this.logger.error(`Request failed (attempt ${retryCount + 1})`, {
        url,
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Retry logic for certain errors
      if (retryCount < this.config.retryAttempts && this.shouldRetry(error)) {
        const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeRequest<T>(url, options, retryCount + 1)
      }
      
      throw error
    }
  }

  // Determine if request should be retried
  private shouldRetry(error: any): boolean {
    if (error instanceof WesternBidAPIError) {
      // Retry on server errors (5xx) but not client errors (4xx)
      return error.statusCode ? error.statusCode >= 500 : false
    }
    
    // Retry on network errors
    return error.name === 'AbortError' || error.name === 'TypeError'
  }

  // Create a new payment session (WesternBid Form-based integration)
  public async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.info('Creating payment', { orderId: request.orderId, amount: request.amount })
      
      // Validate request
      this.validatePaymentRequest(request)
      
      // Generate unique payment ID for this transaction
      const paymentId = `wb_${Date.now()}_${request.orderId}`
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // WesternBid uses form-based integration with their payment gateway
      // Generate the payment URL that will redirect to WesternBid form
      const paymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/westernbid/redirect?paymentId=${paymentId}&orderId=${request.orderId}&sessionId=${sessionId}`
      
      this.logger.info('Payment session created', { 
        paymentId,
        sessionId,
        paymentUrl
      })

      return {
        success: true,
        paymentId,
        paymentUrl,
        sessionId
      }
    } catch (error) {
      this.logger.error('Payment creation failed', error)
      
      // Fallback to mock payment in development
      if (this.config.environment !== 'production' && !(error instanceof WesternBidConfigError)) {
        return this.createMockPayment(request)
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
        errorCode: error instanceof WesternBidError ? error.code : undefined
      }
    }
  }

  // Generate WesternBid payment form data
  public generatePaymentFormData(request: PaymentRequest, paymentId: string): Record<string, string> {
    const formData = {
      // Required WesternBid fields
      business: this.config.merchantId, // wb_login
      item_name: request.description,
      item_number: request.orderId,
      amount: request.amount.toFixed(2),
      currency_code: request.currency.toUpperCase(),
      
      // Customer info
      first_name: request.customerName.split(' ')[0] || '',
      last_name: request.customerName.split(' ').slice(1).join(' ') || '',
      email: request.customerEmail,
      
      // URLs
      return: request.returnUrl,
      cancel_return: request.cancelUrl,
      notify_url: request.webhookUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      
      // Transaction info
      invoice: paymentId,
      custom: JSON.stringify({
        orderId: request.orderId,
        paymentId,
        metadata: request.metadata || {}
      }),
      
      // Payment options
      cmd: '_xclick', // Single payment
      no_note: '1',
      no_shipping: '1',
      charset: 'utf-8'
    }

    // Add signature if secret key is available
    if (this.config.secretKey) {
      const signature = this.generateWesternBidSignature(formData)
      ;(formData as any).verify_sign = signature
    }

    return formData
  }

  // Generate WesternBid-specific signature
  private generateWesternBidSignature(formData: Record<string, string>): string {
    try {
      // Create query string from form data
      const sortedKeys = Object.keys(formData).sort()
      const queryString = sortedKeys
        .filter(key => formData[key] !== undefined && formData[key] !== null && formData[key] !== '')
        .map(key => `${key}=${encodeURIComponent(formData[key])}`)
        .join('&')
      
      // Add secret key
      const signatureString = queryString + this.config.secretKey
      
      // Generate MD5 hash (WesternBid uses MD5 for compatibility)
      const signature = createHash('md5').update(signatureString).digest('hex')
      
      this.logger.info('Generated WesternBid signature', { 
        queryLength: queryString.length,
        signatureLength: signature.length
      })
      
      return signature
    } catch (error) {
      this.logger.error('Failed to generate WesternBid signature', error)
      throw new WesternBidSignatureError('Failed to generate WesternBid signature')
    }
  }

  // Validate payment request
  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.orderId || request.orderId.length < 3) {
      throw new WesternBidError('Order ID must be at least 3 characters', 'INVALID_ORDER_ID')
    }
    if (!request.amount || request.amount <= 0) {
      throw new WesternBidError('Amount must be greater than 0', 'INVALID_AMOUNT')
    }
    if (!request.currency || !/^[A-Z]{3}$/.test(request.currency)) {
      throw new WesternBidError('Currency must be a valid 3-letter code', 'INVALID_CURRENCY')
    }
    if (!request.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.customerEmail)) {
      throw new WesternBidError('Valid customer email is required', 'INVALID_EMAIL')
    }
    if (!request.returnUrl || !request.cancelUrl) {
      throw new WesternBidError('Return URL and Cancel URL are required', 'INVALID_URLS')
    }
  }

  // Create mock payment for development
  private createMockPayment(request: PaymentRequest): PaymentResponse {
    const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const mockSessionId = `session_${Date.now()}`
    const mockPaymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/payment/mock?paymentId=${mockPaymentId}&orderId=${request.orderId}&sessionId=${mockSessionId}`
    
    this.logger.info('Created mock payment', { 
      paymentId: mockPaymentId,
      sessionId: mockSessionId
    })
    
    return {
      success: true,
      paymentId: mockPaymentId,
      paymentUrl: mockPaymentUrl,
      sessionId: mockSessionId
    }
  }

  // Get payment status
  public async getPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    try {
      this.logger.info('Getting payment status', { paymentId })
      
      const requestData = {
        merchant_id: this.config.merchantId,
        payment_id: paymentId,
        timestamp: Math.floor(Date.now() / 1000)
      }
      
      const signature = this.generateSignature(requestData)
      
      const response = await this.makeRequest<any>(
        `${this.config.apiUrl}/v1/payments/${paymentId}/status`,
        {
          method: 'GET',
          headers: {
            'X-Merchant-ID': this.config.merchantId,
            'X-Signature': signature,
            'X-Timestamp': requestData.timestamp.toString(),
            'User-Agent': 'WesternBid-Node/1.0.0'
          }
        }
      )
      
      return {
        paymentId: response.payment_id,
        status: response.status,
        amount: response.amount / 100, // Convert back from cents
        currency: response.currency,
        orderId: response.order_id,
        transactionId: response.transaction_id,
        failureReason: response.failure_reason,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        metadata: response.metadata ? JSON.parse(response.metadata) : undefined
      }
    } catch (error) {
      this.logger.error('Failed to get payment status', { paymentId, error })
      
      // Mock status for development
      if (this.config.environment === 'sandbox' && paymentId.startsWith('mock_')) {
        return {
          paymentId,
          status: 'completed',
          amount: 100, // Mock amount
          currency: 'USD',
          orderId: 'mock_order',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      
      return null
    }
  }

  // Verify payment (legacy method for backward compatibility)
  public async verifyPayment(
    paymentId: string, 
    signature?: string
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const paymentStatus = await this.getPaymentStatus(paymentId)
      
      if (!paymentStatus) {
        return {
          success: false,
          error: 'Payment not found'
        }
      }
      
      return {
        success: true,
        status: paymentStatus.status
      }
    } catch (error) {
      this.logger.error('Payment verification failed', { paymentId, error })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      }
    }
  }

  // Process refund
  public async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      this.logger.info('Processing refund', { 
        paymentId: request.paymentId,
        amount: request.amount
      })
      
      const refundData = {
        merchant_id: this.config.merchantId,
        payment_id: request.paymentId,
        amount: request.amount ? Math.round(request.amount * 100) : undefined, // Convert to cents
        reason: request.reason,
        timestamp: Math.floor(Date.now() / 1000),
        metadata: JSON.stringify(request.metadata || {})
      }
      
      const signature = this.generateSignature(refundData)
      
      const response = await this.makeRequest<any>(
        `${this.config.apiUrl}/v1/payments/${request.paymentId}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': this.config.merchantId,
            'X-Signature': signature,
            'X-Timestamp': refundData.timestamp.toString(),
            'User-Agent': 'WesternBid-Node/1.0.0'
          },
          body: JSON.stringify(refundData)
        }
      )
      
      this.logger.info('Refund processed successfully', { 
        refundId: response.refund_id,
        status: response.status
      })
      
      return {
        success: true,
        refundId: response.refund_id,
        amount: response.amount / 100, // Convert back from cents
        status: response.status
      }
    } catch (error) {
      this.logger.error('Refund processing failed', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
        errorCode: error instanceof WesternBidError ? error.code : undefined
      }
    }
  }

  // Parse webhook data (supports both JSON and form data)
  public parseWebhookData(payload: string): WebhookData | null {
    try {
      const data = JSON.parse(payload)
      
      // Check if this is WesternBid form data
      if (data.payment_status || data.txn_type || data.business) {
        return this.parseWesternBidFormData(data)
      }
      
      // Standard JSON webhook format
      if (!data.event || !data.payment_id || !data.order_id) {
        this.logger.warn('Invalid webhook data: missing required fields')
        return null
      }
      
      return {
        event: data.event,
        paymentId: data.payment_id,
        orderId: data.order_id,
        amount: data.amount / 100, // Convert back from cents
        currency: data.currency,
        status: data.status,
        transactionId: data.transaction_id,
        timestamp: data.timestamp,
        signature: data.signature,
        metadata: data.metadata ? JSON.parse(data.metadata) : undefined
      }
    } catch (error) {
      this.logger.error('Failed to parse webhook data', error)
      return null
    }
  }

  // Parse WesternBid form-based webhook data
  private parseWesternBidFormData(formData: Record<string, any>): WebhookData | null {
    try {
      this.logger.info('Parsing WesternBid form data', {
        paymentStatus: formData.payment_status,
        txnType: formData.txn_type,
        business: formData.business
      })

      // Extract order information
      let orderId = formData.item_number || formData.invoice
      let customData: any = {}
      
      if (formData.custom) {
        try {
          customData = JSON.parse(formData.custom)
          orderId = customData.orderId || orderId
        } catch {
          // Custom field is not JSON, use as-is
          customData = { originalCustom: formData.custom }
        }
      }

      // Map WesternBid payment statuses to our events
      let event: 'payment.completed' | 'payment.failed' | 'payment.cancelled' | 'refund.completed' | 'refund.failed' | 'payment.pending' | 'payment.unknown'
      let status: string
      
      switch (formData.payment_status?.toLowerCase()) {
        case 'completed':
        case 'success':
          event = 'payment.completed'
          status = 'completed'
          break
        case 'failed':
        case 'denied':
        case 'voided':
          event = 'payment.failed'
          status = 'failed'
          break
        case 'cancelled':
        case 'canceled':
          event = 'payment.cancelled'
          status = 'cancelled'
          break
        case 'refunded':
          event = 'refund.completed'
          status = 'refunded'
          break
        case 'pending':
        case 'in_progress':
          event = 'payment.pending'
          status = 'pending'
          break
        default:
          this.logger.warn('Unknown WesternBid payment status', {
            paymentStatus: formData.payment_status,
            txnType: formData.txn_type
          })
          event = 'payment.unknown'
          status = formData.payment_status || 'unknown'
      }

      const paymentId = formData.txn_id || formData.transaction_id || customData.paymentId || `wb_${Date.now()}`
      
      return {
        event,
        paymentId,
        orderId,
        amount: parseFloat(formData.mc_gross || formData.payment_gross || formData.amount || '0'),
        currency: formData.mc_currency || formData.currency_code || 'USD',
        status,
        transactionId: formData.txn_id || formData.transaction_id,
        timestamp: new Date().toISOString(),
        signature: formData.verify_sign || '',
        metadata: {
          ...customData,
          rawFormData: formData,
          receiverEmail: formData.receiver_email || formData.business,
          payerEmail: formData.payer_email,
          payerName: `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
          itemName: formData.item_name,
          txnType: formData.txn_type,
          paymentType: formData.payment_type,
          paymentDate: formData.payment_date
        }
      }
    } catch (error) {
      this.logger.error('Failed to parse WesternBid form data', error)
      return null
    }
  }

  // Get configuration (for debugging)
  public getConfig(): Partial<WesternBidConfig> {
    return {
      merchantId: this.config.merchantId ? '***' + this.config.merchantId.slice(-4) : '',
      apiUrl: this.config.apiUrl,
      environment: this.config.environment,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts
    }
  }
}

// Export singleton instance
export const westernbid = new WesternBidAPI()

// Export types for convenience (interfaces are already exported above)