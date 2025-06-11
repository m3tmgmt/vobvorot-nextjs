import fetch from 'node-fetch';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH';

async function sendTestToSupport() {
  try {
    console.log('📧 Sending test email to support@vobvorot.com...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@vobvorot.com',
        to: 'support@vobvorot.com',
        subject: '✅ Test Email to Support - vobvorot.com',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Test Email to Support@vobvorot.com</h2>
            <p>This is a test email sent to your GoDaddy email address.</p>
            <hr>
            <p><strong>From:</strong> noreply@vobvorot.com</p>
            <p><strong>To:</strong> support@vobvorot.com</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Domain Status:</strong> Verified ✅</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This email was sent from your verified vobvorot.com domain.
            </p>
          </div>
        `,
        text: `Test Email to Support@vobvorot.com

This is a test email sent to your GoDaddy email address.

From: noreply@vobvorot.com
To: support@vobvorot.com
Sent at: ${new Date().toLocaleString()}
Domain Status: Verified ✅

This email was sent from your verified vobvorot.com domain.`
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log(`📧 Email ID: ${data.id}`);
      console.log(`📫 Sent to: support@vobvorot.com`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      
      console.log('\n📋 Check your GoDaddy email:');
      console.log('1. Login to your GoDaddy account');
      console.log('2. Go to Email & Office Dashboard');
      console.log('3. Check support@vobvorot.com inbox');
      console.log('4. Also check Spam/Junk folder');
      
    } else {
      console.log('❌ Failed to send email:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
}

sendTestToSupport();