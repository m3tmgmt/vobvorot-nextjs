import fetch from 'node-fetch';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'HrLxVeVCcynopWIuYhCI1Vo6RVmKhRbPGyHJKl2Z';
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';
const ZONE_ID = 'd385ba294ceba121edfcdbd7f9b01682'; // vobvorot.com zone ID

async function createDNSRecord(record) {
  const response = await fetch(`${CLOUDFLARE_API_URL}/zones/${ZONE_ID}/dns_records`, {
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

  console.log(`✅ Successfully created DNS record:`);
  console.log(`   Type: ${record.type}`);
  console.log(`   Name: ${record.name}`);
  console.log(`   Content: ${record.content}`);
  console.log(`   Record ID: ${data.result.id}`);
  
  return data.result;
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node add-dns-record.js <type> <name> <content> [ttl]');
  console.log('');
  console.log('Examples:');
  console.log('  node add-dns-record.js TXT _resend "resend-verification=abc123"');
  console.log('  node add-dns-record.js TXT _resend.vobvorot.com "resend-verification=abc123"');
  console.log('  node add-dns-record.js CNAME test example.com 3600');
  console.log('');
  console.log('📋 To verify Resend domain:');
  console.log('1. Go to https://resend.com/domains');
  console.log('2. Click on vobvorot.com');
  console.log('3. Find the verification TXT record');
  console.log('4. Copy the name and value');
  console.log('5. Run: node add-dns-record.js TXT <name> "<value>"');
  process.exit(1);
}

const [type, name, content, ttl = 3600] = args;

const record = {
  type: type.toUpperCase(),
  name,
  content,
  ttl: parseInt(ttl)
};

console.log('🚀 Adding DNS record to vobvorot.com...');
console.log('📝 Record details:');
console.log(`   Type: ${record.type}`);
console.log(`   Name: ${record.name}`);
console.log(`   Content: ${record.content}`);
console.log(`   TTL: ${record.ttl} seconds`);
console.log('');

createDNSRecord(record)
  .then(() => {
    console.log('\n🎉 DNS record added successfully!');
    console.log('');
    console.log('⏱️  DNS propagation may take a few minutes.');
    console.log('🔄 You can check the status in Resend dashboard.');
  })
  .catch(error => {
    console.error('\n❌ Failed to add DNS record:', error.message);
    process.exit(1);
  });