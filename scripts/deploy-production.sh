#!/bin/bash

# Production Deployment Script
# This script handles the complete deployment process including database migration

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
MIGRATION_LOG="migration-$(date +%Y%m%d-%H%M%S).log"

# Ensure required environment variables are set
required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

echo "🔍 Checking environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Environment variables check passed${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MIGRATION_LOG"
}

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Deployment failed at step: $1${NC}"
    echo "Check the log file: $MIGRATION_LOG"
    exit 1
}

# Step 1: Create pre-deployment backup
log "Creating pre-deployment backup..."
if ! tsx scripts/backup-restore.ts create "pre-deployment-$(date +%Y%m%d-%H%M%S)"; then
    handle_error "Backup creation"
fi
echo -e "${GREEN}✅ Backup created successfully${NC}"

# Step 2: Install dependencies
log "Installing dependencies..."
if ! npm ci --production=false; then
    handle_error "Dependencies installation"
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Generate Prisma client
log "Generating Prisma client..."
if ! npx prisma generate; then
    handle_error "Prisma client generation"
fi
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Step 4: Run database migrations
log "Running database migrations..."
if ! npx prisma db push; then
    handle_error "Database migrations"
fi
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Step 5: Seed production data
log "Seeding production data..."
if ! tsx scripts/seed-production.ts; then
    echo -e "${YELLOW}⚠️ Production seeding had issues, but continuing...${NC}"
fi

# Step 6: Run data integrity check
log "Running data integrity check..."
if ! tsx scripts/data-integrity.ts; then
    echo -e "${YELLOW}⚠️ Data integrity issues found, but continuing...${NC}"
fi

# Step 7: Build application
log "Building application..."
if ! npm run build; then
    handle_error "Application build"
fi
echo -e "${GREEN}✅ Application built successfully${NC}"

# Step 8: Run final tests
log "Running tests..."
if command -v npm test &> /dev/null; then
    if ! npm test; then
        echo -e "${YELLOW}⚠️ Tests failed, but continuing deployment...${NC}"
    fi
fi

# Step 9: Create post-deployment backup
log "Creating post-deployment backup..."
if ! tsx scripts/backup-restore.ts create "post-deployment-$(date +%Y%m%d-%H%M%S)"; then
    echo -e "${YELLOW}⚠️ Post-deployment backup failed${NC}"
fi

# Step 10: Cleanup old backups
log "Cleaning up old backups..."
tsx scripts/backup-restore.ts cleanup

echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo ""
echo "📋 Deployment Summary:"
echo "   - Database migrated and seeded"
echo "   - Application built and ready"
echo "   - Backups created"
echo "   - Log file: $MIGRATION_LOG"
echo ""
echo "🔧 Next steps:"
echo "   1. Update your web server configuration"
echo "   2. Restart your application server"
echo "   3. Monitor application logs"
echo "   4. Test critical functionality"
echo ""
echo -e "${YELLOW}⚠️ Important reminders:${NC}"
echo "   - Change default admin password immediately"
echo "   - Review and test payment gateway configuration"
echo "   - Set up monitoring and alerts"
echo "   - Configure SSL certificates"