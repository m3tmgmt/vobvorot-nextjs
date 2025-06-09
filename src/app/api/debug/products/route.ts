import { NextResponse } from 'next/server'
import { sharedProducts } from '@/lib/shared-data'

export async function GET() {
  return NextResponse.json({
    products: sharedProducts,
    count: sharedProducts.length,
    debug: true
  })
}