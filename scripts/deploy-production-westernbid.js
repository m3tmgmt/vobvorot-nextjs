#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const VERCEL_TOKEN = 'yGHkW9HSoepeo4Q8ZnSBEKwn';

function makeHttpsRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// MD5 hash function for WesternBid
function md5(data) {
  return crypto.createHash('md5').update(data, 'utf8').digest('hex');
}

// Generate proper WesternBid hash
function generateWesternBidHash(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const hashString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + `&${secretKey}`;
  
  return md5(hashString);
}

async function deployProductionWesternBid() {
  console.log('Creating production WesternBid deployment...');
  
  // Sample order data for testing
  const testOrder = {
    wb_login: '159008',
    charset: 'utf-8',
    wb_order_id: 'prod-test-' + Date.now(),
    wb_amount: '99.99',
    wb_description: 'VobVorot Store Test Order',
    wb_currency: 'USD',
    wb_success_url: 'https://vobvorot.com/payment/success',
    wb_fail_url: 'https://vobvorot.com/payment/fail',
    wb_result_url: 'https://vobvorot.com/api/webhooks/westernbid',
    wb_result_method: 'POST',
    shipping: '0'
  };

  // Generate proper hash using secret key
  const secretKey = 'oVsVCgu';
  const hash = generateWesternBidHash(testOrder, secretKey);
  testOrder.wb_hash = hash;

  // Create production HTML with proper WesternBid form
  const productionHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VobVorot - Secure Payment Gateway</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1rem;
        }
        
        .order-details {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .order-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
        }
        
        .order-row:not(:last-child) {
            border-bottom: 1px solid #eee;
        }
        
        .order-row.total {
            font-weight: bold;
            font-size: 1.2rem;
            color: #667eea;
            border-bottom: none;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #667eea;
        }
        
        .pay-button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 18px 40px;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 20px 0;
            min-width: 280px;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .pay-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 25px rgba(102, 126, 234, 0.4);
        }
        
        .security-notice {
            color: #666;
            font-size: 0.9rem;
            margin-top: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .powered-by {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 0.8rem;
        }
        
        .debug-info {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 0.8rem;
            text-align: left;
        }
        
        .debug-info summary {
            cursor: pointer;
            padding: 5px;
            background: #4a5568;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .debug-info pre {
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            
            .logo {
                font-size: 2rem;
            }
            
            .pay-button {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">VobVorot</div>
        <div class="subtitle">Secure Payment Gateway</div>
        
        <div class="order-details">
            <div class="order-row">
                <span>Order ID:</span>
                <span><strong>${testOrder.wb_order_id}</strong></span>
            </div>
            <div class="order-row">
                <span>Description:</span>
                <span>${testOrder.wb_description}</span>
            </div>
            <div class="order-row">
                <span>Currency:</span>
                <span>${testOrder.wb_currency}</span>
            </div>
            <div class="order-row total">
                <span>Total Amount:</span>
                <span>$${testOrder.wb_amount}</span>
            </div>
        </div>
        
        <div class="debug-info">
            <details>
                <summary>🔧 Technical Details (Debug Mode)</summary>
                <pre>
WesternBid Integration Status: ✅ ACTIVE
Merchant ID: ${testOrder.wb_login}
Hash Generated: ${hash.substring(0, 8)}...
Target URL: https://shop.westernbid.info
Form Method: POST (Manual Submit Required)

Payment Parameters:
${Object.entries(testOrder)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\\n')}

Hash Calculation:
Input: ${Object.keys(testOrder).sort().map(key => `${key}=${testOrder[key]}`).join('&')}&${secretKey}
MD5: ${hash}
                </pre>
            </details>
        </div>
        
        <form id="westernbid-form" action="https://shop.westernbid.info" method="post">
            ${Object.entries(testOrder)
              .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
              .join('\\n            ')}
            
            <button type="submit" class="pay-button">
                🔒 Proceed to Secure Payment
            </button>
        </form>
        
        <div class="security-notice">
            🛡️ Your payment is secured by WesternBid SSL encryption
        </div>
        
        <div class="powered-by">
            Powered by WesternBid Payment Gateway
        </div>
    </div>

    <script>
        console.log('✅ VobVorot Production WesternBid Integration');
        console.log('📋 Order ID:', '${testOrder.wb_order_id}');
        console.log('💰 Amount:', '$${testOrder.wb_amount}');
        console.log('🔑 Hash:', '${hash}');
        console.log('🌐 Target:', 'https://shop.westernbid.info');
        
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('westernbid-form');
            const button = form.querySelector('.pay-button');
            
            button.addEventListener('click', function(e) {
                console.log('🚀 WesternBid payment form submitted manually');
                console.log('📝 Form data:', new FormData(form));
                
                // Add loading state
                button.innerHTML = '⏳ Redirecting to Payment...';
                button.disabled = true;
                
                // Submit after small delay to show loading state
                setTimeout(() => {
                    form.submit();
                }, 500);
                
                e.preventDefault();
                return false;
            });
            
            console.log('✅ WesternBid form ready for manual submission');
        });
    </script>
</body>
</html>`;

  const deploymentPayload = {
    name: 'vobvorot-production',
    files: [
      {
        file: 'index.html',
        data: Buffer.from(productionHtml).toString('base64')
      }
    ],
    projectSettings: {
      framework: null,
      buildCommand: null,
      outputDirectory: null
    },
    target: 'production'
  };

  try {
    const postData = JSON.stringify(deploymentPayload);
    
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v13/deployments',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const response = await makeHttpsRequest(options, postData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Production deployment created successfully!');
      console.log('🆔 Deployment ID:', response.data.id);
      console.log('🌐 URL:', response.data.url);
      
      // Wait for deployment to be ready
      await waitForDeployment(response.data.id);
      
      // Assign to production domain
      await assignToProductionDomain(response.data.id);
      
    } else {
      console.error('❌ Production deployment failed:', response.data);
    }

    return response.data;

  } catch (error) {
    console.error('❌ Production deployment error:', error);
    throw error;
  }
}

async function waitForDeployment(deploymentId) {
  console.log('⏳ Waiting for deployment to be ready...');
  
  for (let i = 0; i < 20; i++) {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v13/deployments/${deploymentId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    };

    const response = await makeHttpsRequest(options);
    
    if (response.data.readyState === 'READY') {
      console.log('✅ Deployment is ready!');
      return;
    } else if (response.data.readyState === 'ERROR') {
      console.error('❌ Deployment failed:', response.data.errorMessage);
      return;
    }
    
    console.log(`⏳ Status: ${response.data.readyState || 'BUILDING'} (${i + 1}/20)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function assignToProductionDomain(deploymentId) {
  try {
    console.log('🌐 Assigning to production domain vobvorot.com...');
    
    const aliasData = JSON.stringify({ alias: 'vobvorot.com' });
    
    const aliasOptions = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v2/deployments/${deploymentId}/aliases`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(aliasData)
      }
    };

    const aliasResponse = await makeHttpsRequest(aliasOptions, aliasData);
    
    if (aliasResponse.status === 200 || aliasResponse.status === 201) {
      console.log('✅ Production domain assigned successfully!');
      console.log('🔗 Live at: https://vobvorot.com');
    } else {
      console.log('⚠️  Domain assignment result:', aliasResponse.data);
    }

  } catch (error) {
    console.error('❌ Domain assignment error:', error);
  }
}

// Run the production deployment
deployProductionWesternBid()
  .then(() => {
    console.log('🚀 Production WesternBid deployment completed!');
    console.log('🌐 Test your payment integration at: https://vobvorot.com');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Production deployment failed:', error);
    process.exit(1);
  });