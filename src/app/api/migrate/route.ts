import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if StockReservation table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_reservations'
      );
    `
    
    console.log('StockReservation table exists:', tableExists)
    
    // Check if ProductSku has reservedStock field
    const reservedStockFieldExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_skus'
        AND column_name = 'reservedStock'
      );
    `
    
    console.log('ReservedStock field exists:', reservedStockFieldExists)
    
    // Apply migration if needed
    if (!tableExists || !reservedStockFieldExists) {
      console.log('Applying stock reservation migration...')
      
      // Add reservedStock field to ProductSku table if missing
      await prisma.$executeRaw`
        ALTER TABLE "product_skus" 
        ADD COLUMN IF NOT EXISTS "reservedStock" INTEGER DEFAULT 0;
      `
      
      // Create StockReservation table if missing
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "stock_reservations" (
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
      
      // Add missing columns if table exists but is incomplete
      try {
        await prisma.$executeRaw`
          ALTER TABLE "stock_reservations" 
          ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
        `
        console.log('Added sessionId column if missing')
      } catch (e) {
        console.log('sessionId column already exists or error:', e)
      }
      
      try {
        await prisma.$executeRaw`
          ALTER TABLE "stock_reservations" 
          ADD COLUMN IF NOT EXISTS "orderId" TEXT;
        `
        console.log('Added orderId column if missing')
      } catch (e) {
        console.log('orderId column already exists or error:', e)
      }
      
      // Add foreign key constraint if table was just created
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        DROP CONSTRAINT IF EXISTS "stock_reservations_skuId_fkey";
      `
      
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        ADD CONSTRAINT "stock_reservations_skuId_fkey" 
        FOREIGN KEY ("skuId") REFERENCES "product_skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `
      
      // Add order foreign key constraint
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        DROP CONSTRAINT IF EXISTS "stock_reservations_orderId_fkey";
      `
      
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        ADD CONSTRAINT "stock_reservations_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `
      
      // Create indexes
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "stock_reservations_skuId_idx" ON "stock_reservations"("skuId");
      `
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "stock_reservations_expiresAt_idx" ON "stock_reservations"("expiresAt");
      `
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "stock_reservations_sessionId_idx" ON "stock_reservations"("sessionId");
      `
      
      // Add unique constraint on orderId
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        DROP CONSTRAINT IF EXISTS "stock_reservations_orderId_key";
      `
      
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        ADD CONSTRAINT "stock_reservations_orderId_key" UNIQUE ("orderId");
      `
      
      console.log('Migration completed successfully')
    }
    
    // Test the reservation system
    try {
      // Try to find a product SKU to test with
      const testSku = await prisma.productSku.findFirst({
        where: { isActive: true, stock: { gt: 0 } }
      })
      
      if (testSku) {
        console.log('Test SKU found:', testSku.id, 'stock:', testSku.stock, 'reserved:', testSku.reservedStock)
        
        // Test creating a reservation
        const testReservation = await prisma.stockReservation.create({
          data: {
            skuId: testSku.id,
            quantity: 1,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            status: 'ACTIVE'
          }
        })
        
        console.log('Test reservation created:', testReservation.id)
        
        // Clean up test reservation
        await prisma.stockReservation.delete({
          where: { id: testReservation.id }
        })
        
        console.log('Test reservation cleaned up')
      }
    } catch (testError) {
      console.error('Test failed:', testError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration check and application completed',
      tableExists,
      reservedStockFieldExists
    })
    
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check database status
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_reservations'
      );
    ` as any[]
    
    const reservedStockFieldExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_skus'
        AND column_name = 'reservedStock'
      );
    ` as any[]
    
    // Count reservations
    let reservationCount = 0
    try {
      reservationCount = await prisma.stockReservation.count()
    } catch (e) {
      console.log('Could not count reservations:', e)
    }
    
    return NextResponse.json({
      status: 'ok',
      stockReservationTableExists: tableExists[0]?.exists || false,
      reservedStockFieldExists: reservedStockFieldExists[0]?.exists || false,
      reservationCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Status check failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}