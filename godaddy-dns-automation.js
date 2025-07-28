#!/usr/bin/env node

/**
 * GoDaddy DNS Automation Script for vobvorot.com
 * Generates exact API calls needed to configure Resend
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

// GoDaddy API configuration
const GODADDY_API_KEY = process.env.GODADDY_API_KEY || 'YOUR_GODADDY_API_KEY';
const GODADDY_SECRET = process.env.GODADDY_SECRET || 'YOUR_GODADDY_SECRET';
const DOMAIN = 'vobvorot.com';

// Required DNS records for Resend
const RESEND_RECORDS = {
  spf: {
    type: 'TXT',
    name: '@',
    data: 'v=spf1 include:secureserver.net include:_spf.resend.com ~all',
    ttl: 3600
  },
  dkim: {
    type: 'TXT', 
    name: 'resend._domainkey',
    data: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB',
    ttl: 3600
  },
  dmarc: {
    type: 'TXT',
    name: '_dmarc',
    data: 'v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:admin@vobvorot.com;',
    ttl: 3600
  }
};

function makeGoDaddyRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.godaddy.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_SECRET}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function getCurrentRecords() {
  console.log('🔍 Fetching current DNS records from GoDaddy...\n');
  
  try {
    const response = await makeGoDaddyRequest('GET', `/v1/domains/${DOMAIN}/records`);
    
    if (response.status === 200) {
      return response.data;
    } else {
      console.log('❌ Failed to fetch records:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
    return null;
  }
}

async function updateSPFRecord() {
  console.log('📝 Updating SPF record...');
  
  const records = [{
    type: 'TXT',
    name: '@', 
    data: RESEND_RECORDS.spf.data,
    ttl: RESEND_RECORDS.spf.ttl
  }];

  try {
    const response = await makeGoDaddyRequest('PUT', `/v1/domains/${DOMAIN}/records/TXT/@`, records);
    
    if (response.status === 200) {
      console.log('✅ SPF record updated successfully');
      return true;
    } else {
      console.log('❌ Failed to update SPF:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ SPF Update Error:', error.message);
    return false;
  }
}

async function addDKIMRecord() {
  console.log('📝 Adding DKIM record...');
  
  const records = [{
    type: 'TXT',
    name: 'resend._domainkey',
    data: RESEND_RECORDS.dkim.data,
    ttl: RESEND_RECORDS.dkim.ttl
  }];

  try {
    const response = await makeGoDaddyRequest('PATCH', `/v1/domains/${DOMAIN}/records`, records);
    
    if (response.status === 200) {
      console.log('✅ DKIM record added successfully');
      return true;
    } else {
      console.log('❌ Failed to add DKIM:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ DKIM Add Error:', error.message);
    return false;
  }
}

async function generateManualInstructions() {
  console.log('\n📋 Manual Configuration Instructions for GoDaddy:');
  console.log('━'.repeat(60));
  
  console.log('\n1. Go to GoDaddy DNS Management:');
  console.log('   https://dcc.godaddy.com/manage/dns');
  
  console.log('\n2. Update SPF Record:');
  console.log('   - Find existing TXT record with: v=spf1 include:secureserver.net -all');
  console.log('   - Edit it to: v=spf1 include:secureserver.net include:_spf.resend.com ~all');
  
  console.log('\n3. Add DKIM Record:');
  console.log('   - Type: TXT');
  console.log('   - Name: resend._domainkey');
  console.log('   - Value:');
  console.log('     p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB');
  
  console.log('\n4. Optional - Update DMARC (softer policy):');
  console.log('   - Edit existing _dmarc TXT record');
  console.log('   - Change to: v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:admin@vobvorot.com;');
  
  console.log('\n5. Save changes and wait 30-60 minutes for propagation');
}

async function generateCurlCommands() {
  console.log('\n🔧 cURL Commands for GoDaddy API:');
  console.log('━'.repeat(60));
  
  console.log('\n# Set your API credentials:');
  console.log('export GODADDY_KEY="your_api_key"');
  console.log('export GODADDY_SECRET="your_secret"');
  
  console.log('\n# Update SPF record:');
  console.log('curl -X PUT "https://api.godaddy.com/v1/domains/vobvorot.com/records/TXT/@" \\');
  console.log('  -H "Authorization: sso-key $GODADDY_KEY:$GODADDY_SECRET" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'[{"type":"TXT","name":"@","data":"v=spf1 include:secureserver.net include:_spf.resend.com ~all","ttl":3600}]\'');
  
  console.log('\n# Add DKIM record:');
  console.log('curl -X PATCH "https://api.godaddy.com/v1/domains/vobvorot.com/records" \\');
  console.log('  -H "Authorization: sso-key $GODADDY_KEY:$GODADDY_SECRET" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'[{"type":"TXT","name":"resend._domainkey","data":"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB","ttl":3600}]\'');
}

async function main() {
  console.log('🚀 GoDaddy DNS Automation for vobvorot.com');
  console.log('━'.repeat(60));
  
  if (GODADDY_API_KEY === 'YOUR_GODADDY_API_KEY') {
    console.log('⚠️  API credentials not configured');
    generateManualInstructions();
    generateCurlCommands();
    
    console.log('\n📌 To get GoDaddy API credentials:');
    console.log('1. Go to https://developer.godaddy.com/keys');
    console.log('2. Create Production API key');
    console.log('3. Update this script with your credentials');
    
    return;
  }
  
  // If API credentials are set, try automated approach
  const records = await getCurrentRecords();
  
  if (records) {
    console.log('📋 Current TXT records found:');
    const txtRecords = records.filter(r => r.type === 'TXT');
    txtRecords.forEach(record => {
      console.log(`   ${record.name}: ${record.data}`);
    });
    
    console.log('\n🔄 Attempting automated updates...');
    
    const spfSuccess = await updateSPFRecord();
    const dkimSuccess = await addDKIMRecord();
    
    if (spfSuccess && dkimSuccess) {
      console.log('\n🎉 DNS records updated successfully!');
      console.log('⏳ Wait 30-60 minutes for propagation, then test:');
      console.log('   node test-resend.js vobvorot.work@gmail.com');
    } else {
      console.log('\n⚠️  Some updates failed. Try manual approach.');
      generateManualInstructions();
    }
  } else {
    generateManualInstructions();
    generateCurlCommands();
  }
}

// Run the script
main().catch(console.error);