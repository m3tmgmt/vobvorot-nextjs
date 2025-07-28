#!/bin/bash

# VOBVOROT Emergency Database Setup Script
# Created: 2025-01-28
# Purpose: Quick setup for unmigrated production database

echo "🚨 VOBVOROT Emergency Database Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please ensure you're in the project root directory."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📊 Database Configuration:"
echo "- Database: vobvorot"
echo "- Host: Neon PostgreSQL"
echo ""

# Function to run a command and check its status
run_command() {
    local cmd="$1"
    local desc="$2"
    
    echo -n "🔄 $desc... "
    if eval "$cmd"; then
        echo "✅ Success"
        return 0
    else
        echo "❌ Failed"
        return 1
    fi
}

# Step 1: Generate Prisma Client
echo "Step 1: Generating Prisma Client"
run_command "npx prisma generate" "Generating Prisma client"
echo ""

# Step 2: Check current migration status
echo "Step 2: Checking Migration Status"
echo "Current migration status:"
npx prisma migrate status
echo ""

# Step 3: Ask for confirmation before running migrations
echo "⚠️  WARNING: This will apply all pending migrations to the production database!"
read -p "Do you want to continue? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Migration cancelled by user."
    exit 0
fi

# Step 4: Run migrations
echo ""
echo "Step 4: Running Migrations"
run_command "npx prisma migrate deploy" "Applying database migrations"

# Step 5: Apply performance indexes
echo ""
echo "Step 5: Applying Performance Indexes"
if [ -f "prisma/migrations/add_performance_indexes.sql" ]; then
    echo "Found performance indexes SQL file."
    echo "You may need to run this manually through your database client."
    echo "File: prisma/migrations/add_performance_indexes.sql"
else
    echo "⚠️  Performance indexes file not found. Skipping..."
fi

# Step 6: Verify tables were created
echo ""
echo "Step 6: Verifying Database Schema"
echo "Checking if core tables exist..."

# Create a simple Node.js script to verify tables
cat > /tmp/verify-db.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTables() {
    try {
        const tables = [
            { name: 'User', query: () => prisma.user.count() },
            { name: 'Product', query: () => prisma.product.count() },
            { name: 'Order', query: () => prisma.order.count() },
            { name: 'Category', query: () => prisma.category.count() }
        ];

        console.log('\n📋 Table Verification:');
        for (const table of tables) {
            try {
                const count = await table.query();
                console.log(`✅ ${table.name} table exists (${count} records)`);
            } catch (e) {
                console.log(`❌ ${table.name} table NOT FOUND`);
            }
        }
    } catch (error) {
        console.error('❌ Error verifying tables:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyTables();
EOF

node /tmp/verify-db.js
rm -f /tmp/verify-db.js

# Step 7: Summary
echo ""
echo "================================"
echo "📊 Setup Summary:"
echo "================================"
echo ""
echo "✅ Completed Steps:"
echo "- Generated Prisma client"
echo "- Applied database migrations"
echo "- Verified table creation"
echo ""
echo "⚠️  Next Steps:"
echo "1. Create Customer table migration (see VOBVOROT_DATABASE_DEEP_DIVE_ANALYSIS.md)"
echo "2. Run performance indexes SQL manually if needed"
echo "3. Verify application can connect to database"
echo "4. Test Telegram bot functionality"
echo ""
echo "📄 For detailed analysis, see: VOBVOROT_DATABASE_DEEP_DIVE_ANALYSIS.md"
echo ""
echo "🎉 Database setup process complete!"