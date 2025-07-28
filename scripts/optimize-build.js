#!/usr/bin/env node

/**
 * VobVorot Store - Production Build Optimizer
 * Optimizes build for production deployment
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 VobVorot Store - Production Build Optimizer')
console.log('=' .repeat(60))

// Build optimization steps
const optimizations = [
  {
    name: 'Clean Previous Build',
    run: () => {
      try {
        execSync('rm -rf .next', { stdio: 'inherit' })
        console.log('✅ Cleaned .next directory')
      } catch (error) {
        console.log('⚠️  No previous build to clean')
      }
    }
  },
  
  {
    name: 'Install Dependencies',
    run: () => {
      console.log('📦 Installing dependencies...')
      execSync('npm ci --production=false', { stdio: 'inherit' })
      console.log('✅ Dependencies installed')
    }
  },
  
  {
    name: 'Type Check',
    run: () => {
      console.log('🔍 Running TypeScript check...')
      try {
        execSync('npx tsc --noEmit', { stdio: 'inherit' })
        console.log('✅ TypeScript check passed')
      } catch (error) {
        console.error('❌ TypeScript errors found')
        process.exit(1)
      }
    }
  },
  
  {
    name: 'Database Generation',
    run: () => {
      console.log('🗄️  Generating Prisma client...')
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('✅ Prisma client generated')
    }
  },
  
  {
    name: 'Production Build',
    run: () => {
      console.log('🏗️  Building for production...')
      execSync('npm run build', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          SKIP_ENV_VALIDATION: 'true'
        }
      })
      console.log('✅ Production build completed')
    }
  },
  
  {
    name: 'Bundle Analysis',
    run: () => {
      if (process.env.ANALYZE === 'true') {
        console.log('📊 Running bundle analysis...')
        execSync('ANALYZE=true npm run build', { stdio: 'inherit' })
        console.log('✅ Bundle analysis completed')
      } else {
        console.log('⏭️  Skipping bundle analysis (set ANALYZE=true to enable)')
      }
    }
  },
  
  {
    name: 'Validate Build Output',
    run: () => {
      console.log('✅ Validating build output...')
      const buildDir = path.join(process.cwd(), '.next')
      
      if (!fs.existsSync(buildDir)) {
        throw new Error('Build directory not found')
      }
      
      const staticDir = path.join(buildDir, 'static')
      if (!fs.existsSync(staticDir)) {
        throw new Error('Static assets not found')
      }
      
      const serverDir = path.join(buildDir, 'server')
      if (!fs.existsSync(serverDir)) {
        throw new Error('Server build not found')
      }
      
      console.log('✅ Build output validated')
    }
  }
]

// Run optimizations
async function runOptimizations() {
  console.log(`Starting ${optimizations.length} optimization steps...\n`)
  
  for (let i = 0; i < optimizations.length; i++) {
    const optimization = optimizations[i]
    console.log(`${i + 1}/${optimizations.length} - ${optimization.name}`)
    console.log('-'.repeat(40))
    
    try {
      const startTime = Date.now()
      await optimization.run()
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Completed in ${duration}s\n`)
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`)
      process.exit(1)
    }
  }
  
  // Final summary
  console.log('🎉 Build Optimization Complete!')
  console.log('=' .repeat(60))
  console.log('✅ TypeScript compiled successfully')
  console.log('✅ Prisma client generated')
  console.log('✅ Production build optimized')
  console.log('✅ Ready for deployment!')
  console.log('')
  console.log('Next steps:')
  console.log('  vercel --prod')
  console.log('  or')
  console.log('  npm run deploy')
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run if called directly
if (require.main === module) {
  runOptimizations().catch(console.error)
}

module.exports = { runOptimizations }