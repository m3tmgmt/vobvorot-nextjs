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

async function deployTestPage() {
  console.log('🚀 Deploying WesternBid Test Page...');
  
  // Read the test HTML file
  const testHtml = fs.readFileSync('./test-westernbid.html', 'utf8');
  
  const deploymentPayload = {
    name: 'vobvorot-westernbid-test',
    files: [
      {
        file: 'index.html',
        data: Buffer.from(testHtml).toString('base64')
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
      console.log('✅ Test page deployment created!');
      console.log('🆔 Deployment ID:', response.data.id);
      console.log('🌐 URL:', response.data.url);
      
      await waitForDeployment(response.data.id);
      
      console.log('✅ WesternBid test page is live!');
      console.log('🔗 Test URL:', response.data.url);
      console.log('📝 This page demonstrates the correct WesternBid integration');
      
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

deployTestPage()
  .then(() => {
    console.log('🎉 WesternBid test page deployment completed!');
    console.log('🧪 Use this page to test the WesternBid integration');
    console.log('🔧 Check the Technical Details section for hash generation');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test page deployment failed:', error);
    process.exit(1);
  });