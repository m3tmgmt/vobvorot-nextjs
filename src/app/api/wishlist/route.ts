import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Retrieve user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            },
            category: true,
            skus: {
              orderBy: { price: 'asc' },
              take: 1
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to match frontend wishlist structure
    const transformedItems = wishlistItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Math.min(...item.product.skus.map(sku => Number(sku.price))), // Get minimum price from SKUs
      brand: item.product.brand,
      images: item.product.images,
      category: item.product.category,
      skus: item.product.skus,
      addedAt: item.createdAt
    }))

    return NextResponse.json({
      items: transformedItems,
      itemCount: transformedItems.length,
      isOpen: false
    })
  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add item to wishlist or sync wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Sync entire wishlist
    if (body.action === 'sync' && body.items) {
      const { items } = body

      // Clear existing wishlist items
      await prisma.wishlistItem.deleteMany({
        where: {
          userId: session.user.id
        }
      })

      // Add new wishlist items
      if (items.length > 0) {
        const wishlistItemsData = items.map((item: any) => ({
          userId: session.user.id,
          productId: item.id
        }))

        await prisma.wishlistItem.createMany({
          data: wishlistItemsData
        })
      }

      return NextResponse.json({ success: true })
    }

    // Add single item to wishlist
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if item already exists
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item already in wishlist' },
        { status: 409 }
      )
    }

    // Add to wishlist
    await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        productId: productId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wishlist add error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      // Clear entire wishlist
      await prisma.wishlistItem.deleteMany({
        where: {
          userId: session.user.id
        }
      })
    } else {
      // Remove specific item
      await prisma.wishlistItem.delete({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: productId
          }
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wishlist remove error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}