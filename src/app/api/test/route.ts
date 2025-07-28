import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    const products = await prisma.product.findMany({
      take: 5
    })
    
    console.log('Found products:', products.length)
    
    return NextResponse.json({
      success: true,
      count: products.length,
      products: products
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}