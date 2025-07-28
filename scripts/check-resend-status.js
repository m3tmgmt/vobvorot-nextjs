import fetch from 'node-fetch';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH';

async function checkDomainStatus() {
  try {
    console.log('🔍 Checking Resend domain status...');
    
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.message}`);
    }

    console.log('📋 Resend domains status:');
    console.log(JSON.stringify(data, null, 2));
    
    // Find vobvorot.com domain
    const vobvorotDomain = data.data?.find(domain => domain.name === 'vobvorot.com');
    
    if (vobvorotDomain) {
      console.log('\n✅ Found vobvorot.com domain:');
      console.log(`Status: ${vobvorotDomain.status}`);
      console.log(`Created: ${vobvorotDomain.created_at}`);
      console.log(`Region: ${vobvorotDomain.region}`);
      
      if (vobvorotDomain.records) {
        console.log('\n📝 DNS Records required:');
        vobvorotDomain.records.forEach((record, index) => {
          console.log(`${index + 1}. ${record.record} ${record.name} ${record.value}`);
        });
      }
    } else {
      console.log('❌ vobvorot.com domain not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDomainStatus();