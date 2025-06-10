#!/usr/bin/env node

/**
 * Debug GoDaddy API connection
 */

const https = require('https');
const fs = require('fs');

// Load environment variables
function loadEnvFile(filePath) {
  try {
    const envFile = fs.readFileSync(filePath, 'utf8');
    const lines = envFile.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^['"](.*)['"]$/, '$1');
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.log(`Could not load ${filePath}`);
  }
}

loadEnvFile('.env.local');

const GODADDY_API_KEY = process.env.GODADDY_API_KEY;
const GODADDY_SECRET = process.env.GODADDY_SECRET;
const DOMAIN = 'vobvorot.com';

console.log('🔍 GoDaddy API Debug');
console.log('━'.repeat(30));
console.log(`API Key: ${GODADDY_API_KEY ? GODADDY_API_KEY.substring(0, 10) + '...' : 'Missing'}`);
console.log(`Secret: ${GODADDY_SECRET ? GODADDY_SECRET.substring(0, 10) + '...' : 'Missing'}`);
console.log(`Domain: ${DOMAIN}`);

function makeGoDaddyRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.godaddy.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_SECRET}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js/Resend-Setup'
      }
    };

    console.log(`\n📡 Making ${method} request to: ${path}`);
    console.log(`🔐 Auth header: sso-key ${GODADDY_API_KEY?.substring(0, 5)}...`);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`📊 Response status: ${res.statusCode}`);
      console.log(`📋 Response headers:`, JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        console.log(`📄 Response body: ${responseData.substring(0, 500)}${responseData.length > 500 ? '...' : ''}`);
        
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data: parsed, raw: responseData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
}

async function testAPI() {
  try {
    // Test 1: Check if domain exists
    console.log('\n🧪 Test 1: Check domain availability');
    const availResponse = await makeGoDaddyRequest('GET', `/v1/domains/available?domain=${DOMAIN}`);
    console.log(`Result: ${availResponse.status === 200 ? '✅ Success' : '❌ Failed'}`);
    
    // Test 2: Try to get domain info
    console.log('\n🧪 Test 2: Get domain info');
    const infoResponse = await makeGoDaddyRequest('GET', `/v1/domains/${DOMAIN}`);
    console.log(`Result: ${infoResponse.status === 200 ? '✅ Success' : '❌ Failed'}`);
    
    // Test 3: Try to get DNS records
    console.log('\n🧪 Test 3: Get DNS records');
    const dnsResponse = await makeGoDaddyRequest('GET', `/v1/domains/${DOMAIN}/records`);
    console.log(`Result: ${dnsResponse.status === 200 ? '✅ Success' : '❌ Failed'}`);
    
    if (dnsResponse.status === 200) {
      console.log(`📊 Found ${dnsResponse.data.length} DNS records`);
      const txtRecords = dnsResponse.data.filter(r => r.type === 'TXT');
      console.log(`📄 TXT records: ${txtRecords.length}`);
      txtRecords.forEach(record => {
        console.log(`   ${record.name}: ${record.data.substring(0, 50)}...`);
      });
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

testAPI();