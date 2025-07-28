import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check what status values exist in the database
    const statusValues = await prisma.$queryRaw`
      SELECT DISTINCT status FROM stock_reservations LIMIT 10;
    ` as any[]
    
    // Also check the enum type definition
    const enumValues = await prisma.$queryRaw`
      SELECT e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE t.typname = 'StockReservationStatus'
      ORDER BY e.enumsortorder;
    ` as any[]
    
    return NextResponse.json({
      success: true,
      statusValues: statusValues.map(s => s.status),
      enumValues: enumValues.map(e => e.enum_value),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Status check failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}