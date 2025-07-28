const { execSync } = require('child_process');

async function migrateDatabase() {
  try {
    console.log('🔄 Attempting to push database schema changes...');
    
    // Try with db push (for schema changes without migration files)
    const result = execSync('npx prisma db push --accept-data-loss', { 
      encoding: 'utf8',
      stdio: 'inherit' 
    });
    
    console.log('✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Failed to update database schema:', error.message);
    
    // Try alternative approach with migration
    try {
      console.log('🔄 Trying alternative migration approach...');
      execSync('npx prisma migrate deploy', { 
        encoding: 'utf8',
        stdio: 'inherit' 
      });
      console.log('✅ Migration deployed successfully!');
    } catch (migrationError) {
      console.error('❌ Migration also failed:', migrationError.message);
      process.exit(1);
    }
  }
}

migrateDatabase();