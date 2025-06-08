import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
// import { prisma } from '@/lib/prisma' // Commented out - cart is client-side only

interface CartItem {
  productId: string
  skuId: string
  quantity: number
  price: number
  selectedSize?: string
  selectedColor?: string
}

// GET - Get cart details for guest users (returns empty for auth users)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For authenticated users, cart is handled client-side
    if (session?.user?.id) {
      return NextResponse.json({
        items: [],
        total: 0,
        itemCount: 0,
        isOpen: false
      })
    }

    // For guest users, return empty cart
    return NextResponse.json({
      items: [],
      total: 0,
      itemCount: 0,
      isOpen: false
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Disabled until database is configured
// export async function POST(request: NextRequest) {
//   return NextResponse.json({ cart: [] })
// }