import { NextRequest, NextResponse } from 'next/server'
import { westernbid } from '@/lib/westernbid'

export async function GET(request: NextRequest) {
  try {
    // Test payment configuration
    const testPaymentRequest = {
      orderId: `TEST-SIGN-${Date.now()}`,
      amount: 50,
      currency: 'USD',
      description: 'Test Sign Photo Payment',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?type=test`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel?type=test`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        orderType: 'test_sign_photo'
      }
    }

    // Try to create payment
    const paymentResult = await westernbid.createPayment(testPaymentRequest)
    
    return NextResponse.json({
      success: true,
      config: {
        merchantId: process.env.WESTERNBID_MERCHANT_ID,
        apiUrl: process.env.WESTERNBID_API_URL,
        environment: process.env.WESTERNBID_ENVIRONMENT
      },
      testRequest: testPaymentRequest,
      paymentResult: paymentResult
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}