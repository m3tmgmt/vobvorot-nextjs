import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXING SCHEMA MISMATCH ===')
    
    // Step 1: Check current structure
    const currentColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stock_reservations' 
      ORDER BY ordinal_position;
    ` as any[]
    
    console.log('Current columns:', currentColumns.map(c => c.column_name))
    
    // Step 2: Add missing sessionId column
    if (!currentColumns.some(c => c.column_name === 'sessionId')) {
      console.log('Adding sessionId column...')
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        ADD COLUMN "sessionId" TEXT;
      `
    }
    
    // Step 3: Drop columns that don't match our schema
    if (currentColumns.some(c => c.column_name === 'status')) {
      console.log('Dropping status column...')
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        DROP COLUMN IF EXISTS "status";
      `
    }
    
    if (currentColumns.some(c => c.column_name === 'updatedAt')) {
      console.log('Dropping updatedAt column...')
      await prisma.$executeRaw`
        ALTER TABLE "stock_reservations" 
        DROP COLUMN IF EXISTS "updatedAt";
      `
    }
    
    // Step 4: Make orderId nullable (our schema has it as optional)
    console.log('Making orderId nullable...')
    await prisma.$executeRaw`
      ALTER TABLE "stock_reservations" 
      ALTER COLUMN "orderId" DROP NOT NULL;
    `
    
    // Step 5: Verify final structure
    const finalColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'stock_reservations' 
      ORDER BY ordinal_position;
    ` as any[]
    
    console.log('Final structure:', finalColumns)
    
    // Step 6: Test the fixed schema
    console.log('Testing schema...')
    
    const testSku = await prisma.productSku.findFirst({
      where: { isActive: true, stock: { gt: 0 } }
    })
    
    if (testSku) {
      console.log('Creating test reservation...')
      const testReservation = await prisma.stockReservation.create({
        data: {
          skuId: testSku.id,
          quantity: 1,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          status: 'ACTIVE'
        }
      })
      
      console.log('Test reservation created successfully:', testReservation.id)
      
      // Clean up
      await prisma.stockReservation.delete({
        where: { id: testReservation.id }
      })
      
      console.log('Test reservation cleaned up')
    }
    
    console.log('=== SCHEMA FIX COMPLETED ===')
    
    return NextResponse.json({
      success: true,
      message: 'Schema fixed successfully',
      originalColumns: currentColumns.map(c => c.column_name),
      finalColumns: finalColumns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable
      })),
      testPassed: !!testSku
    })
    
  } catch (error) {
    console.error('Schema fix failed:', error)
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