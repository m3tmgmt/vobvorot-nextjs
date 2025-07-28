import fetch from 'node-fetch';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH';
const DOMAIN_ID = 'e70260b3-59c0-4954-a5cf-6828cc6df3f3';

async function verifyDomain() {
  try {
    console.log('🔍 Triggering domain verification...');
    
    const response = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('📋 Verification response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Domain verification triggered successfully!');
      
      // Wait a moment and check status again
      console.log('\n⏳ Waiting 10 seconds before checking status...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check status again
      const statusResponse = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const statusData = await statusResponse.json();
      
      console.log('\n📊 Updated domain status:');
      console.log(`Domain Status: ${statusData.status}`);
      
      if (statusData.records) {
        console.log('\n📝 Records Status:');
        statusData.records.forEach((record, index) => {
          const status = record.status || 'pending';
          const emoji = status === 'verified' ? '✅' : status === 'pending' ? '⏳' : '❌';
          console.log(`${emoji} ${record.record} ${record.name}: ${status}`);
        });
      }
      
    } else {
      console.log('\n❌ Verification failed:', data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDomain();