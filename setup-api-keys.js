#!/usr/bin/env node

/**
 * Interactive script to setup GoDaddy API keys
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAPIKeys() {
  console.log('🔑 GoDaddy API Keys Setup');
  console.log('━'.repeat(40));
  
  console.log('\n📌 First, get your API keys:');
  console.log('1. Open: https://developer.godaddy.com/keys');
  console.log('2. Click "Create New API Key"');
  console.log('3. Choose "Production" environment');
  console.log('4. Name it "Resend DNS Automation"');
  console.log('5. Copy both API Key and Secret');
  
  const apiKey = await question('\n🔑 Enter your GoDaddy API Key: ');
  const secret = await question('🔐 Enter your GoDaddy Secret: ');
  
  if (!apiKey || !secret) {
    console.log('❌ Both API key and secret are required');
    rl.close();
    return;
  }
  
  // Read existing .env.local
  let envContent = '';
  try {
    envContent = fs.readFileSync('.env.local', 'utf8');
  } catch (error) {
    console.log('Creating new .env.local file...');
  }
  
  // Add GoDaddy credentials
  const godaddyEnv = `
# GoDaddy API Configuration (added by setup script)
GODADDY_API_KEY=${apiKey}
GODADDY_SECRET=${secret}
`;

  // Check if already exists
  if (envContent.includes('GODADDY_API_KEY')) {
    // Replace existing
    envContent = envContent.replace(/GODADDY_API_KEY=.*/g, `GODADDY_API_KEY=${apiKey}`);
    envContent = envContent.replace(/GODADDY_SECRET=.*/g, `GODADDY_SECRET=${secret}`);
  } else {
    // Append new
    envContent += godaddyEnv;
  }
  
  // Write back to file
  fs.writeFileSync('.env.local', envContent);
  
  console.log('\n✅ API keys saved to .env.local');
  console.log('\n🚀 Ready to run autonomous setup:');
  console.log('   node autonomous-resend-setup.js');
  
  const runNow = await question('\n❓ Run autonomous setup now? (y/n): ');
  
  if (runNow.toLowerCase() === 'y' || runNow.toLowerCase() === 'yes') {
    console.log('\n🤖 Starting autonomous setup...\n');
    rl.close();
    
    // Import and run the autonomous setup
    require('./autonomous-resend-setup.js');
  } else {
    console.log('\n👍 Setup saved. Run autonomous setup when ready.');
    rl.close();
  }
}

setupAPIKeys().catch(console.error);