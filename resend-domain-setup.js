#!/usr/bin/env node

/**
 * Autonomous Resend Domain Verification
 * Checks and guides through domain verification in Resend
 */

const https = require('https');

// Load environment variables
const envPath = '.env.local';
const env = {};
try {
  const fs = require('fs');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('❌ Error loading .env.local:', error.message);
  process.exit(1);
}

const RESEND_API_KEY = env.RESEND_API_KEY;
const CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;

if (!RESEND_API_KEY) {
  console.log('❌ RESEND_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🚀 Autonomous Resend Domain Setup');
console.log('━'.repeat(40));

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function checkResendDomains() {
  console.log('🔍 Checking existing domains in Resend...');
  
  const options = {
    hostname: 'api.resend.com',
    path: '/domains',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      const domains = response.data.data || [];
      const vobvorotDomain = domains.find(d => d.name === 'vobvorot.com');
      
      if (vobvorotDomain) {
        console.log('✅ Domain found in Resend:', vobvorotDomain.name);
        console.log('📊 Status:', vobvorotDomain.status);
        console.log('🔧 Records:', JSON.stringify(vobvorotDomain.records, null, 2));
        return vobvorotDomain;
      } else {
        console.log('❌ vobvorot.com not found in Resend');
        console.log('📋 Existing domains:', domains.map(d => d.name).join(', '));
        return null;
      }
    } else {
      console.log('❌ Failed to fetch domains:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error checking domains:', error.message);
    return null;
  }
}

async function addDomainToResend() {
  console.log('🔧 Adding vobvorot.com to Resend...');
  
  const options = {
    hostname: 'api.resend.com',
    path: '/domains',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  const postData = JSON.stringify({
    name: 'vobvorot.com',
    region: 'us-east-1'
  });
  
  try {
    const response = await makeRequest(options, postData);
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ Domain added to Resend successfully!');
      console.log('📋 Domain details:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log('❌ Failed to add domain:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error adding domain:', error.message);
    return null;
  }
}

async function checkCloudflareRecords() {
  if (!CLOUDFLARE_API_TOKEN) {
    console.log('⚠️ No Cloudflare token - cannot check DNS records');
    return;
  }
  
  console.log('🔍 Checking DNS records in Cloudflare...');
  
  // First, get zone ID
  const zonesOptions = {
    hostname: 'api.cloudflare.com',
    path: '/client/v4/zones?name=vobvorot.com',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const zonesResponse = await makeRequest(zonesOptions);
    
    if (zonesResponse.status !== 200 || !zonesResponse.data.result.length) {
      console.log('❌ Could not find zone in Cloudflare');
      return;
    }
    
    const zoneId = zonesResponse.data.result[0].id;
    console.log('✅ Zone found:', zoneId);
    
    // Get DNS records
    const recordsOptions = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${zoneId}/dns_records`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    const recordsResponse = await makeRequest(recordsOptions);
    
    if (recordsResponse.status === 200) {
      const records = recordsResponse.data.result;
      const txtRecords = records.filter(r => r.type === 'TXT');
      
      console.log('📋 TXT records found:');
      txtRecords.forEach(record => {
        console.log(`   ${record.name}: ${record.content}`);
      });
      
      // Check for Resend-specific records
      const resendRecords = txtRecords.filter(r => 
        r.content.includes('resend') || 
        r.name.includes('resend') ||
        r.content.includes('dkim')
      );
      
      if (resendRecords.length > 0) {
        console.log('✅ Resend DNS records found in Cloudflare');
      } else {
        console.log('⚠️ No Resend-specific records found');
      }
      
      return records;
    }
  } catch (error) {
    console.log('❌ Error checking Cloudflare records:', error.message);
  }
}

async function verifyDomainInResend(domainId) {
  console.log('🔍 Attempting to verify domain in Resend...');
  
  const options = {
    hostname: 'api.resend.com',
    path: `/domains/${domainId}/verify`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Domain verification successful!');
      console.log('📋 Verification result:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('❌ Domain verification failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error verifying domain:', error.message);
    return false;
  }
}

async function main() {
  // Step 1: Check if domain exists in Resend
  let domain = await checkResendDomains();
  
  // Step 2: Add domain if not exists
  if (!domain) {
    domain = await addDomainToResend();
    if (!domain) {
      console.log('❌ Could not add domain to Resend');
      return;
    }
  }
  
  // Step 3: Check Cloudflare DNS records
  await checkCloudflareRecords();
  
  // Step 4: Try to verify domain
  if (domain.id) {
    const verified = await verifyDomainInResend(domain.id);
    
    if (verified) {
      console.log('🎉 SUCCESS! Domain fully verified and ready for email sending!');
    } else {
      console.log('⏳ Domain added but verification pending. DNS propagation may need more time.');
      console.log('📋 Manual verification steps:');
      console.log('1. Go to https://resend.com/domains');
      console.log('2. Find vobvorot.com');
      console.log('3. Click "Verify" when DNS records are propagated');
    }
  }
  
  console.log('\n🚀 Domain setup process completed!');
}

main().catch(console.error);