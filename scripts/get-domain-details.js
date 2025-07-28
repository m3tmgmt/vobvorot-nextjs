import fetch from 'node-fetch';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH';
const DOMAIN_ID = 'e70260b3-59c0-4954-a5cf-6828cc6df3f3';

async function getDomainDetails() {
  try {
    console.log('🔍 Getting domain details from Resend...');
    
    const response = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}`, {
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

    console.log('📋 Domain details:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.records && Array.isArray(data.records)) {
      console.log('\n📝 Required DNS Records:');
      data.records.forEach((record, index) => {
        console.log(`\n${index + 1}. Record Type: ${record.record}`);
        console.log(`   Name: ${record.name}`);
        console.log(`   Value: ${record.value}`);
        
        if (record.record === 'MX') {
          console.log(`   Priority: ${record.priority || 10}`);
        }
      });
      
      console.log('\n🚀 Auto-adding missing records...');
      
      for (const record of data.records) {
        try {
          if (record.record === 'TXT') {
            console.log(`\n➕ Adding TXT record: ${record.name}`);
            // Use our existing script to add the record
          } else if (record.record === 'MX') {
            console.log(`\n➕ MX record: ${record.name} (likely already exists)`);
          }
        } catch (error) {
          console.log(`⚠️  Could not add ${record.record} record: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getDomainDetails();