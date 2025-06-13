#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const VERCEL_TOKEN = 'yGHkW9HSoepeo4Q8ZnSBEKwn';
const PROJECT_ID = 'prj_wklXebOcLWo9edf0BCL1nwpYGDhZ';

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

async function deployWithFiles() {
  console.log('Starting direct file upload to Vercel...');
  
  const filesToUpload = [
    {
      local: '/Users/matty/exvicpmour-store/vobvorot-nextjs/src/app/api/payment/westernbid/redirect/route.ts',
      remote: 'src/app/api/payment/westernbid/redirect/route.ts'
    },
    {
      local: '/Users/matty/exvicpmour-store/vobvorot-nextjs/src/lib/westernbid.ts', 
      remote: 'src/lib/westernbid.ts'
    },
    {
      local: '/Users/matty/exvicpmour-store/vobvorot-nextjs/public/westernbid-test.html',
      remote: 'public/westernbid-test.html'
    }
  ];

  const fileData = [];
  
  for (const file of filesToUpload) {
    if (fs.existsSync(file.local)) {
      const content = fs.readFileSync(file.local, 'utf8');
      fileData.push({
        file: file.remote,
        data: Buffer.from(content).toString('base64')
      });
      console.log(`✓ Prepared ${file.remote}`);
    } else {
      console.log(`⚠ File not found: ${file.local}`);
    }
  }

  const deploymentPayload = {
    name: 'vobvorot-nextjs',
    files: fileData,
    projectSettings: {
      framework: 'nextjs',
      buildCommand: 'echo "Skipping build - direct file upload"',
      outputDirectory: null
    },
    target: 'production',
    meta: {
      description: 'Direct WesternBid fix upload - bypassing build errors'
    }
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
      console.log('✅ Deployment created successfully!');
      console.log('Deployment ID:', response.data.id);
      console.log('URL:', response.data.url);
      console.log('Status:', response.data.readyState);
      
      // Assign to production domain
      if (response.data.url) {
        await assignProductionDomain(response.data.id);
      }
    } else {
      console.error('❌ Deployment failed:', response.data);
    }

    return response.data;

  } catch (error) {
    console.error('❌ Deployment error:', error);
    throw error;
  }
}

async function assignProductionDomain(deploymentId) {
  try {
    console.log('Assigning to production domain...');
    
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
      console.log('✅ Production domain assigned!');
    } else {
      console.log('⚠ Domain assignment result:', aliasResponse.data);
    }

  } catch (error) {
    console.error('❌ Domain assignment error:', error);
  }
}

// Run the deployment
deployWithFiles()
  .then(() => {
    console.log('🚀 Direct upload completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Direct upload failed:', error);
    process.exit(1);
  });