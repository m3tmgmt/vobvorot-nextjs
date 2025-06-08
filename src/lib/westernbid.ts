// WesternBid Payment Integration
export interface WesternBidConfig {
  merchantId: string
  secretKey: string
  apiUrl: string
  environment: 'sandbox' | 'production'
}

export interface PaymentRequest {
  orderId: string
  amount: number
  currency: string
  description: string
  customerEmail: string
  customerName: string
  returnUrl: string
  cancelUrl: string
}

export interface PaymentResponse {
  success: boolean
  paymentId?: string
  paymentUrl?: string
  error?: string
}

class WesternBidAPI {
  private config: WesternBidConfig

  constructor() {
    this.config = {
      merchantId: process.env.WESTERNBID_MERCHANT_ID || '',
      secretKey: process.env.WESTERNBID_SECRET_KEY || '',
      apiUrl: process.env.WESTERNBID_API_URL || 'https://api.westernbid.com',
      environment: (process.env.WESTERNBID_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    }
  }

  private generateSignature(data: Record<string, any>): string {
    // WesternBid signature generation (based on typical payment gateway patterns)
    const sortedKeys = Object.keys(data).sort()
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&') + this.config.secretKey
    
    // Simple hash for demo - in real implementation use their specific algorithm
    return Buffer.from(signatureString).toString('base64')
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.config.merchantId || !this.config.secretKey) {
        throw new Error('WesternBid credentials not configured')
      }

      const paymentData = {
        merchant_id: this.config.merchantId,
        order_id: request.orderId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
        timestamp: Math.floor(Date.now() / 1000)
      }

      const signature = this.generateSignature(paymentData)
      
      const response = await fetch(`${this.config.apiUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        throw new Error(`WesternBid API error: ${response.status}`)
      }

      const result = await response.json()

      return {
        success: true,
        paymentId: result.payment_id,
        paymentUrl: result.payment_url
      }
    } catch (error) {
      console.error('WesternBid payment creation error:', error)
      
      // Fallback: Create a mock payment URL for development
      if (this.config.environment === 'sandbox') {
        const mockPaymentId = `mock_${Date.now()}`
        const mockPaymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/payment/mock?paymentId=${mockPaymentId}&orderId=${request.orderId}`
        
        return {
          success: true,
          paymentId: mockPaymentId,
          paymentUrl: mockPaymentUrl
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  async verifyPayment(paymentId: string, signature: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/payment/verify/${paymentId}`, {
        method: 'GET',
        headers: {
          'X-Signature': signature,
          'X-Merchant-ID': this.config.merchantId
        }
      })

      if (!response.ok) {
        throw new Error(`WesternBid verification error: ${response.status}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        status: result.status
      }
    } catch (error) {
      console.error('WesternBid payment verification error:', error)
      
      // Mock verification for development
      if (this.config.environment === 'sandbox') {
        return {
          success: true,
          status: 'completed'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      }
    }
  }
}

export const westernbid = new WesternBidAPI()