#!/usr/bin/env node

/**
 * Test script to verify Resend email configuration for vobvorot.com domain
 * Usage: node test-resend.js [recipient-email]
 */

const { Resend } = require('resend');

// Load environment variables from .env.local manually
const fs = require('fs');
const path = require('path');

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
    console.log(`Could not load ${filePath}, using existing environment variables`);
  }
}

// Load .env.local file
loadEnvFile('.env.local');

// Fallback API key if not in environment
const API_KEY = process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH';
const resend = new Resend(API_KEY);

async function testEmail(recipientEmail) {
  console.log('🧪 Testing Resend configuration for vobvorot.com...\n');
  
  // Test configuration
  console.log('Configuration:');
  console.log(`- API Key: ${API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`- From Email: ${process.env.FROM_EMAIL || 'noreply@vobvorot.com'}`);
  console.log(`- Admin Email: ${process.env.ADMIN_EMAIL || 'admin@vobvorot.com'}`);
  console.log(`- Recipient: ${recipientEmail}\n`);

  // Check if recipient is the account owner email
  const isOwnerEmail = recipientEmail === 'm3t.mgmt@gmail.com';
  
  // Fallback domains to try if vobvorot.com is not verified
  const fallbackDomains = [
    process.env.FROM_EMAIL || 'noreply@vobvorot.com'
  ];
  
  // Only add resend.dev domains if sending to owner email
  if (isOwnerEmail) {
    fallbackDomains.push('onboarding@resend.dev', 'delivered@resend.dev');
  }

  for (let i = 0; i < fallbackDomains.length; i++) {
    const fromEmail = fallbackDomains[i];
    console.log(`📧 Attempting to send from: ${fromEmail}`);
    
    // Add delay between attempts to avoid rate limiting
    if (i > 0) {
      console.log('⏳ Waiting 3 seconds to avoid rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: recipientEmail,
        subject: `Test Email from VOBVOROT.COM via ${fromEmail}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Test Email - VOBVOROT.COM</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .status {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .info {
                background: #e2e3e5;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>VOBVOROT.COM</h1>
              <p>Email Configuration Test</p>
            </div>
            <div class="content">
              <div class="status">
                <h2>✅ Email Test Successful!</h2>
                <p>Resend API is working and email was sent successfully.</p>
              </div>
              
              ${fromEmail.includes('vobvorot.com') ? '' : `
                <div class="warning">
                  <h3>⚠️ Domain Notice</h3>
                  <p>This email was sent from <strong>${fromEmail}</strong> because vobvorot.com domain is not yet verified in Resend.</p>
                  <p>To use vobvorot.com emails, please verify the domain in Resend dashboard.</p>
                </div>
              `}
              
              <div class="info">
                <h3>Test Details:</h3>
                <ul>
                  <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                  <li><strong>From:</strong> ${fromEmail}</li>
                  <li><strong>To:</strong> ${recipientEmail}</li>
                  <li><strong>Target Domain:</strong> vobvorot.com</li>
                  <li><strong>Service:</strong> Resend</li>
                  <li><strong>Attempt:</strong> ${i + 1} of ${fallbackDomains.length}</li>
                </ul>
              </div>
              
              <p>This email confirms that:</p>
              <ul>
                <li>✅ Resend API key is working</li>
                <li>${fromEmail.includes('vobvorot.com') ? '✅' : '⚠️'} Domain ${fromEmail.includes('vobvorot.com') ? 'vobvorot.com is verified' : 'fallback used - verify vobvorot.com'}</li>
                <li>✅ Email templates are functional</li>
                <li>✅ Delivery is successful</li>
              </ul>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                This is an automated test email. If you received this, the email service is working correctly.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
EMAIL TEST SUCCESSFUL - VOBVOROT.COM

Test Details:
- Timestamp: ${new Date().toISOString()}
- From: ${fromEmail}
- To: ${recipientEmail}
- Target Domain: vobvorot.com
- Service: Resend
- Attempt: ${i + 1} of ${fallbackDomains.length}

This email confirms that:
✅ Resend API key is working
${fromEmail.includes('vobvorot.com') ? '✅ Domain vobvorot.com is verified' : '⚠️ Domain fallback used - verify vobvorot.com in Resend dashboard'}
✅ Email templates are functional
✅ Delivery is successful

${fromEmail.includes('vobvorot.com') ? '' : 'Note: This email was sent from ' + fromEmail + ' because vobvorot.com is not yet verified.'}

This is an automated test email.
        `
      });

      if (error) {
        console.log(`❌ Failed with ${fromEmail}: ${error.message}`);
        if (i === fallbackDomains.length - 1) {
          throw error;
        }
        continue;
      }

      console.log('✅ Email sent successfully!');
      console.log('Email ID:', data.id);
      console.log(`✅ Used sender: ${fromEmail}`);
      
      if (!fromEmail.includes('vobvorot.com')) {
        console.log('\n⚠️  IMPORTANT: Domain vobvorot.com is not verified!');
        console.log('📋 To use vobvorot.com emails:');
        console.log('1. Go to https://resend.com/domains');
        console.log('2. Add and verify vobvorot.com domain');
        console.log('3. Add required DNS records');
        console.log('\nSee DOMAIN_VERIFICATION_GUIDE.md for detailed instructions.\n');
      }
      
      console.log('\n📋 Summary:');
      console.log('- Resend API: ✅ Working');
      console.log(`- Domain: ${fromEmail.includes('vobvorot.com') ? '✅ vobvorot.com verified' : '⚠️ Using fallback domain'}`);
      console.log('- Email delivery: ✅ Successful');
      console.log('\n🎉 Email service is functional!');
      
      return; // Success, exit the function

    } catch (attemptError) {
      console.log(`❌ Failed with ${fromEmail}: ${attemptError.message}`);
      if (i === fallbackDomains.length - 1) {
        console.log('\n❌ All attempts failed!');
        console.log('\n📋 Next steps:');
        console.log('1. Verify vobvorot.com domain in Resend:');
        console.log('   → Go to https://resend.com/domains');
        console.log('   → Add vobvorot.com');
        console.log('   → Configure DNS records');
        console.log('2. For testing, use owner email: m3t.mgmt@gmail.com');
        console.log('3. Check DOMAIN_VERIFICATION_GUIDE.md for details');
        return;
      }
    }
  }
}

// Get recipient email from command line argument or use default
const recipientEmail = process.argv[2] || 'test@example.com';

if (recipientEmail === 'test@example.com') {
  console.log('⚠️  Using default test email. For real testing, run:');
  console.log('   node test-resend.js your-email@example.com\n');
}

testEmail(recipientEmail);