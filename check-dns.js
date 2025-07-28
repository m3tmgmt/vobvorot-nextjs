#!/usr/bin/env node

/**
 * Check DNS records for vobvorot.com domain verification
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkDNS() {
  console.log('🔍 Checking DNS records for vobvorot.com...\n');

  const checks = [
    {
      name: 'SPF Record',
      command: 'dig TXT vobvorot.com +short',
      expected: 'include:_spf.resend.com',
      description: 'Authorizes Resend to send emails (should include both GoDaddy and Resend)'
    },
    {
      name: 'DKIM Record', 
      command: 'dig TXT resend._domainkey.vobvorot.com +short',
      expected: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB',
      description: 'Email authentication key'
    },
    {
      name: 'DMARC Record',
      command: 'dig TXT _dmarc.vobvorot.com +short', 
      expected: 'v=DMARC1; p=none;',
      description: 'Email policy (optional but recommended)'
    }
  ];

  let allGood = true;

  for (const check of checks) {
    console.log(`📋 Checking ${check.name}...`);
    
    try {
      const { stdout, stderr } = await execAsync(check.command);
      const result = stdout.trim();
      
      if (result) {
        const records = result.split('\n').map(r => r.replace(/"/g, ''));
        const found = records.some(record => record.includes(check.expected.split(' ')[0]));
        
        if (found) {
          console.log(`✅ ${check.name}: Found`);
          console.log(`   Value: ${records.find(r => r.includes(check.expected.split(' ')[0]))}`);
        } else {
          console.log(`❌ ${check.name}: Not found or incorrect`);
          console.log(`   Expected: ${check.expected}`);
          console.log(`   Found: ${result || 'No records'}`);
          allGood = false;
        }
      } else {
        console.log(`❌ ${check.name}: No records found`);
        console.log(`   Expected: ${check.expected}`);
        allGood = false;
      }
      
    } catch (error) {
      console.log(`❌ ${check.name}: Error checking DNS`);
      console.log(`   Command: ${check.command}`);
      allGood = false;
    }
    
    console.log(`   Purpose: ${check.description}\n`);
  }

  if (allGood) {
    console.log('🎉 All DNS records are configured correctly!');
    console.log('📧 Now test email sending:');
    console.log('   node test-resend.js vobvorot.work@gmail.com');
  } else {
    console.log('⚠️ Some DNS records need attention.');
    console.log('📋 See DNS_RECORDS_SETUP.md for exact values to add.');
    console.log('⏳ Note: DNS changes can take up to 24 hours to propagate.');
  }
}

checkDNS().catch(error => {
  console.error('❌ Error checking DNS:', error.message);
  console.log('\n💡 You may need to install dig tool:');
  console.log('   macOS: brew install bind (if using Homebrew)');
  console.log('   Or check DNS manually at: https://toolbox.googleapps.com/apps/dig/');
});