import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DATABASE SCHEMA FIX STARTING ===')
    
    // Step 1: Check current table structure
    console.log('Checking current table structure...')
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_reservations' 
      ORDER BY ordinal_position;
    ` as any[]
    
    console.log('Current stock_reservations columns:', tableInfo)
    
    // Step 2: Drop and recreate table with correct structure
    console.log('Dropping existing table if it exists...')
    await prisma.$executeRaw`DROP TABLE IF EXISTS "stock_reservations" CASCADE;`
    
    console.log('Creating stock_reservations table with full schema...')
    await prisma.$executeRaw`
      CREATE TABLE "stock_reservations" (
        "id" TEXT NOT NULL,
        "skuId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "orderId" TEXT,
        "sessionId" TEXT,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
      );
    `
    
    console.log('Adding foreign key constraints...')
    await prisma.$executeRaw`
      ALTER TABLE "stock_reservations" 
      ADD CONSTRAINT "stock_reservations_skuId_fkey" 
      FOREIGN KEY ("skuId") REFERENCES "product_skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `
    
    await prisma.$executeRaw`
      ALTER TABLE "stock_reservations" 
      ADD CONSTRAINT "stock_reservations_orderId_fkey" 
      FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `
    
    console.log('Creating indexes...')
    await prisma.$executeRaw`CREATE INDEX "stock_reservations_skuId_idx" ON "stock_reservations"("skuId");`
    await prisma.$executeRaw`CREATE INDEX "stock_reservations_expiresAt_idx" ON "stock_reservations"("expiresAt");`
    await prisma.$executeRaw`CREATE INDEX "stock_reservations_sessionId_idx" ON "stock_reservations"("sessionId");`
    
    console.log('Adding unique constraint on orderId...')
    await prisma.$executeRaw`
      ALTER TABLE "stock_reservations" 
      ADD CONSTRAINT "stock_reservations_orderId_key" UNIQUE ("orderId");
    `
    
    // Step 3: Ensure reservedStock field exists in product_skus
    console.log('Ensuring reservedStock field exists in product_skus...')
    await prisma.$executeRaw`
      ALTER TABLE "product_skus" 
      ADD COLUMN IF NOT EXISTS "reservedStock" INTEGER DEFAULT 0;
    `
    
    // Step 4: Verify final structure
    console.log('Verifying final table structure...')
    const finalTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_reservations' 
      ORDER BY ordinal_position;
    ` as any[]
    
    console.log('Final stock_reservations columns:', finalTableInfo)
    
    // Step 5: Test basic operations
    console.log('Testing basic table operations...')
    
    // Find a test SKU
    const testSku = await prisma.productSku.findFirst({
      where: { isActive: true, stock: { gt: 0 } }
    })
    
    if (testSku) {
      console.log('Found test SKU:', testSku.id)
      
      // Test creating a reservation
      const testReservation = await prisma.stockReservation.create({
        data: {
          skuId: testSku.id,
          quantity: 1,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          status: 'ACTIVE'
        }
      })
      
      console.log('Test reservation created:', testReservation.id)
      
      // Test updating reservedStock
      await prisma.productSku.update({
        where: { id: testSku.id },
        data: {
          reservedStock: {
            increment: 1
          }
        }
      })
      
      console.log('ReservedStock incremented successfully')
      
      // Clean up test data
      await prisma.stockReservation.delete({
        where: { id: testReservation.id }
      })
      
      await prisma.productSku.update({
        where: { id: testSku.id },
        data: {
          reservedStock: {
            decrement: 1
          }
        }
      })
      
      console.log('Test data cleaned up')
    }
    
    console.log('=== DATABASE SCHEMA FIX COMPLETED ===')
    
    return NextResponse.json({
      success: true,
      message: 'Database schema fixed successfully',
      originalColumns: tableInfo,
      finalColumns: finalTableInfo,
      testCompleted: !!testSku
    })
    
  } catch (error) {
    console.error('Database fix failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check current database state
    const stockReservationsInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_reservations' 
      ORDER BY ordinal_position;
    ` as any[]
    
    const productSkusInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'product_skus' 
      AND column_name = 'reservedStock';
    ` as any[]
    
    const reservationCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "stock_reservations";
    ` as any[]
    
    return NextResponse.json({
      stockReservationsTable: {
        exists: stockReservationsInfo.length > 0,
        columns: stockReservationsInfo
      },
      reservedStockField: {
        exists: productSkusInfo.length > 0,
        info: productSkusInfo[0] || null
      },
      reservationCount: reservationCount[0]?.count || 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database check failed:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}