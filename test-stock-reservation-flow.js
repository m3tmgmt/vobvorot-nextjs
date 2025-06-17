// Test script for stock reservation flow
// Run with: node test-stock-reservation-flow.js

async function testStockReservationFlow() {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  console.log('🔄 Testing Stock Reservation Flow...')
  console.log(`Testing against: ${BASE_URL}`)
  
  try {
    // Step 1: Test order creation with stock reservation
    console.log('\n1️⃣ Testing order creation with stock reservation...')
    
    const orderResponse = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shippingInfo: {
          email: 'test@example.com',
          phone: '+1234567890',
          country: 'US',
          state: 'CA'
        },
        paymentInfo: {
          method: 'westernbid_stripe'
        },
        items: [
          {
            product: {
              id: 'test-product-id',
              name: 'Test Product',
              price: 29.99,
              images: [{ url: '/test.jpg', alt: 'Test' }]
            },
            quantity: 1,
            selectedSize: 'M',
            selectedColor: 'Blue'
          }
        ],
        subtotal: 29.99,
        shippingCost: 5.00,
        tax: 0,
        total: 34.99
      })
    })
    
    const orderResult = await orderResponse.json()
    
    if (orderResponse.ok) {
      console.log('✅ Order created successfully:', orderResult.orderNumber)
      console.log('💰 Payment URL generated:', !!orderResult.paymentUrl)
      
      // Step 2: Test stock availability after reservation
      console.log('\n2️⃣ Testing stock availability after reservation...')
      
      const productsResponse = await fetch(`${BASE_URL}/api/products`)
      const products = await productsResponse.json()
      
      console.log('📦 Products with stock info fetched')
      
      // Step 3: Test cleanup endpoint
      console.log('\n3️⃣ Testing manual cleanup of expired reservations...')
      
      const cleanupResponse = await fetch(`${BASE_URL}/api/cron/cleanup-reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`
        }
      })
      
      if (cleanupResponse.ok) {
        const cleanupResult = await cleanupResponse.json()
        console.log('✅ Cleanup test successful:', cleanupResult)
      } else {
        console.log('⚠️ Cleanup test response:', cleanupResponse.status)
      }
      
    } else if (orderResult.error === 'Insufficient stock') {
      console.log('✅ Stock validation working - insufficient stock detected')
      console.log('📦 Insufficient items:', orderResult.insufficientStock)
    } else {
      console.log('❌ Order creation failed:', orderResult)
    }
    
    // Step 4: Test webhook simulation (payment completion)
    console.log('\n4️⃣ Testing webhook simulation...')
    
    const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/westernbid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_status: 'completed',
        custom: orderResult.orderNumber || 'TEST-ORDER',
        amount: '34.99',
        currency: 'USD',
        transaction_id: 'test_transaction_123',
        payer_email: 'test@example.com',
        payer_name: 'Test Customer'
      })
    })
    
    if (webhookResponse.ok) {
      const webhookResult = await webhookResponse.json()
      console.log('✅ Webhook simulation successful:', webhookResult.message)
    } else {
      console.log('⚠️ Webhook simulation response:', webhookResponse.status)
    }
    
    console.log('\n🎉 Stock reservation flow test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testStockReservationFlow()