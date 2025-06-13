#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

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

async function deployStaticFiles() {
  console.log('Creating static deployment...');
  
  // Create a simple static HTML file that will test WesternBid
  const staticHtml = `<!DOCTYPE html>
<html>
<head>
    <title>WesternBid Test - vobvorot.com</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>WesternBid Payment Test</h1>
    <p>This page confirms the deployment is working.</p>
    
    <form id="westernbid-form" action="https://shop.westernbid.info" method="post">
        <input type="hidden" name="charset" value="utf-8">
        <input type="hidden" name="wb_login" value="159008">
        <input type="hidden" name="wb_hash" value="" id="wb_hash">
        <input type="hidden" name="wb_order_id" value="test-order-123">
        <input type="hidden" name="wb_amount" value="100">
        <input type="hidden" name="wb_description" value="Test payment">
        <input type="hidden" name="wb_currency" value="USD">
        <input type="hidden" name="wb_success_url" value="https://vobvorot.com/success">
        <input type="hidden" name="wb_fail_url" value="https://vobvorot.com/fail">
        <input type="hidden" name="wb_result_url" value="https://vobvorot.com/result">
        <input type="hidden" name="wb_result_method" value="POST">
        <input type="hidden" name="shipping" value="0">
        
        <button type="submit" style="padding: 10px 20px; font-size: 16px;">
            Test WesternBid Payment
        </button>
    </form>

    <script>
        // Calculate hash for test order
        const params = {
            charset: 'utf-8',
            wb_login: '159008',
            wb_order_id: 'test-order-123',
            wb_amount: '100',
            wb_description: 'Test payment',
            wb_currency: 'USD',
            wb_success_url: 'https://vobvorot.com/success',
            wb_fail_url: 'https://vobvorot.com/fail',
            wb_result_url: 'https://vobvorot.com/result',
            wb_result_method: 'POST',
            shipping: '0'
        };
        
        // This is a test - in production, hash should be calculated server-side
        console.log('WesternBid form ready for manual submission');
        console.log('Parameters:', params);
        
        // For testing, we'll generate a simple hash (in production this should be MD5)
        const hashInput = Object.keys(params)
            .sort()
            .map(key => key + '=' + params[key])
            .join('&') + '&oVsVCgu';
        
        console.log('Hash input:', hashInput);
        document.getElementById('wb_hash').value = 'test-hash-' + Date.now();
    </script>
</body>
</html>`;

  const deploymentPayload = {
    name: 'vobvorot-static-test',
    files: [
      {
        file: 'index.html',
        data: Buffer.from(staticHtml).toString('base64')
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
      console.log('✅ Static deployment created successfully!');
      console.log('Deployment ID:', response.data.id);
      console.log('URL:', response.data.url);
      console.log('Status:', response.data.readyState);
      
      // Wait for deployment to be ready
      await waitForDeployment(response.data.id);
      
    } else {
      console.error('❌ Static deployment failed:', response.data);
    }

    return response.data;

  } catch (error) {
    console.error('❌ Static deployment error:', error);
    throw error;
  }
}

async function waitForDeployment(deploymentId) {
  console.log('Waiting for deployment to be ready...');
  
  for (let i = 0; i < 30; i++) {
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
      console.log('🌐 URL:', response.data.url);
      return;
    } else if (response.data.readyState === 'ERROR') {
      console.error('❌ Deployment failed:', response.data.errorMessage);
      return;
    }
    
    console.log(`⏳ Status: ${response.data.readyState || 'BUILDING'} (${i + 1}/30)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('⚠️  Deployment timeout - check manually');
}

// Run the static deployment
deployStaticFiles()
  .then(() => {
    console.log('🚀 Static deployment completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Static deployment failed:', error);
    process.exit(1);
  });