#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const RESEND_API_KEY = env.RESEND_API_KEY;

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function checkDomains() {
  console.log('🔍 Checking current Resend domain status...\n');
  
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
      
      console.log('📋 All domains in Resend:');
      domains.forEach(domain => {
        console.log(`\n🌐 Domain: ${domain.name}`);
        console.log(`   Status: ${domain.status}`);
        console.log(`   ID: ${domain.id}`);
        console.log(`   Created: ${domain.created_at}`);
        console.log(`   Region: ${domain.region || 'N/A'}`);
        
        if (domain.records && domain.records.length > 0) {
          console.log('   📝 DNS Records:');
          domain.records.forEach(record => {
            console.log(`      ${record.record}: ${record.name} → ${record.value}`);
          });
        }
      });
      
      const vobvorotDomain = domains.find(d => d.name === 'vobvorot.com');
      
      if (vobvorotDomain) {
        console.log(`\n🎯 vobvorot.com status: ${vobvorotDomain.status}`);
        
        if (vobvorotDomain.status === 'verified') {
          console.log('✅ Domain is VERIFIED! Should work for email sending.');
        } else if (vobvorotDomain.status === 'pending') {
          console.log('⏳ Domain is PENDING verification. DNS may need more time to propagate.');
        } else {
          console.log(`❓ Unexpected status: ${vobvorotDomain.status}`);
        }
        
        return vobvorotDomain;
      } else {
        console.log('\n❌ vobvorot.com not found in Resend');
        return null;
      }
    } else {
      console.log('❌ Failed to fetch domains:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

checkDomains().catch(console.error);