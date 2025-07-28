import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Simply reset all reservedStock to 0 for now
    await prisma.productSku.updateMany({
      data: {
        reservedStock: 0
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'All reservedStock reset to 0'
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}