#!/usr/bin/env node

/**
 * Railway Deployment Script for vobvorot-nextjs
 * Since Railway CLI requires interactive input, this script provides
 * instructions and automation where possible.
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚂 Railway Deployment Script for vobvorot-nextjs');
console.log('='.repeat(50));

// Check Railway CLI authentication
try {
  const whoami = execSync('railway whoami', { encoding: 'utf8' });
  console.log('✅ Railway CLI authenticated:', whoami.trim());
} catch (error) {
  console.error('❌ Railway CLI not authenticated. Please run: railway login');
  process.exit(1);
}

// Check current project status
try {
  const status = execSync('railway status', { encoding: 'utf8' });
  console.log('📊 Current Railway status:');
  console.log(status);
} catch (error) {
  console.error('❌ Error checking Railway status:', error.message);
  process.exit(1);
}

// Project configuration
const projectConfig = {
  repository: 'https://github.com/m3tmgmt/vobvorot-nextjs',
  branch: 'main',
  buildCommand: 'npm ci && npx prisma generate && npm run build',
  startCommand: 'npm start',
  port: 3000
};

console.log('\n🔧 Project Configuration:');
console.log(`Repository: ${projectConfig.repository}`);
console.log(`Branch: ${projectConfig.branch}`);
console.log(`Build Command: ${projectConfig.buildCommand}`);
console.log(`Start Command: ${projectConfig.startCommand}`);

// Environment variables to set
const envVars = {
  'NODE_ENV': 'production',
  'NEXTAUTH_URL': 'https://vobvorot.com',
  'NEXTAUTH_SECRET': 'vobvorot_super_secret_key_2024_production_ultra_secure_32_chars_minimum',
  'DATABASE_URL': 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWEI3R1JQOEFBQTZUODk4REFOTlI4QVgiLCJ0ZW5hbnRfaWQiOiI5NjAwOGM1MDMyZTg0ZTE3NjUzNWM2MzlmOTQ4ODkxZGMzZTU2YmFjYTJiZWNlOGRkNWI0ZGViOTFlMjcyNGYxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNzgwMDFkNjgtNWI1Zi00ZmQzLWFkMTMtYmRkMDRlN2U3MDU2In0.MaCYMs1qji8lEoIuwP5sjrR7SdpjBqK_RUbd3nOD3Rs',
  'DIRECT_DATABASE_URL': 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWEI3R1JQOEFBQTZUODk4REFOTlI4QVgiLCJ0ZW5hbnRfaWQiOiI5NjAwOGM1MDMyZTg0ZTE3NjUzNWM2MzlmOTQ4ODkxZGMzZTU2YmFjYTJiZWNlOGRkNWI0ZGViOTFlMjcyNGYxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNzgwMDFkNjgtNWI1Zi00ZmQzLWFkMTMtYmRkMDRlN2U3MDU2In0.MaCYMs1qji8lEoIuwP5sjrR7SdpjBqK_RUbd3nOD3Rs',
  'TELEGRAM_BOT_TOKEN': '7274106590:AAEu0baVLztVQO9YdnCjvo9fcb3SnMFQNe8',
  'TELEGRAM_BOT_USERNAME': 'VobvorotComAdminBot',
  'OWNER_TELEGRAM_ID': '316593422',
  'RESEND_API_KEY': 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH',
  'FROM_EMAIL': 'noreply@vobvorot.com',
  'ADMIN_EMAIL': 'admin@vobvorot.com',
  'CLOUDINARY_CLOUD_NAME': 'dqi4iuyo1',
  'CLOUDINARY_API_KEY': '576232937933712',
  'CLOUDINARY_API_SECRET': '51NC1qSag-XbWCsRPi2-Lr0iW1E',
  'GOOGLE_ANALYTICS_ID': 'G-964RJ1KRRZ',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID': 'G-964RJ1KRRZ',
  'NEXT_PUBLIC_SITE_URL': 'https://vobvorot.com',
  'WESTERNBID_MERCHANT_ID': 'mock_merchant_vobvorot_2024',
  'WESTERNBID_SECRET_KEY': 'mock_secret_key_vobvorot_ultra_secure_2024_placeholder_32chars',
  'WESTERNBID_API_URL': 'https://api.westernbid.com',
  'WESTERNBID_ENVIRONMENT': 'production',
  'WESTERNBID_ENABLED': 'true',
  'WESTERNBID_MOCK_MODE': 'true'
};

console.log('\n📋 Manual Deployment Steps:');
console.log('Since Railway CLI requires interactive input, please follow these steps:');
console.log('');
console.log('1. 🌐 Open Railway Dashboard:');
console.log('   https://railway.app/dashboard');
console.log('');
console.log('2. 📁 Navigate to quixotic-liquid project');
console.log('');
console.log('3. ➕ Add a new service:');
console.log('   - Click "Add Service"');
console.log('   - Select "GitHub Repository"');
console.log('   - Choose "m3tmgmt/vobvorot-nextjs"');
console.log('   - Set branch to "main"');
console.log('');
console.log('4. ⚙️ Configuration:');
console.log('   - Railway will auto-detect Next.js');
console.log('   - nixpacks.toml will be used for build configuration');
console.log('   - Build command: npm ci && npx prisma generate && npm run build');
console.log('   - Start command: npm start');
console.log('');
console.log('5. 🔐 Environment Variables:');
console.log('   Add these environment variables in Railway dashboard:');
console.log('');

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`   ${key}=${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
});

console.log('\n6. 🚀 Deploy:');
console.log('   - Click "Deploy" to start the deployment');
console.log('   - Railway will automatically build and deploy your application');
console.log('');
console.log('7. 🌍 Domain Setup:');
console.log('   - Once deployed, add a custom domain: vobvorot.com');
console.log('   - Or use the Railway-provided URL for testing');
console.log('');

// Save environment variables to a file for easy copying
const envFile = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync('.env.railway', envFile);
console.log('💾 Environment variables saved to .env.railway file');

console.log('\n✅ Deployment preparation complete!');
console.log('🔗 Repository: https://github.com/m3tmgmt/vobvorot-nextjs');
console.log('📊 Railway Dashboard: https://railway.app/dashboard');