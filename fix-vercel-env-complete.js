#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Fixing Vercel environment variables with newline characters...\n');

// Environment variables that need fixing (from debug output)
const envVarsToFix = [
  {
    key: 'TELEGRAM_OWNER_CHAT_ID',
    oldValue: '1837334996,316593422\\n',
    newValue: '1837334996,316593422'
  },
  {
    key: 'NEXTAUTH_URL', 
    oldValue: 'https://vobvorot.com\\n',
    newValue: 'https://vobvorot.com'
  }
];

const VERCEL_TOKEN = 'yGHkW9HSoepeo4Q8ZnSBEKwn';
const PROJECT_NAME = 'vobvorot-nextjs';

async function fixEnvironmentVariables() {
  try {
    for (const envVar of envVarsToFix) {
      console.log(`\n📝 Fixing ${envVar.key}...`);
      console.log(`   Old value: "${envVar.oldValue}"`);
      console.log(`   New value: "${envVar.newValue}"`);
      
      // Remove the variable first
      try {
        execSync(
          `npx vercel env rm ${envVar.key} production --yes --token ${VERCEL_TOKEN}`,
          { stdio: 'inherit' }
        );
        console.log(`   ✅ Removed old value`);
      } catch (error) {
        console.log(`   ⚠️  Variable might not exist, continuing...`);
      }
      
      // Add the corrected value
      execSync(
        `echo "${envVar.newValue}" | npx vercel env add ${envVar.key} production --token ${VERCEL_TOKEN}`,
        { stdio: 'pipe' }
      );
      console.log(`   ✅ Added corrected value`);
    }
    
    console.log('\n✅ All environment variables fixed!');
    console.log('\n🚀 Triggering new deployment to apply changes...');
    
    // Trigger redeployment
    execSync(
      `npx vercel --prod --token ${VERCEL_TOKEN}`,
      { stdio: 'inherit' }
    );
    
    console.log('\n✅ Deployment triggered! Changes will be live in a few minutes.');
    
  } catch (error) {
    console.error('\n❌ Error fixing environment variables:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixEnvironmentVariables();