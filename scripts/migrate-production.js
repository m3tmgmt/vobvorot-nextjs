#!/usr/bin/env node

/**
 * VobVorot Store - Production Database Migration Script
 * Handles database migrations for production deployment
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

console.log('🗄️  VobVorot Store - Production Database Migration')
console.log('=' .repeat(60))

// Environment validation
function validateEnvironment() {
  console.log('🔍 Validating environment...')
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_DATABASE_URL'
  ]
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(envVar => console.error(`   - ${envVar}`))
    process.exit(1)
  }
  
  console.log('✅ Environment validated')
}

// Database connection test
async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...')
  
  try {
    execSync('npx prisma db pull --schema=./prisma/schema.prisma', { 
      stdio: 'pipe',
      timeout: 30000
    })
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed')
    console.error('   Make sure DATABASE_URL is correct and database is accessible')
    process.exit(1)
  }
}

// Run migrations
async function runMigrations() {
  console.log('⚡ Running database migrations...')
  
  try {
    // Generate Prisma client first
    console.log('   📦 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Deploy migrations
    console.log('   🚀 Deploying migrations...')
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL
      }
    })
    
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    
    // Try to get migration status
    try {
      console.log('\n📋 Migration status:')
      execSync('npx prisma migrate status', { stdio: 'inherit' })
    } catch (statusError) {
      console.log('⚠️  Could not get migration status')
    }
    
    process.exit(1)
  }
}

// Seed production data if needed
async function seedProductionData() {
  console.log('🌱 Checking if production seeding is needed...')
  
  try {
    // Check if we have any categories
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    const categoryCount = await prisma.category.count()
    
    if (categoryCount === 0) {
      console.log('   📦 No categories found, running production seed...')
      execSync('npm run seed:production', { stdio: 'inherit' })
      console.log('✅ Production data seeded')
    } else {
      console.log('   ✅ Database already has data, skipping seed')
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.log('⚠️  Could not check/seed production data:', error.message)
    console.log('   You may need to run seed manually: npm run seed:production')
  }
}

// Validate schema after migration
async function validateSchema() {
  console.log('✅ Validating database schema...')
  
  try {
    execSync('npx prisma validate', { stdio: 'pipe' })
    console.log('✅ Schema validation passed')
  } catch (error) {
    console.error('❌ Schema validation failed')
    process.exit(1)
  }
}

// Create backup before migration (if requested)
async function createBackup() {
  if (process.env.CREATE_BACKUP === 'true') {
    console.log('💾 Creating database backup...')
    
    try {
      execSync('npm run backup:create', { stdio: 'inherit' })
      console.log('✅ Backup created successfully')
    } catch (error) {
      console.log('⚠️  Backup failed, but continuing with migration')
    }
  } else {
    console.log('⏭️  Skipping backup (set CREATE_BACKUP=true to enable)')
  }
}

// Main migration process
async function runProductionMigration() {
  console.log('Starting production database migration...\n')
  
  const steps = [
    { name: 'Environment Validation', fn: validateEnvironment },
    { name: 'Database Connection Test', fn: testDatabaseConnection },
    { name: 'Backup Creation', fn: createBackup },
    { name: 'Schema Validation', fn: validateSchema },
    { name: 'Migration Execution', fn: runMigrations },
    { name: 'Production Data Seeding', fn: seedProductionData }
  ]
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    console.log(`${i + 1}/${steps.length} - ${step.name}`)
    console.log('-'.repeat(40))
    
    try {
      const startTime = Date.now()
      await step.fn()
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Completed in ${duration}s\n`)
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`)
      process.exit(1)
    }
  }
  
  console.log('🎉 Production Database Migration Complete!')
  console.log('=' .repeat(60))
  console.log('✅ Database schema is up to date')
  console.log('✅ Migrations deployed successfully')
  console.log('✅ Production data seeded (if needed)')
  console.log('\n🚀 Database is ready for production!')
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node scripts/migrate-production.js [options]')
  console.log('')
  console.log('Environment variables:')
  console.log('  DATABASE_URL         - Prisma database URL (required)')
  console.log('  DIRECT_DATABASE_URL  - Direct database URL (required)')
  console.log('  CREATE_BACKUP=true   - Create backup before migration')
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/migrate-production.js')
  console.log('  CREATE_BACKUP=true node scripts/migrate-production.js')
  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  runProductionMigration().catch(console.error)
}

module.exports = { runProductionMigration }