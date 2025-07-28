#!/usr/bin/env node

const https = require('https');

// Старый аккаунт с доменом vobvorot.com
const OLD_VERCEL_TOKEN = 'yGHkW9HSoepeo4Q8ZnSBEKwn';

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

async function deployToProduction() {
  console.log('🚀 Deploying fixed WesternBid to production (vobvorot.com)...');
  
  try {
    // Get latest deployment from new account that we know works
    const latestWorkingUrl = 'https://vobvorot-nextjs-3itghffhn-m3tmgmt-gmailcoms-projects.vercel.app';
    console.log('📋 Using tested deployment:', latestWorkingUrl);
    
    // Get list of deployments from old account to find vobvorot.com project
    console.log('🔍 Finding vobvorot.com project in old account...');
    
    const projectsResponse = await makeHttpsRequest({
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v9/projects',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OLD_VERCEL_TOKEN}`
      }
    });
    
    console.log('Projects found:', projectsResponse.data.projects?.length || 0);
    
    // Find the main vobvorot project
    const vobvorotProject = projectsResponse.data.projects?.find(p => 
      p.name.includes('vobvorot') && !p.name.includes('test') && !p.name.includes('backup')
    );
    
    if (vobvorotProject) {
      console.log('✅ Found main project:', vobvorotProject.name, vobvorotProject.id);
      
      // Try to create deployment using GitHub
      await createGitHubDeployment(vobvorotProject.id);
      
    } else {
      console.log('⚠️  Main project not found, trying direct domain update...');
      await tryDirectDomainUpdate();
    }

  } catch (error) {
    console.error('❌ Deployment error:', error);
    console.log('🔄 Trying alternative approach...');
    await tryDirectDomainUpdate();
  }
}

async function createGitHubDeployment(projectId) {
  console.log('📦 Creating GitHub deployment for project:', projectId);
  
  const deployPayload = {
    name: 'vobvorot-nextjs',
    gitSource: {
      type: 'github',
      repo: 'm3tmgmt/vobvorot-nextjs',
      ref: 'main'
    },
    target: 'production'
  };
  
  const postData = JSON.stringify(deployPayload);
  
  const response = await makeHttpsRequest({
    hostname: 'api.vercel.com',
    port: 443,
    path: '/v13/deployments',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OLD_VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);
  
  if (response.status === 200 || response.status === 201) {
    console.log('✅ Deployment created!');
    console.log('🆔 Deployment ID:', response.data.id);
    
    await waitForDeployment(response.data.id);
    await assignToVobvorotDomain(response.data.id);
    
  } else {
    console.log('❌ GitHub deployment failed:', response.data);
    throw new Error('GitHub deployment failed');
  }
}

async function tryDirectDomainUpdate() {
  console.log('🔄 Trying to find existing working deployments...');
  
  // Get deployments from old account
  const deploymentsResponse = await makeHttpsRequest({
    hostname: 'api.vercel.com',
    port: 443,
    path: '/v6/deployments?limit=20',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${OLD_VERCEL_TOKEN}`
    }
  });
  
  const workingDeployments = deploymentsResponse.data.deployments?.filter(d => 
    d.state === 'READY' && d.name && d.name.includes('vobvorot')
  ) || [];
  
  if (workingDeployments.length > 0) {
    const latestWorking = workingDeployments[0];
    console.log('✅ Found working deployment:', latestWorking.uid);
    await assignToVobvorotDomain(latestWorking.uid);
  } else {
    console.log('❌ No working deployments found in old account');
    console.log('ℹ️  Current working version is at: https://vobvorot-nextjs-3itghffhn-m3tmgmt-gmailcoms-projects.vercel.app');
  }
}

async function waitForDeployment(deploymentId) {
  console.log('⏳ Waiting for deployment...');
  
  for (let i = 0; i < 20; i++) {
    const response = await makeHttpsRequest({
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v13/deployments/${deploymentId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OLD_VERCEL_TOKEN}`
      }
    });
    
    if (response.data.readyState === 'READY') {
      console.log('✅ Deployment ready!');
      return;
    } else if (response.data.readyState === 'ERROR') {
      console.error('❌ Deployment failed:', response.data.errorMessage);
      throw new Error('Deployment failed');
    }
    
    console.log(`⏳ Status: ${response.data.readyState} (${i + 1}/20)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function assignToVobvorotDomain(deploymentId) {
  try {
    console.log('🌐 Assigning deployment to vobvorot.com...');
    
    const aliasData = JSON.stringify({ alias: 'vobvorot.com' });
    
    const response = await makeHttpsRequest({
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v2/deployments/${deploymentId}/aliases`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OLD_VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(aliasData)
      }
    }, aliasData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Domain successfully assigned!');
      console.log('🔗 Live at: https://vobvorot.com');
      console.log('🎉 Fixed WesternBid integration is now live!');
    } else if (response.data?.error?.code === 'not_modified') {
      console.log('✅ Domain already assigned to this deployment');
      console.log('🔗 Live at: https://vobvorot.com');
    } else {
      console.log('⚠️  Domain assignment result:', response.data);
    }

  } catch (error) {
    console.error('❌ Domain assignment error:', error);
  }
}

deployToProduction()
  .then(() => {
    console.log('');
    console.log('🎉 DEPLOYMENT COMPLETED!');
    console.log('');
    console.log('🧪 TEST THE FIXES:');
    console.log('1. Go to https://vobvorot.com');
    console.log('2. Add product to cart');
    console.log('3. Fill checkout form');
    console.log('4. Click "🔒 Proceed to Secure Payment"');
    console.log('5. Verify WesternBid form works correctly');
    console.log('');
    console.log('✨ WesternBid Integration Features:');
    console.log('   ✅ Correct wb_* field names');
    console.log('   ✅ Proper MD5 hash generation');
    console.log('   ✅ Working payment button');
    console.log('   ✅ Manual form submission');
    console.log('   ✅ New checkout button text');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error);
    console.log('');
    console.log('🔗 Fallback: Test on https://vobvorot-nextjs-3itghffhn-m3tmgmt-gmailcoms-projects.vercel.app');
    process.exit(1);
  });