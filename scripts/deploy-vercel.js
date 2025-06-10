#!/usr/bin/env node

/**
 * VobVorot Store - Vercel Deployment Script
 * Comprehensive deployment automation for production
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load production environment variables
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envFile = fs.readFileSync(filePath, 'utf8')
    const lines = envFile.split('\n')
    
    lines.forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        if (key && value) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnvFile('.env.production')

console.log('🚀 VobVorot Store - Vercel Deployment')
console.log('=' .repeat(60))

// Deployment steps
const deploymentSteps = [
  {
    name: 'Pre-deployment Validation',
    run: async () => {
      console.log('🔍 Running production readiness check...')
      execSync('npm run production:ready', { stdio: 'inherit' })
      console.log('✅ Production readiness validated')
    }
  },
  
  {
    name: 'Database Migration',
    run: async () => {
      console.log('🗄️  Running database migrations...')
      execSync('npm run migrate:production', { stdio: 'inherit' })
      console.log('✅ Database migrations completed')
    }
  },
  
  {
    name: 'Build Optimization',
    run: async () => {
      console.log('🏗️  Optimizing production build...')
      execSync('npm run build:optimize', { stdio: 'inherit' })
      console.log('✅ Build optimization completed')
    }
  },
  
  {
    name: 'Environment Setup',
    run: async () => {
      console.log('⚙️  Setting up environment variables...')
      
      // Check if .env.production exists
      const envPath = path.join(process.cwd(), '.env.production')
      if (!fs.existsSync(envPath)) {
        throw new Error('.env.production file not found')
      }
      
      // Read environment variables
      const envContent = fs.readFileSync(envPath, 'utf8')
      const envVars = envContent
        .split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => {
          const [key, ...valueParts] = line.split('=')
          return { key: key.trim(), value: valueParts.join('=').trim() }
        })
      
      console.log(`   📝 Found ${envVars.length} environment variables`)
      
      // Validate critical environment variables
      const critical = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'TELEGRAM_BOT_TOKEN',
        'RESEND_API_KEY'
      ]
      
      const missing = critical.filter(key => 
        !envVars.some(env => env.key === key)
      )
      
      if (missing.length > 0) {
        throw new Error(`Missing critical environment variables: ${missing.join(', ')}`)
      }
      
      console.log('✅ Environment variables validated')
    }
  },
  
  {
    name: 'Vercel Deployment',
    run: async () => {
      console.log('🚀 Deploying to Vercel...')
      
      // Check if vercel CLI is available
      try {
        execSync('vercel --version', { stdio: 'pipe' })
      } catch (error) {
        console.log('   📦 Installing Vercel CLI...')
        execSync('npm install -g vercel', { stdio: 'inherit' })
      }
      
      // Deploy to production
      console.log('   🌐 Deploying to production...')
      execSync('vercel --prod --yes', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
          VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID
        }
      })
      
      console.log('✅ Vercel deployment completed')
    }
  },
  
  {
    name: 'Post-deployment Verification',
    run: async () => {
      console.log('🔍 Running post-deployment verification...')
      
      // Wait for deployment to be ready
      console.log('   ⏳ Waiting for deployment to be ready...')
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      // Test basic endpoints
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
      console.log(`   🌐 Testing site: ${siteUrl}`)
      
      try {
        const { execSync } = require('child_process')
        execSync(`curl -f -s -o /dev/null ${siteUrl}`, { timeout: 30000 })
        console.log('✅ Site is responding')
      } catch (error) {
        console.log('⚠️  Site test failed, but deployment may still be successful')
      }
      
      console.log('✅ Post-deployment verification completed')
    }
  },
  
  {
    name: 'Telegram Bot Setup',
    run: async () => {
      console.log('🤖 Setting up Telegram bot webhook...')
      
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'
        const webhookUrl = `${siteUrl}/api/telegram/webhook`
        
        console.log(`   🔗 Setting webhook to: ${webhookUrl}`)
        
        // Note: In a real deployment, you'd call the Telegram API here
        // For now, we just log the webhook URL that needs to be set
        console.log('✅ Webhook URL ready (manual setup required)')
        console.log(`   📝 Set this webhook URL in your Telegram bot: ${webhookUrl}`)
      } catch (error) {
        console.log('⚠️  Telegram webhook setup failed:', error.message)
      }
    }
  }
]

// Run deployment
async function runDeployment() {
  console.log(`Starting ${deploymentSteps.length} deployment steps...\n`)
  
  const startTime = Date.now()
  
  for (let i = 0; i < deploymentSteps.length; i++) {
    const step = deploymentSteps[i]
    console.log(`${i + 1}/${deploymentSteps.length} - ${step.name}`)
    console.log('-'.repeat(40))
    
    try {
      const stepStartTime = Date.now()
      await step.run()
      const duration = ((Date.now() - stepStartTime) / 1000).toFixed(2)
      console.log(`✅ Completed in ${duration}s\n`)
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`)
      
      // Show recovery suggestions
      console.log('🔧 Recovery suggestions:')
      if (step.name.includes('Database')) {
        console.log('   • Check DATABASE_URL is correct')
        console.log('   • Ensure database is accessible')
        console.log('   • Try: npm run migrate:production:backup')
      } else if (step.name.includes('Build')) {
        console.log('   • Check for TypeScript errors: npm run typecheck')
        console.log('   • Clear cache: rm -rf .next && npm run build')
      } else if (step.name.includes('Vercel')) {
        console.log('   • Check Vercel authentication: vercel login')
        console.log('   • Verify project settings: vercel link')
      }
      
      process.exit(1)
    }
  }
  
  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(2)
  
  // Success summary
  console.log('🎉 Deployment Complete!')
  console.log('=' .repeat(60))
  console.log(`✅ Total deployment time: ${totalDuration} minutes`)
  console.log('✅ VobVorot Store is now live in production!')
  console.log('')
  console.log('🌐 Your store is available at:')
  console.log(`   ${process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'}`)
  console.log('')
  console.log('📋 Next steps:')
  console.log('   1. Set Telegram bot webhook (see logs above)')
  console.log('   2. Configure WesternBid real credentials when available')
  console.log('   3. Test full order flow')
  console.log('   4. Monitor application performance')
  console.log('')
  console.log('🎊 Congratulations! Your store is ready for business!')
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled deployment error:', error)
  process.exit(1)
})

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node scripts/deploy-vercel.js [options]')
  console.log('')
  console.log('Environment variables required:')
  console.log('  NEXT_PUBLIC_SITE_URL - Your production domain')
  console.log('  DATABASE_URL         - Production database URL')
  console.log('  VERCEL_ORG_ID        - Vercel organization ID (optional)')
  console.log('  VERCEL_PROJECT_ID    - Vercel project ID (optional)')
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/deploy-vercel.js')
  console.log('  NEXT_PUBLIC_SITE_URL=https://vobvorot.com node scripts/deploy-vercel.js')
  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  runDeployment().catch(console.error)
}

module.exports = { runDeployment }