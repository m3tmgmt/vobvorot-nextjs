import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check what enum types exist
    const enumTypes = await prisma.$queryRaw`
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;
    ` as any[]
    
    return NextResponse.json({
      success: true,
      enumTypes: enumTypes,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Enum check failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}