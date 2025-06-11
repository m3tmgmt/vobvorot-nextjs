import fetch from 'node-fetch';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'HrLxVeVCcynopWIuYhCI1Vo6RVmKhRbPGyHJKl2Z';
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';
const ZONE_ID = 'd385ba294ceba121edfcdbd7f9b01682'; // vobvorot.com zone ID

async function createMXRecord(name, content, priority = 10, ttl = 3600) {
  const record = {
    type: 'MX',
    name,
    content,
    priority,
    ttl
  };

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
    throw new Error(`Failed to create MX record: ${JSON.stringify(data.errors)}`);
  }

  console.log(`✅ Successfully created MX record:`);
  console.log(`   Type: ${record.type}`);
  console.log(`   Name: ${record.name}`);
  console.log(`   Content: ${record.content}`);
  console.log(`   Priority: ${record.priority}`);
  console.log(`   Record ID: ${data.result.id}`);
  
  return data.result;
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node add-mx-record.js <name> <content> [priority] [ttl]');
  console.log('');
  console.log('Examples:');
  console.log('  node add-mx-record.js send feedback-smtp.us-east-1.amazonses.com');
  console.log('  node add-mx-record.js send feedback-smtp.us-east-1.amazonses.com 10');
  process.exit(1);
}

const [name, content, priority = 10, ttl = 3600] = args;

console.log('🚀 Adding MX record to vobvorot.com...');
console.log('📝 Record details:');
console.log(`   Type: MX`);
console.log(`   Name: ${name}`);
console.log(`   Content: ${content}`);
console.log(`   Priority: ${priority}`);
console.log(`   TTL: ${ttl} seconds`);
console.log('');

createMXRecord(name, content, parseInt(priority), parseInt(ttl))
  .then(() => {
    console.log('\n🎉 MX record added successfully!');
    console.log('');
    console.log('⏱️  DNS propagation may take a few minutes.');
    console.log('🔄 You can check the status in Resend dashboard.');
  })
  .catch(error => {
    console.error('\n❌ Failed to add MX record:', error.message);
    process.exit(1);
  });