// Using built-in fetch (Node 18+)

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'HrLxVeVCcynopWIuYhCI1Vo6RVmKhRbPGyHJKl2Z';
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

interface DNSRecord {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

async function getZoneId(domain: string): Promise<string> {
  const response = await fetch(`${CLOUDFLARE_API_URL}/zones?name=${domain}`, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json() as any;
  
  if (!data.success || !data.result || data.result.length === 0) {
    throw new Error(`Zone not found for domain: ${domain}`);
  }

  return data.result[0].id;
}

async function listDNSRecords(zoneId: string): Promise<any[]> {
  const response = await fetch(`${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json() as any;
  
  if (!data.success) {
    throw new Error('Failed to list DNS records');
  }

  return data.result;
}

async function createDNSRecord(zoneId: string, record: DNSRecord): Promise<void> {
  const response = await fetch(`${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  const data = await response.json() as any;
  
  if (!data.success) {
    throw new Error(`Failed to create DNS record: ${JSON.stringify(data.errors)}`);
  }

  console.log(`✅ Created DNS record: ${record.type} ${record.name} -> ${record.content.substring(0, 50)}...`);
}

async function addResendRecords() {
  try {
    console.log('🔍 Getting zone ID for vobvorot.com...');
    const zoneId = await getZoneId('vobvorot.com');
    console.log(`✅ Zone ID: ${zoneId}`);

    console.log('\n📋 Listing current DNS records...');
    const records = await listDNSRecords(zoneId);
    
    // Show current TXT records
    console.log('\nCurrent TXT records:');
    records
      .filter(r => r.type === 'TXT')
      .forEach(r => {
        console.log(`- ${r.name}: ${r.content.substring(0, 100)}...`);
      });

    // Check if Resend records exist
    const hasResendDKIM = records.some(r => r.name.includes('resend._domainkey'));
    const hasResendVerification = records.some(r => r.name === '_resend.vobvorot.com' || r.name === '_resend');

    console.log('\n🔍 Checking Resend records:');
    console.log(`DKIM record (resend._domainkey): ${hasResendDKIM ? '✅ Exists' : '❌ Missing'}`);
    console.log(`Verification record (_resend): ${hasResendVerification ? '✅ Exists' : '❌ Missing'}`);

    // Add missing Resend verification record if needed
    if (!hasResendVerification) {
      console.log('\n➕ Adding Resend verification record...');
      
      // NOTE: You need to get this exact value from Resend dashboard
      // This is just an example format
      await createDNSRecord(zoneId, {
        type: 'TXT',
        name: '_resend',
        content: 'resend-verification=PASTE_YOUR_VERIFICATION_CODE_HERE',
        ttl: 3600,
      });
    }

    console.log('\n✅ DNS check complete!');
    console.log('\n⚠️  IMPORTANT: You need to:');
    console.log('1. Go to https://resend.com/domains');
    console.log('2. Click on vobvorot.com');
    console.log('3. Copy the exact verification TXT record value');
    console.log('4. Update this script with the correct verification code');
    console.log('5. Run the script again');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addResendRecords();