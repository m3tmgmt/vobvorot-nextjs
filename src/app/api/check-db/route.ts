import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check current table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_reservations' 
      ORDER BY ordinal_position;
    ` as any[]
    
    return NextResponse.json({
      success: true,
      columns: tableInfo.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable
      })),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database check failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}