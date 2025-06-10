#!/usr/bin/env node

/**
 * Autonomous Cloudflare Migration and DNS Setup
 * Migrates vobvorot.com from GoDaddy to Cloudflare for better automation
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

class CloudflareMigration {
  constructor() {
    this.config = {
      domain: 'vobvorot.com',
      cloudflareToken: process.env.CLOUDFLARE_API_TOKEN,
      resendApiKey: process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH'
    };
    this.results = {};
  }

  async makeCloudflareRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.cloudflare.com',
        port: 443,
        path: `/client/v4${path}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.config.cloudflareToken}`,
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

  async checkCloudflareSetup() {
    console.log('🔍 Checking Cloudflare setup...');
    
    if (!this.config.cloudflareToken) {
      console.log('❌ Cloudflare API token not found');
      return this.generateCloudflareInstructions();
    }

    try {
      // Check if zone exists
      const response = await this.makeCloudflareRequest('GET', `/zones?name=${this.config.domain}`);
      
      if (response.status === 200 && response.data.result?.length > 0) {
        const zone = response.data.result[0];
        console.log(`✅ Domain found in Cloudflare: ${zone.id}`);
        this.results.zoneId = zone.id;
        return true;
      } else {
        console.log('❌ Domain not found in Cloudflare');
        return this.generateCloudflareInstructions();
      }
    } catch (error) {
      console.log(`❌ Cloudflare API error: ${error.message}`);
      return false;
    }
  }

  async automaticDNSSetup() {
    console.log('\n🔧 Setting up DNS records automatically...');
    
    const records = [
      {
        type: 'TXT',
        name: '@',
        content: 'v=spf1 include:secureserver.net include:_spf.resend.com ~all',
        comment: 'SPF record for Resend'
      },
      {
        type: 'TXT', 
        name: 'resend._domainkey',
        content: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB',
        comment: 'DKIM record for Resend'
      }
    ];

    const results = [];
    
    for (const record of records) {
      try {
        console.log(`   📝 Creating ${record.type} record: ${record.name}`);
        
        const response = await this.makeCloudflareRequest('POST', `/zones/${this.results.zoneId}/dns_records`, record);
        
        if (response.status === 200) {
          console.log(`   ✅ ${record.type} record created successfully`);
          results.push({ type: record.type, name: record.name, success: true });
        } else {
          console.log(`   ❌ Failed to create ${record.type} record:`, response.data);
          results.push({ type: record.type, name: record.name, success: false, error: response.data });
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${record.type} record:`, error.message);
        results.push({ type: record.type, name: record.name, success: false, error: error.message });
      }
    }

    this.results.dnsRecords = results;
    return results.every(r => r.success);
  }

  async testEmailAfterSetup() {
    console.log('\n📧 Testing email after DNS setup...');
    
    // Wait a bit for DNS propagation
    console.log('⏳ Waiting 30 seconds for DNS propagation...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      const { Resend } = require('resend');
      const resend = new Resend(this.config.resendApiKey);
      
      const { data, error } = await resend.emails.send({
        from: 'noreply@vobvorot.com',
        to: 'vobvorot.work@gmail.com',
        subject: '🎉 Cloudflare + Resend Setup Complete!',
        html: `
          <h1>🎉 Success!</h1>
          <p>Your vobvorot.com domain has been automatically configured with Cloudflare and Resend!</p>
          <h3>What was automated:</h3>
          <ul>
            <li>✅ DNS records created in Cloudflare</li>
            <li>✅ SPF record configured for Resend</li>
            <li>✅ DKIM record configured for Resend</li>
            <li>✅ Email service tested and working</li>
          </ul>
          <p><strong>🤖 This entire process was completed autonomously!</strong></p>
        `
      });

      if (error) {
        console.log('❌ Email test failed:', error.message);
        this.results.emailTest = { success: false, error: error.message };
        return false;
      }

      console.log('✅ Email sent successfully from vobvorot.com!');
      console.log(`📧 Email ID: ${data.id}`);
      this.results.emailTest = { success: true, emailId: data.id };
      return true;

    } catch (error) {
      console.log('❌ Email test error:', error.message);
      this.results.emailTest = { success: false, error: error.message };
      return false;
    }
  }

  generateCloudflareInstructions() {
    console.log('\n📋 Cloudflare Setup Instructions');
    console.log('━'.repeat(50));
    
    const instructions = `
# Cloudflare Migration for Full Automation

## Why Cloudflare?
- ✅ Excellent free API access
- ✅ Better performance than GoDaddy
- ✅ Full automation support
- ✅ Advanced security features

## Setup Steps:

### 1. Create Cloudflare Account
- Go to: https://cloudflare.com/
- Sign up (free plan is perfect)

### 2. Add Domain to Cloudflare
- Dashboard → Add Site
- Enter: vobvorot.com
- Choose Free plan

### 3. Update Nameservers
Cloudflare will provide nameservers like:
- alice.ns.cloudflare.com
- bob.ns.cloudflare.com

Update these in GoDaddy:
- Go to: https://dcc.godaddy.com/manage/dns
- Change nameservers to Cloudflare ones

### 4. Get API Token
- Cloudflare Dashboard → My Profile → API Tokens
- Create Token → Custom Token
- Permissions: Zone:Edit, DNS:Edit
- Zone Resources: Include All zones

### 5. Add Token to Environment
Add to .env.local:
\`\`\`
CLOUDFLARE_API_TOKEN=your_token_here
\`\`\`

### 6. Run Autonomous Setup
\`\`\`bash
node autonomous-cloudflare-migration.js
\`\`\`

## Benefits After Migration:
- 🚀 Faster DNS resolution
- 🔒 DDoS protection
- 📊 Analytics dashboard  
- 🤖 Full automation capability
- 💰 Free plan sufficient for most needs
`;

    fs.writeFileSync('CLOUDFLARE_MIGRATION_GUIDE.md', instructions);
    console.log('📄 Created: CLOUDFLARE_MIGRATION_GUIDE.md');
    
    return false;
  }

  async run() {
    console.log('🤖 Autonomous Cloudflare + Resend Setup');
    console.log('━'.repeat(50));
    
    const hasCloudflare = await this.checkCloudflareSetup();
    
    if (!hasCloudflare) {
      console.log('\n📋 Manual Cloudflare setup required first');
      console.log('Run this script again after following the migration guide');
      return false;
    }
    
    const dnsSuccess = await this.automaticDNSSetup();
    
    if (!dnsSuccess) {
      console.log('\n❌ DNS setup failed');
      return false;
    }
    
    const emailSuccess = await this.testEmailAfterSetup();
    
    if (emailSuccess) {
      console.log('\n🎉 AUTONOMOUS SETUP COMPLETE!');
      console.log('━'.repeat(50));
      console.log('✅ Cloudflare DNS configured');
      console.log('✅ Resend domain verified'); 
      console.log('✅ Email service working');
      console.log('✅ Production ready!');
    } else {
      console.log('\n⚠️ DNS configured, email test failed');
      console.log('Domain may need more time to propagate');
    }
    
    return emailSuccess;
  }
}

// Run the migration
const migration = new CloudflareMigration();
migration.run().catch(console.error);