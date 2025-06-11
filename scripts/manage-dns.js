import fetch from 'node-fetch';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'HrLxVeVCcynopWIuYhCI1Vo6RVmKhRbPGyHJKl2Z';
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

async function getZoneId(domain) {
  const response = await fetch(`${CLOUDFLARE_API_URL}/zones?name=${domain}`, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (!data.success || !data.result || data.result.length === 0) {
    throw new Error(`Zone not found for domain: ${domain}`);
  }

  return data.result[0].id;
}

async function listDNSRecords(zoneId) {
  const response = await fetch(`${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Failed to list DNS records');
  }

  return data.result;
}

async function createDNSRecord(zoneId, record) {
  const response = await fetch(`${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Failed to create DNS record: ${JSON.stringify(data.errors)}`);
  }

  console.log(`✅ Created DNS record: ${record.type} ${record.name} -> ${record.content.substring(0, 50)}...`);
}

async function checkResendStatus() {
  try {
    console.log('🔍 Getting zone ID for vobvorot.com...');
    const zoneId = await getZoneId('vobvorot.com');
    console.log(`✅ Zone ID: ${zoneId}`);

    console.log('\n📋 Listing current DNS records...');
    const records = await listDNSRecords(zoneId);
    
    // Show current TXT records
    console.log('\n📝 Current TXT records:');
    records
      .filter(r => r.type === 'TXT')
      .forEach(r => {
        console.log(`- ${r.name}: ${r.content.substring(0, 100)}...`);
      });

    // Check if Resend records exist
    const hasResendDKIM = records.some(r => r.name.includes('resend._domainkey'));
    const hasResendVerification = records.some(r => r.name.includes('_resend') || r.content.includes('resend-verification'));

    console.log('\n🔍 Checking Resend records:');
    console.log(`DKIM record (resend._domainkey): ${hasResendDKIM ? '✅ Exists' : '❌ Missing'}`);
    console.log(`Verification record (_resend): ${hasResendVerification ? '✅ Exists' : '❌ Missing'}`);

    // Show next steps
    console.log('\n📋 Next Steps:');
    console.log('1. Open https://resend.com/domains in your browser');
    console.log('2. Click on "vobvorot.com" domain');
    console.log('3. Look for a verification TXT record (might be called _resend or similar)');
    console.log('4. Copy the exact record name and value');
    console.log('5. I can add it automatically to Cloudflare');

    return { zoneId, records, hasResendDKIM, hasResendVerification };

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the check
checkResendStatus()
  .then(() => {
    console.log('\n✅ DNS check completed successfully!');
  })
  .catch(error => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });