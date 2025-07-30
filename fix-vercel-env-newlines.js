#!/usr/bin/env node

const { execSync } = require('child_process');

async function fixVercelEnvNewlines() {
  console.log('🔧 Fixing Vercel environment variables with newline characters...\n');

  // Check for Vercel token
  const token = process.env.VERCEL_TOKEN || process.argv[2];
  
  if (!token) {
    console.error('❌ Error: Vercel token is required.');
    console.log('\nUsage:');
    console.log('  VERCEL_TOKEN=your-token node fix-vercel-env-newlines.js');
    console.log('  OR');
    console.log('  node fix-vercel-env-newlines.js your-token');
    console.log('\nTo get a token:');
    console.log('  1. Go to https://vercel.com/account/tokens');
    console.log('  2. Create a new token');
    console.log('  3. Use it with this script');
    process.exit(1);
  }

  const tokenFlag = `--token ${token}`;

  try {
    // Get all environment variables
    console.log('📥 Fetching current environment variables from Vercel...');
    const envOutput = execSync(`vercel env ls production ${tokenFlag}`, { encoding: 'utf-8' });
    
    // Variables to fix
    const variablesToFix = ['TELEGRAM_OWNER_CHAT_ID', 'NEXTAUTH_URL'];
    
    for (const varName of variablesToFix) {
      console.log(`\n🔍 Checking ${varName}...`);
      
      try {
        // Pull the current value
        const pullCommand = `vercel env pull .env.${varName}.tmp --yes ${tokenFlag}`;
        execSync(pullCommand, { stdio: 'pipe' });
        
        // Read the value from temporary file
        const fs = require('fs');
        const envContent = fs.readFileSync(`.env.${varName}.tmp`, 'utf-8');
        
        // Extract the value
        const match = envContent.match(new RegExp(`^${varName}=(.*)$`, 'm'));
        if (match) {
          let value = match[1];
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Check if value contains newlines
          if (value.includes('\n') || value.includes('\r')) {
            console.log(`❌ Found newline characters in ${varName}`);
            console.log(`   Current value (with newlines): "${value.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);
            
            // Remove newlines
            const cleanValue = value.replace(/[\r\n]+/g, '').trim();
            console.log(`   Clean value (no newlines): "${cleanValue}"`);
            
            // Remove the old variable
            console.log(`   Removing old ${varName}...`);
            try {
              execSync(`vercel env rm ${varName} production --yes ${tokenFlag}`, { stdio: 'pipe' });
            } catch (e) {
              // Ignore error if variable doesn't exist
            }
            
            // Add the clean variable
            console.log(`   Adding clean ${varName}...`);
            const addCommand = `echo "${cleanValue}" | vercel env add ${varName} production ${tokenFlag}`;
            execSync(addCommand, { shell: true, stdio: 'pipe' });
            
            console.log(`✅ Fixed ${varName}`);
          } else {
            console.log(`✅ ${varName} is clean (no newlines found)`);
          }
        }
        
        // Clean up temporary file
        fs.unlinkSync(`.env.${varName}.tmp`);
        
      } catch (error) {
        console.error(`❌ Error processing ${varName}:`, error.message);
      }
    }
    
    console.log('\n🔍 Verifying the fixes...\n');
    
    // Verify the fixes
    for (const varName of variablesToFix) {
      try {
        // Pull again to verify
        execSync(`vercel env pull .env.${varName}.verify --yes ${tokenFlag}`, { stdio: 'pipe' });
        
        const fs = require('fs');
        const envContent = fs.readFileSync(`.env.${varName}.verify`, 'utf-8');
        const match = envContent.match(new RegExp(`^${varName}=(.*)$`, 'm'));
        
        if (match) {
          let value = match[1];
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          if (value.includes('\n') || value.includes('\r')) {
            console.log(`❌ ${varName} still contains newlines!`);
          } else {
            console.log(`✅ ${varName} verified clean: "${value}"`);
          }
        }
        
        // Clean up
        fs.unlinkSync(`.env.${varName}.verify`);
        
      } catch (error) {
        console.error(`❌ Error verifying ${varName}:`, error.message);
      }
    }
    
    console.log('\n✨ Environment variable fix complete!');
    console.log('\n📝 Note: You may need to redeploy your application for the changes to take effect.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixVercelEnvNewlines().catch(console.error);