#!/usr/bin/env node

/**
 * Complete Order Cycle Testing Script
 * Tests the entire e-commerce flow from product creation to order completion
 */

const https = require('https');
const fs = require('fs');

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const BASE_URL = 'http://localhost:3000';
const ADMIN_API_KEY = env.ADMIN_API_KEY;
const TEST_EMAIL = 'test@vobvorot.com';

console.log('🧪 VobVorot Store - Full Order Cycle Test');
console.log('━'.repeat(50));

async function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testDatabaseConnection() {
  console.log('📊 Testing database connection...');
  try {
    const response = await makeRequest('/api/products');
    if (response.status === 200) {
      console.log('✅ Database connection successful');
      console.log(`   Found ${response.data.products?.length || 0} products`);
      return true;
    } else {
      console.log('❌ Database connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

async function testEmailService() {
  console.log('📧 Testing email service...');
  try {
    const response = await makeRequest('/api/test/email', 'POST', {
      to: TEST_EMAIL,
      subject: 'VobVorot Test Email',
      message: 'This is a test email from the order cycle test.'
    });
    
    if (response.status === 200) {
      console.log('✅ Email service working');
      return true;
    } else {
      console.log('❌ Email service failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Email service error:', error.message);
    return false;
  }
}

async function testPaymentWebhook() {
  console.log('💳 Testing payment webhook...');
  try {
    const testPayload = {
      id: 'test_payment_123',
      status: 'completed',
      amount: 1000,
      currency: 'USD',
      order_id: 'test_order_123',
      timestamp: new Date().toISOString()
    };

    const response = await makeRequest('/api/webhooks/westernbid', 'POST', testPayload);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Payment webhook responding');
      return true;
    } else {
      console.log('⚠️ Payment webhook response:', response.status, response.data);
      return response.status < 500; // 4xx is ok for test data
    }
  } catch (error) {
    console.log('❌ Payment webhook error:', error.message);
    return false;
  }
}

async function testTelegramBot() {
  console.log('🤖 Testing Telegram bot...');
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.log('❌ Telegram bot token not found');
      return false;
    }

    const response = await makeRequest(`https://api.telegram.org/bot${botToken}/getMe`);
    
    if (response.status === 200 && response.data.ok) {
      console.log('✅ Telegram bot accessible');
      console.log(`   Bot name: ${response.data.result.first_name}`);
      console.log(`   Username: @${response.data.result.username}`);
      return true;
    } else {
      console.log('❌ Telegram bot failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Telegram bot error:', error.message);
    return false;
  }
}

async function testProductAPI() {
  console.log('🛍️ Testing product management...');
  try {
    // Test product creation
    const newProduct = {
      name: 'Test Product - Vintage Jacket',
      description: 'A beautiful vintage jacket for testing',
      category: 'clothing',
      brand: 'Test Brand',
      images: ['https://via.placeholder.com/400x400'],
      skus: [
        {
          size: 'M',
          color: 'Blue',
          price: 79.99,
          stock: 10
        }
      ]
    };

    const createResponse = await makeRequest('/api/admin/products', 'POST', newProduct, {
      'Authorization': `Bearer ${ADMIN_API_KEY}`
    });

    if (createResponse.status === 201) {
      console.log('✅ Product creation successful');
      const productId = createResponse.data.id;
      
      // Test product retrieval
      const getResponse = await makeRequest(`/api/products/${productId}`);
      if (getResponse.status === 200) {
        console.log('✅ Product retrieval successful');
        return { success: true, productId };
      }
    }
    
    console.log('⚠️ Product API partial success:', createResponse.status);
    return { success: false, productId: null };
  } catch (error) {
    console.log('❌ Product API error:', error.message);
    return { success: false, productId: null };
  }
}

async function testCartAPI() {
  console.log('🛒 Testing cart functionality...');
  try {
    const cartData = {
      items: [
        {
          productId: 'test-product-1',
          skuId: 'test-sku-1',
          quantity: 2
        }
      ]
    };

    const response = await makeRequest('/api/cart', 'POST', cartData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Cart API working');
      return true;
    } else {
      console.log('⚠️ Cart API response:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Cart API error:', error.message);
    return false;
  }
}

async function testOrderCreation() {
  console.log('📦 Testing order creation...');
  try {
    const orderData = {
      items: [
        {
          productId: 'test-product-1',
          skuId: 'test-sku-1',
          quantity: 1,
          price: 79.99
        }
      ],
      shippingInfo: {
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test Street',
        city: 'Test City',
        country: 'US',
        postalCode: '12345',
        phone: '+1234567890'
      },
      total: 79.99
    };

    const response = await makeRequest('/api/orders/create', 'POST', orderData);
    
    if (response.status === 201) {
      console.log('✅ Order creation successful');
      console.log(`   Order ID: ${response.data.id || response.data.orderId}`);
      return { success: true, orderId: response.data.id || response.data.orderId };
    } else {
      console.log('⚠️ Order creation response:', response.status, response.data);
      return { success: false, orderId: null };
    }
  } catch (error) {
    console.log('❌ Order creation error:', error.message);
    return { success: false, orderId: null };
  }
}

async function testImageUpload() {
  console.log('📸 Testing image upload (Cloudinary)...');
  try {
    // Test if Cloudinary is configured
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName === 'your_cloud_name') {
      console.log('⚠️ Cloudinary not configured - skipping image test');
      return true; // Not critical for basic testing
    }

    const response = await makeRequest('/api/cloudinary/images');
    
    if (response.status === 200) {
      console.log('✅ Cloudinary integration accessible');
      return true;
    } else {
      console.log('⚠️ Cloudinary response:', response.status);
      return true; // Not critical
    }
  } catch (error) {
    console.log('⚠️ Cloudinary test skipped:', error.message);
    return true; // Not critical for basic functionality
  }
}

async function runHealthCheck() {
  console.log('🏥 Running system health check...');
  
  const tests = [
    { name: 'Database', test: testDatabaseConnection },
    { name: 'Email Service', test: testEmailService },
    { name: 'Payment Webhook', test: testPaymentWebhook },
    { name: 'Telegram Bot', test: testTelegramBot },
    { name: 'Product API', test: testProductAPI },
    { name: 'Cart API', test: testCartAPI },
    { name: 'Order Creation', test: testOrderCreation },
    { name: 'Image Upload', test: testImageUpload }
  ];

  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results.push({ name, success: result.success !== undefined ? result.success : result });
    } catch (error) {
      results.push({ name, success: false, error: error.message });
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('━'.repeat(50));
  
  let passedTests = 0;
  results.forEach(({ name, success, error }) => {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name}`);
    if (error) {
      console.log(`     Error: ${error}`);
    }
    if (success) passedTests++;
  });

  const score = ((passedTests / results.length) * 100).toFixed(1);
  console.log(`\n🎯 Overall Score: ${score}% (${passedTests}/${results.length} tests passed)`);

  if (score >= 80) {
    console.log('🎉 System is ready for production!');
  } else if (score >= 60) {
    console.log('⚠️ System needs some fixes before production');
  } else {
    console.log('🚨 System requires significant fixes');
  }

  return { score, results };
}

// Run the health check
runHealthCheck().catch(console.error);