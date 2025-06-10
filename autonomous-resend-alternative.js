#!/usr/bin/env node

/**
 * Alternative Autonomous Resend Setup
 * Works with multiple DNS providers and fallback methods
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
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

class AlternativeResendSetup {
  constructor() {
    this.config = {
      domain: 'vobvorot.com',
      resendApiKey: process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH',
      testEmail: 'vobvorot.work@gmail.com'
    };
    
    this.dnsRecords = {
      spf: 'v=spf1 include:secureserver.net include:_spf.resend.com ~all',
      dkim: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB'
    };
    
    this.results = {};
  }

  async detectDNSProvider() {
    console.log('🔍 Detecting DNS provider for vobvorot.com...');
    
    try {
      const { stdout } = await execAsync('dig NS vobvorot.com +short');
      const nameservers = stdout.trim().split('\n').filter(ns => ns.length > 0);
      
      console.log('📡 Nameservers found:');
      nameservers.forEach(ns => console.log(`   - ${ns}`));
      
      // Detect provider by nameservers
      let provider = 'unknown';
      const nsString = nameservers.join(' ').toLowerCase();
      
      if (nsString.includes('godaddy.com')) {
        provider = 'godaddy';
      } else if (nsString.includes('cloudflare.com')) {
        provider = 'cloudflare';
      } else if (nsString.includes('namecheap.com')) {
        provider = 'namecheap';
      } else if (nsString.includes('google.com')) {
        provider = 'google';
      }
      
      console.log(`🎯 Detected provider: ${provider}`);
      this.results.dnsProvider = provider;
      return provider;
      
    } catch (error) {
      console.log('❌ Could not detect DNS provider');
      this.results.dnsProvider = 'unknown';
      return 'unknown';
    }
  }

  async checkCurrentDNS() {
    console.log('\n🔍 Checking current DNS records...');
    
    const checks = [
      {
        name: 'SPF',
        command: 'dig TXT vobvorot.com +short',
        contains: 'v=spf1',
        hasResend: '_spf.resend.com'
      },
      {
        name: 'DKIM',
        command: 'dig TXT resend._domainkey.vobvorot.com +short',
        contains: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL',
        hasResend: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL'
      }
    ];

    const status = {};
    
    for (const check of checks) {
      try {
        const { stdout } = await execAsync(check.command);
        const result = stdout.trim();
        
        status[check.name.toLowerCase()] = {
          exists: result.includes(check.contains),
          hasResend: result.includes(check.hasResend),
          value: result
        };
        
        console.log(`   ${status[check.name.toLowerCase()].exists ? '✅' : '❌'} ${check.name}: ${status[check.name.toLowerCase()].exists ? 'Found' : 'Missing'}`);
        if (status[check.name.toLowerCase()].hasResend) {
          console.log(`   🎯 Resend ${check.name}: Already configured`);
        }
        
      } catch (error) {
        status[check.name.toLowerCase()] = { exists: false, hasResend: false, value: '' };
        console.log(`   ❌ ${check.name}: Check failed`);
      }
    }
    
    this.results.currentDNS = status;
    return status;
  }

  async generateInstructions() {
    console.log('\n📋 Generating manual setup instructions...');
    
    const provider = this.results.dnsProvider;
    const dns = this.results.currentDNS;
    
    const instructions = {
      provider,
      records: [],
      urls: {
        godaddy: 'https://dcc.godaddy.com/manage/dns',
        cloudflare: 'https://dash.cloudflare.com',
        namecheap: 'https://ap.www.namecheap.com/domains/dns',
        google: 'https://domains.google.com/registrar'
      }
    };

    // SPF record instruction
    if (!dns.spf?.hasResend) {
      instructions.records.push({
        type: 'UPDATE SPF Record',
        recordType: 'TXT',
        name: '@',
        currentValue: dns.spf?.value || 'None',
        newValue: this.dnsRecords.spf,
        action: dns.spf?.exists ? 'Update existing record' : 'Add new record'
      });
    }

    // DKIM record instruction
    if (!dns.dkim?.hasResend) {
      instructions.records.push({
        type: 'ADD DKIM Record',
        recordType: 'TXT',
        name: 'resend._domainkey',
        newValue: this.dnsRecords.dkim,
        action: 'Add new record'
      });
    }

    this.results.instructions = instructions;
    return instructions;
  }

  async createInstructionFiles() {
    console.log('\n📝 Creating instruction files...');
    
    const instructions = this.results.instructions;
    
    // Create universal instructions
    const universalMD = `
# DNS Setup Instructions for vobvorot.com

## Detected Provider: ${instructions.provider}

### Management URL:
${instructions.urls[instructions.provider] || 'Check your domain registrar'}

### Required Changes:

${instructions.records.map(record => `
#### ${record.type}
- **Type:** ${record.recordType}
- **Name:** ${record.name}
- **Action:** ${record.action}
${record.currentValue && record.currentValue !== 'None' ? `- **Current Value:** ${record.currentValue}` : ''}
- **New Value:** 
  \`\`\`
  ${record.newValue}
  \`\`\`
`).join('\n')}

### After Making Changes:
1. Wait 30-60 minutes for DNS propagation
2. Run verification: \`node check-dns.js\`
3. Test email: \`node test-resend.js vobvorot.work@gmail.com\`

### Automated Verification:
Run this command after DNS changes:
\`\`\`bash
node autonomous-resend-alternative.js --verify-only
\`\`\`
`;

    fs.writeFileSync('DNS_SETUP_INSTRUCTIONS.md', universalMD);
    
    // Create provider-specific script
    if (instructions.provider === 'godaddy') {
      const godaddyScript = `
# GoDaddy Specific Instructions

The automated API setup failed due to access restrictions.
Please follow these manual steps:

1. Go to: https://dcc.godaddy.com/manage/dns
2. Select domain: vobvorot.com
3. Make the changes listed in DNS_SETUP_INSTRUCTIONS.md

## Alternative: Create API Access
If you want to enable API access:
1. Ensure vobvorot.com is in the same GoDaddy account as your API keys
2. Check API key permissions at: https://developer.godaddy.com/keys
3. Contact GoDaddy support if domain access is restricted
`;
      fs.writeFileSync('GODADDY_MANUAL_SETUP.md', godaddyScript);
    }

    console.log('   ✅ Created DNS_SETUP_INSTRUCTIONS.md');
    console.log('   ✅ Created provider-specific instructions');
  }

  async testResendWithFallback() {
    console.log('\n📧 Testing Resend with fallback domains...');
    
    const { Resend } = require('resend');
    const resend = new Resend(this.config.resendApiKey);
    
    const attempts = [
      'noreply@vobvorot.com',
      'onboarding@resend.dev',
      'delivered@resend.dev'
    ];

    for (const fromEmail of attempts) {
      console.log(`   🧪 Testing from: ${fromEmail}`);
      
      try {
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: fromEmail.includes('resend.dev') ? 'm3t.mgmt@gmail.com' : this.config.testEmail,
          subject: `🔧 DNS Setup Required - ${fromEmail}`,
          html: `
            <h1>🔧 DNS Setup Instructions</h1>
            <p>Your Resend configuration requires DNS updates.</p>
            
            <h3>Status:</h3>
            <ul>
              <li>Domain: vobvorot.com</li>
              <li>Provider: ${this.results.dnsProvider}</li>
              <li>SPF Configured: ${this.results.currentDNS?.spf?.hasResend ? '✅' : '❌'}</li>
              <li>DKIM Configured: ${this.results.currentDNS?.dkim?.hasResend ? '✅' : '❌'}</li>
            </ul>
            
            <h3>Next Steps:</h3>
            <p>Check the generated instruction files:</p>
            <ul>
              <li>DNS_SETUP_INSTRUCTIONS.md</li>
              <li>Provider-specific setup guide</li>
            </ul>
            
            <p><strong>This email was sent from:</strong> ${fromEmail}</p>
            ${fromEmail.includes('resend.dev') ? '<p>⚠️ Using fallback domain - configure vobvorot.com for production</p>' : ''}
          `
        });

        if (error) {
          console.log(`   ❌ Failed: ${error.message}`);
          continue;
        }

        console.log(`   ✅ Success! Email ID: ${data.id}`);
        this.results.emailTest = { success: true, from: fromEmail, emailId: data.id };
        return true;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    this.results.emailTest = { success: false };
    return false;
  }

  async generateFinalReport() {
    console.log('\n📊 Generating final report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      domain: this.config.domain,
      dnsProvider: this.results.dnsProvider,
      currentDNS: this.results.currentDNS,
      emailTest: this.results.emailTest,
      status: 'setup_required',
      nextSteps: [
        'Follow instructions in DNS_SETUP_INSTRUCTIONS.md',
        'Wait 30-60 minutes for DNS propagation',
        'Run verification: node autonomous-resend-alternative.js --verify-only',
        'Test production email after DNS changes'
      ]
    };

    // Determine overall status
    if (this.results.currentDNS?.spf?.hasResend && this.results.currentDNS?.dkim?.hasResend) {
      report.status = 'configured';
      report.nextSteps = ['DNS already configured', 'Email service ready for production'];
    } else if (this.results.emailTest?.success) {
      report.status = 'partial';
      report.nextSteps.push('Email working with fallback, configure DNS for production');
    }

    fs.writeFileSync('resend-setup-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n🎯 SETUP SUMMARY');
    console.log('━'.repeat(50));
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log(`DNS Provider: ${report.dnsProvider}`);
    console.log(`SPF Configured: ${report.currentDNS?.spf?.hasResend ? '✅' : '❌'}`);
    console.log(`DKIM Configured: ${report.currentDNS?.dkim?.hasResend ? '✅' : '❌'}`);
    console.log(`Email Test: ${report.emailTest?.success ? '✅' : '❌'}`);
    
    console.log('\n📋 Next Steps:');
    report.nextSteps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`);
    });

    console.log('\n📄 Files Created:');
    console.log('- DNS_SETUP_INSTRUCTIONS.md');
    console.log('- resend-setup-report.json');
    if (this.results.dnsProvider === 'godaddy') {
      console.log('- GODADDY_MANUAL_SETUP.md');
    }

    return report;
  }

  async verifyOnly() {
    console.log('🔍 Verification Mode - Checking DNS status...');
    
    await this.checkCurrentDNS();
    
    if (this.results.currentDNS?.spf?.hasResend && this.results.currentDNS?.dkim?.hasResend) {
      console.log('\n🎉 DNS Configuration Complete!');
      console.log('Testing production email...');
      
      const { Resend } = require('resend');
      const resend = new Resend(this.config.resendApiKey);
      
      try {
        const { data } = await resend.emails.send({
          from: 'noreply@vobvorot.com',
          to: this.config.testEmail,
          subject: '🎉 vobvorot.com Email Setup Complete!',
          html: '<h1>✅ Success!</h1><p>Your vobvorot.com domain is now configured for Resend.</p>'
        });
        
        console.log(`✅ Production email sent! ID: ${data.id}`);
        return true;
      } catch (error) {
        console.log(`❌ Production email failed: ${error.message}`);
        return false;
      }
    } else {
      console.log('\n⚠️ DNS configuration still incomplete');
      console.log('SPF includes Resend:', this.results.currentDNS?.spf?.hasResend ? '✅' : '❌');
      console.log('DKIM configured:', this.results.currentDNS?.dkim?.hasResend ? '✅' : '❌');
      return false;
    }
  }

  async run() {
    console.log('🤖 Alternative Autonomous Resend Setup');
    console.log('━'.repeat(50));
    
    // Check if this is verification mode
    if (process.argv.includes('--verify-only')) {
      return await this.verifyOnly();
    }
    
    await this.detectDNSProvider();
    await this.checkCurrentDNS();
    await this.generateInstructions();
    await this.createInstructionFiles();
    await this.testResendWithFallback();
    await this.generateFinalReport();
    
    return true;
  }
}

// Run the alternative setup
const setup = new AlternativeResendSetup();
setup.run().catch(console.error);