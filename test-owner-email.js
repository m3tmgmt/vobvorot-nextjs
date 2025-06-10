#!/usr/bin/env node

/**
 * Quick test with owner email to verify Resend API works
 */

const { Resend } = require('resend');

const API_KEY = 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH';
const resend = new Resend(API_KEY);

async function quickTest() {
  console.log('🧪 Quick Resend API Test...\n');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'm3t.mgmt@gmail.com',
      subject: 'VOBVOROT.COM - Resend API Test',
      html: `
        <h1>✅ Resend API Works!</h1>
        <p>This confirms that:</p>
        <ul>
          <li>API key is valid</li>
          <li>Email service is functional</li>
          <li>Ready to configure vobvorot.com domain</li>
        </ul>
        <p><strong>Next step:</strong> Verify vobvorot.com domain in Resend dashboard.</p>
      `
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Success! Email sent to owner.');
    console.log('Email ID:', data.id);
    console.log('\n📋 API Status: ✅ Working');
    console.log('🔧 Next: Verify vobvorot.com domain');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();