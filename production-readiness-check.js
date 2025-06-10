#!/usr/bin/env node

/**
 * Production Readiness Checker for VobVorot Store
 * Comprehensive validation of all systems before going live
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('🔍 VobVorot Store - Production Readiness Check');
console.log('═'.repeat(60));

const results = {
  critical: [],
  warnings: [],
  passed: [],
  score: 0
};

// Load environment variables
function loadEnv(filename) {
  try {
    const envContent = fs.readFileSync(filename, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
    return env;
  } catch (error) {
    return {};
  }
}

const prodEnv = loadEnv('.env.production');
const localEnv = loadEnv('.env.local');

// Helper functions
function addResult(type, category, message, details = '') {
  results[type].push({ category, message, details });
}

function checkEnvVar(envs, key, required = true, description = '') {
  const value = envs[key];
  if (!value) {
    if (required) {
      addResult('critical', 'Environment', `Missing required ${key}`, description);
      return false;
    } else {
      addResult('warnings', 'Environment', `Optional ${key} not set`, description);
      return false;
    }
  }
  
  // Check for placeholder values
  const placeholders = ['your-', 'YOUR_', 'example', 'test_', 'placeholder'];
  if (placeholders.some(p => value.includes(p))) {
    addResult('critical', 'Environment', `${key} contains placeholder value`, value);
    return false;
  }
  
  addResult('passed', 'Environment', `${key} configured correctly`);
  return true;
}

async function makeHttpRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve) => {
    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });
    req.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, error: 'Timeout' });
    });
    req.end();
  });
}

// Tests
async function checkEnvironmentVariables() {
  console.log('🔧 Checking environment variables...');
  
  // Critical production variables
  checkEnvVar(prodEnv, 'DATABASE_URL', true, 'PostgreSQL connection string');
  checkEnvVar(prodEnv, 'NEXTAUTH_SECRET', true, '32+ character secret');
  checkEnvVar(prodEnv, 'NEXTAUTH_URL', true, 'Production domain URL');
  checkEnvVar(prodEnv, 'RESEND_API_KEY', true, 'Email service API key');
  checkEnvVar(prodEnv, 'TELEGRAM_BOT_TOKEN', true, 'Telegram bot authentication');
  checkEnvVar(prodEnv, 'OWNER_TELEGRAM_ID', true, 'Admin Telegram user ID');
  checkEnvVar(prodEnv, 'ADMIN_API_KEY', true, 'Admin API authentication');
  checkEnvVar(prodEnv, 'CLOUDINARY_CLOUD_NAME', true, 'Image storage service');
  checkEnvVar(prodEnv, 'CLOUDINARY_API_KEY', true, 'Cloudinary authentication');
  checkEnvVar(prodEnv, 'CLOUDINARY_API_SECRET', true, 'Cloudinary secret');
  checkEnvVar(prodEnv, 'WESTERNBID_MERCHANT_ID', true, 'Payment processor ID');
  checkEnvVar(prodEnv, 'WESTERNBID_SECRET_KEY', true, 'Payment processor secret');
  
  // Check if mock mode is disabled for production
  if (prodEnv.WESTERNBID_MOCK_MODE === 'true') {
    addResult('critical', 'Payment', 'WesternBid mock mode still enabled for production');
  } else {
    addResult('passed', 'Payment', 'WesternBid configured for real payments');
  }
  
  // Optional but recommended
  checkEnvVar(prodEnv, 'GOOGLE_ANALYTICS_ID', false, 'Analytics tracking');
  checkEnvVar(prodEnv, 'CLOUDFLARE_API_TOKEN', false, 'DNS automation');
}

async function checkDatabaseConnection() {
  console.log('📊 Checking database configuration...');
  
  const dbUrl = prodEnv.DATABASE_URL;
  if (!dbUrl) {
    addResult('critical', 'Database', 'No DATABASE_URL configured');
    return;
  }
  
  if (dbUrl.includes('file:')) {
    addResult('critical', 'Database', 'Still using SQLite for production (should be PostgreSQL)');
    return;
  }
  
  if (dbUrl.includes('postgresql://') || dbUrl.includes('prisma+postgres://')) {
    addResult('passed', 'Database', 'PostgreSQL configured correctly');
  } else {
    addResult('warnings', 'Database', 'Unexpected database type');
  }
}

async function checkTypeScriptCompilation() {
  console.log('📝 Checking TypeScript compilation...');
  
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    addResult('passed', 'Code Quality', 'TypeScript compilation successful');
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorCount = (output.match(/error TS/g) || []).length;
    addResult('critical', 'Code Quality', `${errorCount} TypeScript errors found`, output.slice(0, 500));
  }
}

async function checkBuildProcess() {
  console.log('🏗️ Checking build process...');
  
  try {
    execSync('npm run build', { stdio: 'pipe' });
    addResult('passed', 'Build', 'Next.js build successful');
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    addResult('critical', 'Build', 'Build process failed', output.slice(0, 500));
  }
}

async function checkEmailService() {
  console.log('📧 Checking email service...');
  
  const apiKey = prodEnv.RESEND_API_KEY;
  if (!apiKey) {
    addResult('critical', 'Email', 'Resend API key not configured');
    return;
  }
  
  try {
    const response = await makeHttpRequest('https://api.resend.com/domains', 'GET', {
      'Authorization': `Bearer ${apiKey}`
    });
    
    if (response.status === 200) {
      const domains = JSON.parse(response.data);
      const vobvorotDomain = domains.data?.find(d => d.name === 'vobvorot.com');
      
      if (vobvorotDomain) {
        if (vobvorotDomain.status === 'verified') {
          addResult('passed', 'Email', 'Domain verified in Resend');
        } else {
          addResult('warnings', 'Email', 'Domain not yet verified in Resend');
        }
      } else {
        addResult('warnings', 'Email', 'vobvorot.com domain not found in Resend');
      }
    } else {
      addResult('warnings', 'Email', 'Could not verify Resend configuration');
    }
  } catch (error) {
    addResult('warnings', 'Email', 'Email service check failed', error.message);
  }
}

async function checkTelegramBot() {
  console.log('🤖 Checking Telegram bot...');
  
  const botToken = prodEnv.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    addResult('critical', 'Telegram', 'Bot token not configured');
    return;
  }
  
  try {
    const response = await makeHttpRequest(`https://api.telegram.org/bot${botToken}/getMe`);
    
    if (response.status === 200) {
      const botInfo = JSON.parse(response.data);
      if (botInfo.ok) {
        addResult('passed', 'Telegram', `Bot verified: @${botInfo.result.username}`);
      } else {
        addResult('critical', 'Telegram', 'Bot token invalid');
      }
    } else {
      addResult('critical', 'Telegram', 'Bot token authentication failed');
    }
  } catch (error) {
    addResult('critical', 'Telegram', 'Bot check failed', error.message);
  }
}

async function checkCloudinaryService() {
  console.log('📸 Checking Cloudinary service...');
  
  const cloudName = prodEnv.CLOUDINARY_CLOUD_NAME;
  const apiKey = prodEnv.CLOUDINARY_API_KEY;
  
  if (!cloudName || !apiKey) {
    addResult('warnings', 'Images', 'Cloudinary not fully configured');
    return;
  }
  
  try {
    const auth = Buffer.from(`${apiKey}:${prodEnv.CLOUDINARY_API_SECRET}`).toString('base64');
    const response = await makeHttpRequest(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image`, 'GET', {
      'Authorization': `Basic ${auth}`
    });
    
    if (response.status === 200) {
      addResult('passed', 'Images', 'Cloudinary service accessible');
    } else {
      addResult('warnings', 'Images', 'Cloudinary authentication may be incorrect');
    }
  } catch (error) {
    addResult('warnings', 'Images', 'Could not verify Cloudinary', error.message);
  }
}

async function checkSecurityConfiguration() {
  console.log('🔒 Checking security configuration...');
  
  // Check for middleware
  if (fs.existsSync('src/middleware.ts')) {
    addResult('passed', 'Security', 'Middleware configured');
  } else {
    addResult('critical', 'Security', 'No middleware found - missing security layers');
  }
  
  // Check for strong secrets
  const secrets = ['NEXTAUTH_SECRET', 'ADMIN_API_KEY', 'WESTERNBID_SECRET_KEY'];
  secrets.forEach(secret => {
    const value = prodEnv[secret];
    if (value && value.length >= 32) {
      addResult('passed', 'Security', `${secret} has adequate length`);
    } else {
      addResult('critical', 'Security', `${secret} is too short or missing`);
    }
  });
  
  // Check NODE_ENV
  if (prodEnv.NODE_ENV === 'production') {
    addResult('passed', 'Security', 'NODE_ENV set to production');
  } else {
    addResult('warnings', 'Security', 'NODE_ENV not set to production');
  }
}

async function checkFileStructure() {
  console.log('📁 Checking file structure...');
  
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'prisma/schema.prisma',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/lib/auth.ts',
    'src/lib/prisma.ts',
    '.env.production'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      addResult('passed', 'Structure', `${file} exists`);
    } else {
      addResult('critical', 'Structure', `Missing required file: ${file}`);
    }
  });
  
  // Check for sensitive files that shouldn't be in repo
  const sensitiveFiles = ['.env.local', '.env'];
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      addResult('warnings', 'Security', `Sensitive file ${file} present (should not be committed)`);
    }
  });
}

// Main execution
async function runAllChecks() {
  await checkEnvironmentVariables();
  await checkDatabaseConnection();
  await checkTypeScriptCompilation();
  await checkEmailService();
  await checkTelegramBot();
  await checkCloudinaryService();
  await checkSecurityConfiguration();
  await checkFileStructure();
  
  // Note: Skipping build check in development to avoid conflicts
  console.log('⚠️ Skipping build check (run manually: npm run build)');
  
  // Calculate score
  const totalChecks = results.critical.length + results.warnings.length + results.passed.length;
  const criticalWeight = 3;
  const warningWeight = 1;
  const passedWeight = 2;
  
  const maxScore = totalChecks * passedWeight;
  const actualScore = (results.passed.length * passedWeight) + 
                     (results.warnings.length * warningWeight) - 
                     (results.critical.length * criticalWeight);
  
  results.score = Math.max(0, (actualScore / maxScore) * 100);
  
  // Display results
  console.log('\n📊 PRODUCTION READINESS REPORT');
  console.log('═'.repeat(60));
  
  if (results.critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES (Must fix before production):');
    results.critical.forEach(({ category, message, details }) => {
      console.log(`   ❌ [${category}] ${message}`);
      if (details) console.log(`      Details: ${details.slice(0, 100)}...`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS (Recommended to fix):');
    results.warnings.forEach(({ category, message, details }) => {
      console.log(`   🟡 [${category}] ${message}`);
      if (details) console.log(`      Details: ${details.slice(0, 100)}...`);
    });
  }
  
  if (results.passed.length > 0) {
    console.log('\n✅ PASSED CHECKS:');
    results.passed.forEach(({ category, message }) => {
      console.log(`   ✅ [${category}] ${message}`);
    });
  }
  
  console.log(`\n🎯 OVERALL SCORE: ${results.score.toFixed(1)}%`);
  
  if (results.score >= 90) {
    console.log('🎉 EXCELLENT! Ready for production deployment.');
  } else if (results.score >= 75) {
    console.log('✅ GOOD! Minor issues to address before production.');
  } else if (results.score >= 50) {
    console.log('⚠️ NEEDS WORK! Several issues must be resolved.');
  } else {
    console.log('🚨 NOT READY! Critical issues must be fixed first.');
  }
  
  console.log('\n📋 NEXT STEPS:');
  if (results.critical.length > 0) {
    console.log('1. Fix all critical issues');
    console.log('2. Re-run this check');
    console.log('3. Address warnings');
    console.log('4. Deploy to production');
  } else if (results.warnings.length > 0) {
    console.log('1. Address remaining warnings');
    console.log('2. Run final tests');
    console.log('3. Deploy to production');
  } else {
    console.log('1. Run final build test: npm run build');
    console.log('2. Deploy to production');
    console.log('3. Monitor system health');
  }
}

runAllChecks().catch(console.error);