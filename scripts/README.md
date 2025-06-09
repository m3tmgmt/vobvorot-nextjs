# Database Migration and Management Scripts

This directory contains comprehensive tools for managing database migrations, backups, and monitoring for the VobVorot store.

## 📁 Script Overview

### 🔄 Migration Scripts
- **`migrate-to-postgres.ts`** - Complete SQLite to PostgreSQL migration tool
- **`seed-production.ts`** - Production database seeding with essential data
- **`deploy-production.sh`** - Complete production deployment automation

### 💾 Backup & Restore
- **`backup-restore.ts`** - Database backup and restore utilities
- Automated backup creation and verification
- Compressed backup storage with retention policies
- One-click restore functionality

### 🔍 Data Quality & Monitoring
- **`data-integrity.ts`** - Comprehensive data integrity checker
- **`performance-monitor.ts`** - Database performance analysis and monitoring
- Automated issue detection and fixing

## 🚀 Quick Start

### Production Migration
```bash
# Complete production deployment (recommended)
npm run deploy:production

# Or step-by-step:
npm run migrate:sqlite-to-postgres
npm run seed:production
npm run integrity:check
```

### Backup Management
```bash
# Create backup
npm run backup:create

# List backups
npm run backup:list

# Restore from backup
npm run backup:restore ./backups/backup-2024-01-01.sql.gz

# Verify backup
npm run backup:verify ./backups/backup-2024-01-01.sql.gz

# Cleanup old backups
npm run backup:cleanup
```

### Data Quality
```bash
# Check data integrity
npm run integrity:check

# Auto-fix common issues
npm run integrity:fix

# Monitor performance
tsx scripts/performance-monitor.ts

# Continuous monitoring
tsx scripts/performance-monitor.ts --continuous --interval 60
```

## 📋 Script Details

### Migration Script (`migrate-to-postgres.ts`)

**Purpose:** Migrates data from SQLite to PostgreSQL with data validation and error handling.

**Features:**
- Preserves all data relationships
- Handles data type conversions
- Provides detailed migration logs
- Validates data integrity during migration
- Error recovery and rollback capabilities

**Usage:**
```bash
# Basic migration
npm run migrate:sqlite-to-postgres

# Direct execution with options
tsx scripts/migrate-to-postgres.ts
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_DATABASE_URL` - Alternative PostgreSQL URL

### Production Seeding (`seed-production.ts`)

**Purpose:** Seeds production database with essential initial data.

**Includes:**
- Default administrator account
- Basic product categories
- Sample product for testing
- System configuration data

**Usage:**
```bash
npm run seed:production
```

**Environment Variables:**
- `ADMIN_EMAIL` - Admin user email (default: admin@vobvorot.com)
- `ADMIN_PASSWORD` - Admin password (default: Admin123!)
- `SITE_NAME` - Site name for branding
- `DEFAULT_CURRENCY` - Default currency code

### Backup & Restore (`backup-restore.ts`)

**Purpose:** Comprehensive backup and restore system with enterprise features.

**Features:**
- Automated PostgreSQL backups using `pg_dump`
- Gzip compression to save storage space
- Backup verification and integrity checking
- Automated cleanup of old backups
- Restore with data validation

**Commands:**
```bash
# Create named backup
tsx scripts/backup-restore.ts create "before-migration"

# Restore from specific backup
tsx scripts/backup-restore.ts restore ./backups/backup-file.sql.gz

# Verify backup integrity
tsx scripts/backup-restore.ts verify ./backups/backup-file.sql.gz

# List all available backups
tsx scripts/backup-restore.ts list

# Clean up old backups (based on retention policy)
tsx scripts/backup-restore.ts cleanup
```

**Configuration:**
- `BACKUP_RETENTION_DAYS` - Days to keep backups (default: 30)
- Backup directory: `./backups/`

### Data Integrity Checker (`data-integrity.ts`)

**Purpose:** Comprehensive data validation and quality assurance.

**Checks:**
- Orphaned records detection
- Business logic validation
- Data quality issues
- Database constraints
- Missing indexes
- Inconsistent data

**Auto-fixes:**
- Sets primary images for products
- Generates missing user names
- Removes orphaned records
- Corrects common data issues

**Usage:**
```bash
# Run integrity check
tsx scripts/data-integrity.ts

# Run with auto-fix
tsx scripts/data-integrity.ts --auto-fix
```

### Performance Monitor (`performance-monitor.ts`)

**Purpose:** Database performance analysis and optimization recommendations.

**Features:**
- Query performance statistics
- Index usage analysis
- Table size monitoring
- Slow query identification
- Connection pool monitoring
- Optimization recommendations

**Usage:**
```bash
# Single performance report
tsx scripts/performance-monitor.ts

# JSON output for automation
tsx scripts/performance-monitor.ts --json

# Continuous monitoring
tsx scripts/performance-monitor.ts --continuous --interval 60
```

**Requirements:**
- PostgreSQL `pg_stat_statements` extension (optional, for advanced metrics)

### Production Deployment (`deploy-production.sh`)

**Purpose:** Complete automated production deployment with safety checks.

**Process:**
1. Environment validation
2. Pre-deployment backup
3. Dependency installation
4. Database migrations
5. Production seeding
6. Application build
7. Data integrity validation
8. Post-deployment backup
9. Cleanup and reporting

**Usage:**
```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

## 🔧 Configuration

### Environment Variables

**Required for Production:**
```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_SECRET="your-secure-secret-32-characters+"
NEXTAUTH_URL="https://yourdomain.com"
```

**Optional Configuration:**
```bash
# Backup settings
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true

# Admin settings
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="SecurePassword123!"

# Monitoring
LOG_LEVEL="warn"
HEALTH_CHECK_ENABLED=true
```

### Database Requirements

**PostgreSQL Setup:**
```sql
-- Create database
CREATE DATABASE vobvorot_production;

-- Create user
CREATE USER vobvorot_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE vobvorot_production TO vobvorot_user;

-- Enable extensions (optional for advanced monitoring)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

## 🔍 Monitoring and Alerts

### Health Checks
The scripts include comprehensive health monitoring:
- Database connectivity
- Data integrity validation
- Performance metrics
- Backup verification

### Logging
All scripts generate detailed logs:
- Migration progress and errors
- Backup creation and verification
- Data integrity issues
- Performance metrics

### Automated Alerts
Set up monitoring for:
- Failed backups
- Data integrity issues
- Performance degradation
- Storage space warnings

## 🚨 Troubleshooting

### Common Issues

**1. Migration Timeout**
```bash
# Increase timeout in PostgreSQL
ALTER SYSTEM SET statement_timeout = '30min';
SELECT pg_reload_conf();
```

**2. Permission Denied**
```bash
# Grant necessary permissions
GRANT ALL ON SCHEMA public TO vobvorot_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO vobvorot_user;
```

**3. Backup Failure**
```bash
# Check disk space
df -h

# Verify PostgreSQL tools
which pg_dump psql

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

**4. Performance Issues**
```bash
# Run performance analysis
tsx scripts/performance-monitor.ts

# Check slow queries
tsx scripts/data-integrity.ts
```

### Log Analysis
```bash
# Check migration logs
tail -f migration-*.log

# Check application logs
tail -f /var/log/vobvorot/app.log

# Monitor PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

## 📚 Best Practices

### Before Migration
1. **Test in staging environment**
2. **Create full backup of current data**
3. **Verify all environment variables**
4. **Test database connectivity**
5. **Review migration plan with team**

### During Migration
1. **Monitor migration progress**
2. **Keep backup accessible**
3. **Document any issues**
4. **Verify each step completion**

### After Migration
1. **Run full integrity check**
2. **Test critical application functions**
3. **Monitor performance metrics**
4. **Update documentation**
5. **Train team on new tools**

### Regular Maintenance
1. **Weekly integrity checks**
2. **Monthly performance reviews**
3. **Quarterly backup testing**
4. **Annual security audits**

## 🆘 Support

For issues with migration scripts:
1. Check the troubleshooting section
2. Review log files for detailed errors
3. Verify environment configuration
4. Test database connectivity
5. Contact technical support with log files

## 📝 Contributing

When modifying migration scripts:
1. Test thoroughly in development
2. Update documentation
3. Add appropriate error handling
4. Include progress logging
5. Maintain backward compatibility