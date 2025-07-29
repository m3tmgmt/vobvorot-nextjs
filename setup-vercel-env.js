const https = require('https');

// Vercel API configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || ''; // You need to set this
const PROJECT_ID = 'prj_wklXebOcLWo9edf0BCL1nwpYGDhZ';
const TEAM_ID = 'team_nSRca2Z24nnRyQhfM5SRLPgv';

async function getEnvironmentVariables() {
  console.log('📋 Getting current environment variables from Vercel...\n');
  
  const options = {
    hostname: 'api.vercel.com',
    path: `/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          resolve(result.envs);
        } else {
          console.error('Error:', res.statusCode, data);
          reject(new Error(`Failed to get env vars: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function createOrUpdateEnvVariable(key, value, target = ['production', 'preview', 'development']) {
  console.log(`\n🔧 Setting ${key} for targets: ${target.join(', ')}`);
  
  const data = JSON.stringify({
    key,
    value,
    target,
    type: 'encrypted'
  });

  const options = {
    hostname: 'api.vercel.com',
    path: `/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✅ ${key} set successfully`);
          resolve(true);
        } else {
          console.error('Error:', res.statusCode, responseData);
          reject(new Error(`Failed to set ${key}: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function deleteEnvVariable(envId) {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v10/projects/${PROJECT_ID}/env/${envId}?teamId=${TEAM_ID}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`Failed to delete env: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN not set!');
    console.log('\nTo get your Vercel token:');
    console.log('1. Go to https://vercel.com/account/tokens');
    console.log('2. Create a new token');
    console.log('3. Run: export VERCEL_TOKEN="your_token_here"');
    console.log('4. Run this script again\n');
    return;
  }

  try {
    // Get current environment variables
    const envVars = await getEnvironmentVariables();
    
    console.log('Current environment variables:');
    envVars.forEach(env => {
      if (env.key === 'TELEGRAM_WEBHOOK_SECRET') {
        console.log(`- ${env.key}: ${env.value.substring(0, 10)}... (${env.target.join(', ')})`);
      }
    });

    // Check if TELEGRAM_WEBHOOK_SECRET exists
    const webhookSecretVar = envVars.find(env => env.key === 'TELEGRAM_WEBHOOK_SECRET');
    
    if (webhookSecretVar) {
      console.log('\n⚠️  TELEGRAM_WEBHOOK_SECRET already exists');
      console.log('Value starts with:', webhookSecretVar.value.substring(0, 10) + '...');
      console.log('Targets:', webhookSecretVar.target.join(', '));
      
      // Delete existing variable
      console.log('\n🗑️  Deleting existing variable...');
      await deleteEnvVariable(webhookSecretVar.id);
    }

    // Set the correct value
    console.log('\n📝 Setting TELEGRAM_WEBHOOK_SECRET...');
    await createOrUpdateEnvVariable(
      'TELEGRAM_WEBHOOK_SECRET',
      'vobvorot_webhook_secret_2025',
      ['production', 'preview', 'development']
    );

    console.log('\n✅ Environment variable setup complete!');
    console.log('\n⚠️  Note: You may need to redeploy for changes to take effect.');
    console.log('Run: vercel --prod\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Manual instructions if script can't be run
console.log('📝 MANUAL SETUP INSTRUCTIONS:');
console.log('================================\n');
console.log('If you prefer to set up manually via Vercel Dashboard:');
console.log('1. Go to: https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs/settings/environment-variables');
console.log('2. Add new variable:');
console.log('   - Name: TELEGRAM_WEBHOOK_SECRET');
console.log('   - Value: vobvorot_webhook_secret_2025');
console.log('   - Environment: Production, Preview, Development');
console.log('3. Save and redeploy\n');

console.log('Or use Vercel CLI:');
console.log('vercel env add TELEGRAM_WEBHOOK_SECRET production');
console.log('(then enter: vobvorot_webhook_secret_2025)\n');

console.log('================================\n');

// Only run if VERCEL_TOKEN is provided
if (process.argv[2] === '--run') {
  main();
}