#!/usr/bin/env node

/**
 * Email Testing Script
 * 
 * Использование:
 * node scripts/test-email.js <type> <email>
 * 
 * Где type может быть: test, order-confirmation, admin-notification, status-update
 * 
 * Примеры:
 * node scripts/test-email.js test user@example.com
 * node scripts/test-email.js order-confirmation customer@example.com
 */

const https = require('https')

const [,, type, email] = process.argv

if (!type || !email) {
  console.log('Usage: node scripts/test-email.js <type> <email>')
  console.log('Types: test, order-confirmation, admin-notification, status-update')
  console.log('Example: node scripts/test-email.js test user@example.com')
  process.exit(1)
}

const validTypes = ['test', 'order-confirmation', 'admin-notification', 'status-update']
if (!validTypes.includes(type)) {
  console.log('Invalid type. Valid types:', validTypes.join(', '))
  process.exit(1)
}

const data = JSON.stringify({
  type: type,
  email: email
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/test/email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}

const req = https.request(options, (res) => {
  let responseData = ''

  res.on('data', (chunk) => {
    responseData += chunk
  })

  res.on('end', () => {
    try {
      const result = JSON.parse(responseData)
      
      if (res.statusCode === 200) {
        console.log('✅ Success:', result.message)
      } else {
        console.log('❌ Error:', result.error)
      }
    } catch (error) {
      console.log('❌ Failed to parse response:', responseData)
    }
  })
})

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message)
  console.log('Make sure the development server is running (npm run dev)')
})

console.log(`🚀 Sending ${type} email to ${email}...`)
req.write(data)
req.end()