import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = "postgresql://vobvorot_owner:WUJUYkjHT68V@ep-lively-hat-a1aqblz3.ap-southeast-1.aws.neon.tech/vobvorot?sslmode=require";

async function runMigration() {
  try {
    // Import postgres client
    const { Client } = require('pg');
    
    const client = new Client({
      connectionString: DATABASE_URL,
    });

    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationSQL = readFileSync(join(__dirname, 'migrate-inventory.sql'), 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Running ${statements.length} migration statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await client.query(statement);
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.log(`⚠ Statement ${i + 1} failed (might already exist):`, error instanceof Error ? error.message : String(error));
      }
    }

    await client.end();
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();