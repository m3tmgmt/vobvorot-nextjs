const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

async function createSessionsTable() {
  // Use the Prisma Accelerate URL
  const DATABASE_URL = process.env.DATABASE_URL;
  console.log('🗄️ Using Prisma Accelerate URL');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Creating telegram_sessions table...');
    
    // Создаем таблицу
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "telegram_sessions" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "telegram_sessions_pkey" PRIMARY KEY ("key")
      )
    `;
    
    console.log('✅ Table created');
    
    // Создаем индекс
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "telegram_sessions_updated_at_idx" 
      ON "telegram_sessions"("updated_at")
    `;
    
    console.log('✅ Index created');
    
    // Проверяем таблицу
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'telegram_sessions'
    `;
    
    console.log('✅ Table exists:', result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSessionsTable();