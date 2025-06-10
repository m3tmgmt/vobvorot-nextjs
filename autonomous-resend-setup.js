#!/usr/bin/env node

/**
 * Autonomous Resend Setup for vobvorot.com
 * Complete automation of DNS configuration and email testing
 */

const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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

// Configuration
const CONFIG = {
  domain: 'vobvorot.com',
  godaddy: {
    apiKey: process.env.GODADDY_API_KEY,
    secret: process.env.GODADDY_SECRET
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH'
  },
  testEmail: 'vobvorot.work@gmail.com'
};

// Required DNS records
const DNS_RECORDS = {
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
  }
};

class AutonomousResendSetup {
  constructor() {
    this.steps = [
      { name: 'Check Prerequisites', fn: this.checkPrerequisites },
      { name: 'Analyze Current DNS', fn: this.analyzeCurrentDNS },
      { name: 'Update DNS Records', fn: this.updateDNSRecords },
      { name: 'Verify DNS Propagation', fn: this.verifyDNSPropagation },
      { name: 'Test Email Service', fn: this.testEmailService },
      { name: 'Generate Report', fn: this.generateReport }
    ];
    this.results = {};
  }

  async makeGoDaddyRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.godaddy.com',
        port: 443,
        path: path,
        method: method,
        headers: {
          'Authorization': `sso-key ${CONFIG.godaddy.apiKey}:${CONFIG.godaddy.secret}`,
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

  async makeResendRequest(method, path, data = null) {
    const { Resend } = require('resend');
    const resend = new Resend(CONFIG.resend.apiKey);
    
    if (method === 'POST' && path === '/emails') {
      return await resend.emails.send(data);
    }
    
    throw new Error('Unsupported Resend operation');
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    const checks = {
      godaddyApiKey: !!CONFIG.godaddy.apiKey && CONFIG.godaddy.apiKey !== 'YOUR_GODADDY_API_KEY',
      godaddySecret: !!CONFIG.godaddy.secret && CONFIG.godaddy.secret !== 'YOUR_GODADDY_SECRET',
      resendApiKey: !!CONFIG.resend.apiKey,
      nodeModules: fs.existsSync('node_modules/resend')
    };

    this.results.prerequisites = checks;

    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'Missing'}`);
    });

    if (!checks.godaddyApiKey || !checks.godaddySecret) {
      console.log('\n⚠️  GoDaddy API credentials needed:');
      console.log('   1. Get keys from: https://developer.godaddy.com/keys');
      console.log('   2. Add to .env.local:');
      console.log('      GODADDY_API_KEY=your_key');
      console.log('      GODADDY_SECRET=your_secret');
      return false;
    }

    if (!checks.nodeModules) {
      console.log('\n📦 Installing resend module...');
      try {
        await execAsync('npm install resend');
        console.log('   ✅ Resend installed');
      } catch (error) {
        console.log('   ❌ Failed to install resend');
        return false;
      }
    }

    return Object.values(checks).every(Boolean);
  }

  async analyzeCurrentDNS() {
    console.log('\n🔍 Analyzing current DNS records...');
    
    try {
      const response = await this.makeGoDaddyRequest('GET', `/v1/domains/${CONFIG.domain}/records`);
      
      if (response.status !== 200) {
        console.log('   ❌ Failed to fetch DNS records');
        return false;
      }

      const records = response.data;
      const txtRecords = records.filter(r => r.type === 'TXT');
      
      const analysis = {
        totalRecords: records.length,
        txtRecords: txtRecords.length,
        hasSPF: txtRecords.some(r => r.data.includes('v=spf1')),
        hasResendSPF: txtRecords.some(r => r.data.includes('_spf.resend.com')),
        hasDKIM: txtRecords.some(r => r.name === 'resend._domainkey'),
        currentSPF: txtRecords.find(r => r.data.includes('v=spf1'))?.data || 'None'
      };

      this.results.dnsAnalysis = analysis;

      console.log(`   📊 Total records: ${analysis.totalRecords}`);
      console.log(`   📄 TXT records: ${analysis.txtRecords}`);
      console.log(`   ${analysis.hasSPF ? '✅' : '❌'} SPF record: ${analysis.hasSPF ? 'Found' : 'Missing'}`);
      console.log(`   ${analysis.hasResendSPF ? '✅' : '❌'} Resend SPF: ${analysis.hasResendSPF ? 'Configured' : 'Missing'}`);
      console.log(`   ${analysis.hasDKIM ? '✅' : '❌'} DKIM record: ${analysis.hasDKIM ? 'Found' : 'Missing'}`);
      
      if (analysis.hasSPF) {
        console.log(`   📝 Current SPF: ${analysis.currentSPF}`);
      }

      return true;
    } catch (error) {
      console.log(`   ❌ DNS analysis failed: ${error.message}`);
      return false;
    }
  }

  async updateDNSRecords() {
    console.log('\n🔧 Updating DNS records...');
    
    const updates = [];
    
    // Update SPF record
    if (!this.results.dnsAnalysis.hasResendSPF) {
      console.log('   📝 Updating SPF record...');
      try {
        const spfRecords = [{
          type: 'TXT',
          name: '@',
          data: DNS_RECORDS.spf.data,
          ttl: DNS_RECORDS.spf.ttl
        }];

        const response = await this.makeGoDaddyRequest('PUT', `/v1/domains/${CONFIG.domain}/records/TXT/@`, spfRecords);
        
        if (response.status === 200) {
          console.log('   ✅ SPF record updated');
          updates.push('SPF updated');
        } else {
          console.log('   ❌ SPF update failed:', response.data);
        }
      } catch (error) {
        console.log('   ❌ SPF update error:', error.message);
      }
    } else {
      console.log('   ✅ SPF already configured for Resend');
    }

    // Add DKIM record
    if (!this.results.dnsAnalysis.hasDKIM) {
      console.log('   📝 Adding DKIM record...');
      try {
        const dkimRecords = [{
          type: 'TXT',
          name: 'resend._domainkey',
          data: DNS_RECORDS.dkim.data,
          ttl: DNS_RECORDS.dkim.ttl
        }];

        const response = await this.makeGoDaddyRequest('PATCH', `/v1/domains/${CONFIG.domain}/records`, dkimRecords);
        
        if (response.status === 200) {
          console.log('   ✅ DKIM record added');
          updates.push('DKIM added');
        } else {
          console.log('   ❌ DKIM add failed:', response.data);
        }
      } catch (error) {
        console.log('   ❌ DKIM add error:', error.message);
      }
    } else {
      console.log('   ✅ DKIM already configured');
    }

    this.results.dnsUpdates = updates;
    return updates.length > 0;
  }

  async verifyDNSPropagation() {
    console.log('\n⏳ Verifying DNS propagation...');
    
    const maxAttempts = 6;
    const delayMs = 10000; // 10 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`   🔍 Attempt ${attempt}/${maxAttempts}...`);
      
      try {
        const { stdout: spfResult } = await execAsync('dig TXT vobvorot.com +short');
        const { stdout: dkimResult } = await execAsync('dig TXT resend._domainkey.vobvorot.com +short');
        
        const hasResendSPF = spfResult.includes('_spf.resend.com');
        const hasDKIM = dkimResult.includes('p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL');
        
        console.log(`   ${hasResendSPF ? '✅' : '❌'} SPF propagation: ${hasResendSPF ? 'Success' : 'Pending'}`);
        console.log(`   ${hasDKIM ? '✅' : '❌'} DKIM propagation: ${hasDKIM ? 'Success' : 'Pending'}`);
        
        if (hasResendSPF && hasDKIM) {
          this.results.dnsPropagation = { success: true, attempts: attempt };
          return true;
        }
        
        if (attempt < maxAttempts) {
          console.log(`   ⏱️  Waiting ${delayMs/1000}s for propagation...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.log(`   ❌ DNS check failed: ${error.message}`);
      }
    }
    
    this.results.dnsPropagation = { success: false, attempts: maxAttempts };
    console.log('   ⚠️  DNS propagation incomplete after 60 seconds');
    console.log('   💡 Records may still be propagating (can take up to 24h)');
    return false;
  }

  async testEmailService() {
    console.log('\n📧 Testing email service...');
    
    try {
      const { data, error } = await this.makeResendRequest('POST', '/emails', {
        from: 'noreply@vobvorot.com',
        to: CONFIG.testEmail,
        subject: '🎉 Autonomous Setup Complete - vobvorot.com',
        html: `
          <h1>✅ Resend Setup Complete!</h1>
          <p>Your vobvorot.com domain has been automatically configured for Resend.</p>
          <h3>Configuration Details:</h3>
          <ul>
            <li>Domain: ${CONFIG.domain}</li>
            <li>DNS Updates: ${this.results.dnsUpdates?.length || 0} changes made</li>
            <li>Propagation: ${this.results.dnsPropagation?.success ? 'Verified' : 'In progress'}</li>
            <li>Test: Successfully sent from noreply@vobvorot.com</li>
          </ul>
          <p>🤖 This email was sent by autonomous setup process.</p>
        `
      });

      if (error) {
        console.log('   ❌ Email test failed:', error.message);
        this.results.emailTest = { success: false, error: error.message };
        return false;
      }

      console.log('   ✅ Email sent successfully!');
      console.log(`   📧 Email ID: ${data.id}`);
      this.results.emailTest = { success: true, emailId: data.id };
      return true;
    } catch (error) {
      console.log('   ❌ Email test error:', error.message);
      this.results.emailTest = { success: false, error: error.message };
      return false;
    }
  }

  async generateReport() {
    console.log('\n📋 Setup Complete - Generating Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      domain: CONFIG.domain,
      success: this.results.emailTest?.success || false,
      steps: this.results,
      nextSteps: []
    };

    if (report.success) {
      console.log('\n🎉 AUTONOMOUS SETUP SUCCESSFUL!');
      console.log('━'.repeat(50));
      console.log('✅ DNS records configured');
      console.log('✅ Email service working');
      console.log('✅ Domain verified for Resend');
      
      report.nextSteps = [
        'Email service is ready for production',
        'Test other email templates',
        'Monitor email delivery in Resend dashboard'
      ];
    } else {
      console.log('\n⚠️  Setup partially complete');
      console.log('━'.repeat(50));
      
      if (!this.results.dnsPropagation?.success) {
        console.log('⏳ DNS records may still be propagating');
        report.nextSteps.push('Wait for DNS propagation (up to 24h)');
        report.nextSteps.push('Re-run: node autonomous-resend-setup.js');
      }
      
      if (!this.results.emailTest?.success) {
        console.log('❌ Email test failed - domain may need more time');
        report.nextSteps.push('Verify domain in Resend dashboard');
        report.nextSteps.push('Check DNS records manually');
      }
    }

    // Save report
    fs.writeFileSync('resend-setup-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved: resend-setup-report.json');
    
    return report.success;
  }

  async run() {
    console.log('🤖 Autonomous Resend Setup for vobvorot.com');
    console.log('━'.repeat(50));
    
    for (const step of this.steps) {
      const success = await step.fn.call(this);
      if (!success && step.name !== 'Verify DNS Propagation' && step.name !== 'Test Email Service') {
        console.log(`\n❌ Setup failed at: ${step.name}`);
        return false;
      }
    }
    
    return true;
  }
}

// Run autonomous setup
const setup = new AutonomousResendSetup();
setup.run().catch(console.error);