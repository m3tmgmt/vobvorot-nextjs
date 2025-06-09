# Database Migration Guide: SQLite to PostgreSQL

This guide provides step-by-step instructions for migrating your VobVorot store from SQLite (development) to PostgreSQL (production).

## Prerequisites

### System Requirements
- Node.js 18+ with npm
- PostgreSQL 14+ server
- `pg_dump` and `psql` utilities installed
- Access to your current SQLite database

### Environment Setup
1. Ensure your PostgreSQL server is running and accessible
2. Create a new PostgreSQL database for production
3. Set up appropriate database users and permissions

## Migration Process

### Step 1: Prepare Production Environment

1. **Copy environment configuration:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Configure your PostgreSQL connection:**
   ```bash
   # Edit .env.production
   DATABASE_URL="postgresql://username:password@host:5432/database_name"
   DIRECT_DATABASE_URL="postgresql://username:password@host:5432/database_name"
   ```

3. **Set other production variables:**
   - `NEXTAUTH_SECRET`: Generate a secure secret (32+ characters)
   - `NEXTAUTH_URL`: Your production domain
   - Payment gateway credentials
   - Email service configuration
   - Cloudinary settings

### Step 2: Create Production Database Schema

1. **Generate Prisma client for PostgreSQL:**
   ```bash
   npm run db:generate
   ```

2. **Push schema to PostgreSQL:**
   ```bash
   npm run db:push
   ```

### Step 3: Data Migration Options

#### Option A: Automated Migration (Recommended)
Use our automated migration script that handles data conversion and validation:

```bash
# Run the complete migration
npm run migrate:sqlite-to-postgres
```

#### Option B: Manual Migration
If you need more control over the process:

1. **Export data from SQLite:**
   ```bash
   # Create data dump from SQLite
   sqlite3 prisma/dev.db ".dump" > sqlite_dump.sql
   ```

2. **Run migration script with custom source:**
   ```bash
   tsx scripts/migrate-to-postgres.ts --source sqlite_dump.sql
   ```

### Step 4: Seed Production Data

1. **Run production seeding:**
   ```bash
   npm run seed:production
   ```

2. **Verify seeded data:**
   - Admin user created
   - Default categories added
   - Sample product (remove after adding real products)

### Step 5: Data Integrity Validation

1. **Check data integrity:**
   ```bash
   npm run integrity:check
   ```

2. **Auto-fix common issues:**
   ```bash
   npm run integrity:fix
   ```

### Step 6: Production Deployment

1. **Run complete deployment process:**
   ```bash
   npm run deploy:production
   ```

This script will:
- Create pre-deployment backup
- Install dependencies
- Generate Prisma client
- Run migrations
- Seed production data
- Build application
- Run integrity checks
- Create post-deployment backup

## Key Changes in PostgreSQL Schema

### Data Type Conversions
- `Float` → `Decimal` for monetary values (better precision)
- `Int` → `BigInt` for file sizes
- Enhanced text fields for better search capabilities

### New Features Added
- **User enhancements:**
  - Extended user profile fields
  - Address management
  - User preferences and settings

- **Product improvements:**
  - Cloudinary integration for images
  - SEO metadata fields
  - Enhanced inventory tracking
  - Product variants support

- **Order enhancements:**
  - Detailed pricing breakdown (tax, discount)
  - Tracking information
  - Internal notes for admin

- **Performance optimizations:**
  - Strategic indexes for frequent queries
  - Full-text search on products
  - Optimized foreign key relationships

### New Tables
- `user_addresses`: Store multiple addresses per user
- Enhanced product image management with Cloudinary support

## Backup and Restore

### Creating Backups
```bash
# Create a backup with custom name
npm run backup:create "before-migration"

# Create automatic backup
npm run backup:create
```

### Restoring from Backup
```bash
# Restore from specific backup
npm run backup:restore ./backups/backup-2024-01-01.sql.gz

# List available backups
npm run backup:list
```

### Backup Verification
```bash
# Verify backup integrity
npm run backup:verify ./backups/backup-2024-01-01.sql.gz
```

### Automated Cleanup
```bash
# Remove backups older than retention period (default: 30 days)
npm run backup:cleanup
```

## Monitoring and Maintenance

### Health Checks
The system includes built-in health monitoring:
- Database connectivity
- Data integrity validation
- Performance metrics

### Regular Maintenance
1. **Weekly integrity checks:**
   ```bash
   npm run integrity:check
   ```

2. **Monthly backup verification:**
   ```bash
   npm run backup:verify <latest_backup>
   ```

3. **Quarterly full data audit:**
   ```bash
   npm run integrity:check > audit-$(date +%Y%m%d).log
   ```

## Troubleshooting

### Common Issues

#### 1. Connection Timeout
**Problem:** Database connection fails during migration
**Solution:**
- Check PostgreSQL server status
- Verify connection string format
- Ensure database exists and user has permissions

#### 2. Data Type Conversion Errors
**Problem:** Some data doesn't convert properly
**Solution:**
- Check the migration log for specific errors
- Use the manual migration option for problematic records
- Contact support for complex data issues

#### 3. Missing Indexes
**Problem:** Slow query performance after migration
**Solution:**
```bash
# The schema includes optimized indexes, but if needed:
npm run integrity:check  # Will highlight missing indexes
```

#### 4. Orphaned Records
**Problem:** Referential integrity issues
**Solution:**
```bash
# Auto-fix common orphan issues
npm run integrity:fix
```

### Getting Help
- Check migration logs in `migration-YYYYMMDD-HHMMSS.log`
- Run integrity checks for detailed issue reports
- Review backup files to ensure data safety

## Security Considerations

### Production Security Checklist
- [ ] Change default admin password immediately
- [ ] Review and update all API keys and secrets
- [ ] Configure SSL/TLS for database connections
- [ ] Set up VPN or IP restrictions for database access
- [ ] Enable database audit logging
- [ ] Configure backup encryption
- [ ] Set up monitoring and alerting

### Data Privacy
- Ensure GDPR/privacy compliance
- Review data retention policies
- Configure appropriate data masking for logs
- Set up secure backup storage

## Performance Optimization

### Database Optimization
The new schema includes:
- Strategic indexes on frequently queried columns
- Full-text search capabilities
- Optimized foreign key relationships
- Proper data types for performance

### Application Optimization
- Connection pooling configured
- Query optimization with Prisma
- Caching strategies implemented
- Background job processing

## Next Steps

After successful migration:
1. **Remove sample data:** Delete the sample product and test data
2. **Configure monitoring:** Set up application and database monitoring
3. **Performance testing:** Run load tests to ensure scalability
4. **User acceptance testing:** Test all critical user flows
5. **Go-live preparation:** Coordinate with your team for the switch

## Support

For migration support or issues:
- Check the troubleshooting section above
- Review logs and error messages
- Ensure all prerequisites are met
- Contact technical support if needed