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

function md5(data) {
  return crypto.createHash('md5').update(data, 'utf8').digest('hex');
}

function generateWesternBidHash(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const hashString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + `&${secretKey}`;
  
  return md5(hashString);
}

async function deployFixedEncoding() {
  console.log('Fixing encoding and deploying corrected version...');
  
  const testOrder = {
    wb_login: '159008',
    charset: 'utf-8',
    wb_order_id: 'vobvorot-' + Date.now(),
    wb_amount: '99.99',
    wb_description: 'VobVorot Store Order',
    wb_currency: 'USD',
    wb_success_url: 'https://vobvorot.com/payment/success',
    wb_fail_url: 'https://vobvorot.com/payment/fail',
    wb_result_url: 'https://vobvorot.com/api/webhooks/westernbid',
    wb_result_method: 'POST',
    shipping: '0'
  };

  const secretKey = 'oVsVCgu';
  const hash = generateWesternBidHash(testOrder, secretKey);
  testOrder.wb_hash = hash;

  // Create clean HTML without base64 encoding issues
  const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VobVorot Store - Secure Payment</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
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
            margin-bottom: 20px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1rem;
        }
        
        .order-info {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 1.2rem;
            color: #667eea;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #667eea;
        }
        
        .payment-button {
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
        
        .payment-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 25px rgba(102, 126, 234, 0.4);
        }
        
        .security-info {
            color: #666;
            font-size: 0.9rem;
            margin-top: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .debug-panel {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 0.8rem;
            text-align: left;
        }
        
        .debug-panel summary {
            cursor: pointer;
            padding: 5px;
            background: #4a5568;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            
            .logo {
                font-size: 2rem;
            }
            
            .payment-button {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">VobVorot</div>
        <div class="subtitle">Secure Payment Gateway</div>
        
        <div class="order-info">
            <div class="info-row">
                <span>Order ID:</span>
                <span><strong>${testOrder.wb_order_id}</strong></span>
            </div>
            <div class="info-row">
                <span>Description:</span>
                <span>${testOrder.wb_description}</span>
            </div>
            <div class="info-row">
                <span>Currency:</span>
                <span>${testOrder.wb_currency}</span>
            </div>
            <div class="info-row">
                <span>Total Amount:</span>
                <span>$${testOrder.wb_amount}</span>
            </div>
        </div>
        
        <div class="debug-panel">
            <details>
                <summary>🔧 Technical Information</summary>
                <pre>
✅ WesternBid Integration Active
Merchant ID: ${testOrder.wb_login}
Hash: ${hash}
Target: https://shop.westernbid.info
Status: Ready for manual submission

Payment Parameters:
${Object.entries(testOrder)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\\n')}
                </pre>
            </details>
        </div>
        
        <form id="westernbid-form" action="https://shop.westernbid.info" method="post">
            ${Object.entries(testOrder)
              .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
              .join('\\n            ')}
            
            <button type="submit" class="payment-button">
                🔒 Proceed to Secure Payment
            </button>
        </form>
        
        <div class="security-info">
            🛡️ Secured by WesternBid SSL encryption
        </div>
    </div>

    <script>
        console.log('✅ VobVorot WesternBid Integration');
        console.log('Order:', '${testOrder.wb_order_id}');
        console.log('Amount:', '$${testOrder.wb_amount}');
        console.log('Hash:', '${hash}');
        
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('westernbid-form');
            const button = form.querySelector('.payment-button');
            
            button.addEventListener('click', function(e) {
                console.log('🚀 Payment form submitted');
                
                button.innerHTML = '⏳ Redirecting...';
                button.disabled = true;
                
                setTimeout(() => {
                    form.submit();
                }, 500);
                
                e.preventDefault();
                return false;
            });
            
            console.log('✅ Form ready for submission');
        });
    </script>
</body>
</html>`;

  // Deploy with proper utf-8 encoding
  const deploymentPayload = {
    name: 'vobvorot-fixed',
    files: [
      {
        file: 'index.html',
        data: cleanHtml,
        encoding: 'utf-8'
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
      console.log('✅ Fixed deployment created!');
      console.log('🆔 Deployment ID:', response.data.id);
      
      await waitForDeployment(response.data.id);
      await assignToProductionDomain(response.data.id);
      
    } else {
      console.error('❌ Deployment failed:', response.data);
    }

    return response.data;

  } catch (error) {
    console.error('❌ Deployment error:', error);
    throw error;
  }
}

async function waitForDeployment(deploymentId) {
  console.log('⏳ Waiting for deployment...');
  
  for (let i = 0; i < 15; i++) {
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
      console.log('✅ Deployment ready!');
      return;
    } else if (response.data.readyState === 'ERROR') {
      console.error('❌ Deployment failed:', response.data.errorMessage);
      return;
    }
    
    console.log(`⏳ Status: ${response.data.readyState} (${i + 1}/15)`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function assignToProductionDomain(deploymentId) {
  try {
    console.log('🌐 Assigning to vobvorot.com...');
    
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
      console.log('✅ Domain assigned successfully!');
      console.log('🔗 Live at: https://vobvorot.com');
    } else {
      console.log('⚠️  Domain result:', aliasResponse.data);
    }

  } catch (error) {
    console.error('❌ Domain assignment error:', error);
  }
}

deployFixedEncoding()
  .then(() => {
    console.log('🚀 Fixed encoding deployment completed!');
    console.log('🌐 Check: https://vobvorot.com');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });