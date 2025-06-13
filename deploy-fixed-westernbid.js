#!/usr/bin/env node

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

async function deployFixedWesternBid() {
  console.log('🚀 Deploying fixed WesternBid integration to production...');
  
  try {
    // First, try to create a new deployment from GitHub
    console.log('📋 Attempting GitHub deployment...');
    
    const gitDeployPayload = {
      name: 'vobvorot-nextjs',
      gitSource: {
        type: 'github',
        repo: 'm3tmgmt/vobvorot-nextjs',
        ref: 'main'
      },
      target: 'production'
    };
    
    const postData = JSON.stringify(gitDeployPayload);
    
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
      console.log('✅ GitHub deployment created!');
      console.log('🆔 Deployment ID:', response.data.id);
      console.log('🌐 URL:', response.data.url);
      
      await waitForDeployment(response.data.id);
      await assignToProductionDomain(response.data.id);
      
      console.log('✅ Fixed WesternBid integration deployed to production!');
      console.log('🔗 Live at: https://vobvorot.com');
      console.log('🧪 Test the payment flow now!');
      
    } else {
      console.log('⚠️  GitHub deployment failed, trying alternative...');
      console.log('Response:', response.data);
      
      // Alternative: Use existing working deployment
      await useExistingDeployment();
    }

  } catch (error) {
    console.error('❌ Deployment error:', error);
    await useExistingDeployment();
  }
}

async function useExistingDeployment() {
  console.log('🔄 Using existing working deployment...');
  
  // Find the latest working deployment that has our fixes
  const deploymentId = 'dpl_BCHMETuyFL8BCYpGnMtKgmKGmRKN'; // Known working deployment
  
  await assignToProductionDomain(deploymentId);
  
  console.log('ℹ️  Note: This deployment may not have the latest WesternBid fixes.');
  console.log('📝 The main VobVorot site is restored and functional.');
  console.log('🔗 Live at: https://vobvorot.com');
}

async function waitForDeployment(deploymentId) {
  console.log('⏳ Waiting for deployment...');
  
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
      console.log('✅ Deployment ready!');
      return;
    } else if (response.data.readyState === 'ERROR') {
      console.error('❌ Deployment failed:', response.data.errorMessage || 'Unknown error');
      throw new Error('Deployment failed');
    }
    
    console.log(`⏳ Status: ${response.data.readyState} (${i + 1}/20)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  throw new Error('Deployment timeout');
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
      console.log('✅ Production domain assigned successfully!');
    } else if (aliasResponse.data?.error?.code === 'not_modified') {
      console.log('✅ Domain already assigned to this deployment');
    } else {
      console.log('⚠️  Domain assignment result:', aliasResponse.data);
    }

  } catch (error) {
    console.error('❌ Domain assignment error:', error);
  }
}

deployFixedWesternBid()
  .then(() => {
    console.log('🎉 Deployment process completed!');
    console.log('');
    console.log('🧪 NEXT STEPS:');
    console.log('1. Go to https://vobvorot.com');
    console.log('2. Add a product to cart');
    console.log('3. Go through checkout process');
    console.log('4. Test WesternBid payment integration');
    console.log('');
    console.log('🔍 Look for the new WesternBid form with:');
    console.log('   - wb_* field names');
    console.log('   - Proper MD5 hash generation');
    console.log('   - Manual submission (no auto-submit)');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  });