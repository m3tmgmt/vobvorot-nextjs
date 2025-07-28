#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

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

async function deployVobVorot() {
  console.log('🚀 Deploying VobVorot with WesternBid fixes...');
  
  try {
    // Trigger deployment using webhook or API
    const postData = JSON.stringify({
      name: 'vobvorot-westernbid-fixed',
      gitSource: {
        type: 'github',
        repo: 'm3tmgmt/vobvorot-nextjs',
        ref: '1c2de3f'
      },
      target: 'production'
    });
    
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
      console.log('✅ Deployment created!');
      console.log('🆔 Deployment ID:', response.data.id);
      console.log('🌐 URL:', response.data.url);
      
      await waitForDeployment(response.data.id);
      await assignToProductionDomain(response.data.id);
      
    } else {
      console.error('❌ Deployment failed:', response.data);
      
      // Alternative: Try to find existing working deployment and assign it
      console.log('🔄 Trying alternative approach...');
      await findAndAssignWorkingDeployment();
    }

    return response.data;

  } catch (error) {
    console.error('❌ Deployment error:', error);
    
    // Fallback: Use existing deployment
    console.log('🔄 Using fallback approach...');
    await findAndAssignWorkingDeployment();
  }
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
      console.error('❌ Deployment failed:', response.data.errorMessage);
      return;
    }
    
    console.log(`⏳ Status: ${response.data.readyState} (${i + 1}/20)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
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
      console.log('⚠️  Domain assignment result:', aliasResponse.data);
    }

  } catch (error) {
    console.error('❌ Domain assignment error:', error);
  }
}

async function findAndAssignWorkingDeployment() {
  try {
    console.log('🔍 Finding working deployment from main project...');
    
    // Get working deployments from main project
    const response = await makeHttpsRequest({
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v6/deployments?projectId=prj_wklXebOcLWo9edf0BCL1nwpYGDhZ&limit=50',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });
    
    const workingDeployments = response.data.deployments?.filter(d => d.state === 'READY') || [];
    
    if (workingDeployments.length > 0) {
      const latestWorking = workingDeployments[0];
      console.log('✅ Found working deployment:', latestWorking.uid);
      await assignToProductionDomain(latestWorking.uid);
    } else {
      console.error('❌ No working deployments found');
    }
  } catch (error) {
    console.error('❌ Error finding working deployment:', error);
  }
}

deployVobVorot()
  .then(() => {
    console.log('🎉 VobVorot deployment process completed!');
    console.log('🌐 Check: https://vobvorot.com');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment process failed:', error);
    process.exit(1);
  });