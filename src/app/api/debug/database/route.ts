import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        DATABASE_URL_exists: !!process.env.DATABASE_URL,
        DIRECT_URL_exists: !!process.env.DIRECT_URL,
        NODE_ENV: process.env.NODE_ENV
      },
      database_connection: 'unknown',
      categories: [] as any[],
      exvicpmour_products: [] as any[],
      error: null as string | null
    }

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      result.database_connection = 'success'
    } catch (dbError) {
      result.database_connection = 'failed'
      result.error = dbError instanceof Error ? dbError.message : 'Database connection failed'
      return NextResponse.json(result, { status: 200 })
    }

    // Get all categories
    try {
      const categories = await prisma.category.findMany({
        select: { 
          id: true, 
          name: true, 
          slug: true, 
          isActive: true,
          _count: {
            select: {
              products: true
            }
          }
        }
      })
      result.categories = categories
    } catch (error) {
      result.error = `Categories error: ${error instanceof Error ? error.message : 'Unknown'}`
    }

    // Get EXVICPMOUR products specifically
    try {
      const exvicpmourProducts = await prisma.product.findMany({
        where: {
          category: {
            slug: 'exvicpmour'
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          category: {
            select: {
              name: true,
              slug: true,
              isActive: true
            }
          }
        }
      })
      result.exvicpmour_products = exvicpmourProducts
    } catch (error) {
      result.error = `Products error: ${error instanceof Error ? error.message : 'Unknown'}`
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: `System error: ${error instanceof Error ? error.message : 'Unknown'}`
    }, { status: 500 })
  }
}