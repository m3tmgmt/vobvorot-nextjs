import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET - Get reviews for a product
export async function GET(request: NextRequest) {
  let productId: string | null = null
  let page: number = 1
  let limit: number = 10
  
  try {
    const { searchParams } = new URL(request.url)
    productId = searchParams.get('productId')
    page = parseInt(searchParams.get('page') || '1')
    limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get reviews with user information
    const reviews = await prisma.review.findMany({
      where: {
        productId: productId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true // We'll only show first letter + domain for privacy
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalReviews = await prisma.review.count({
      where: {
        productId: productId
      }
    })

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        productId: productId
      },
      _avg: {
        rating: true
      }
    })

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId: productId
      },
      _count: {
        rating: true
      }
    })

    // Transform reviews to hide sensitive user info
    const transformedReviews = reviews.map(review => ({
      ...review,
      user: {
        id: review.user.id,
        name: review.user.name || `${review.user.email?.charAt(0).toUpperCase()}***`,
        displayName: review.user.name || `${review.user.email?.split('@')[0].charAt(0).toUpperCase()}***@${review.user.email?.split('@')[1]}`
      }
    }))

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      },
      averageRating: avgRating._avg.rating || 0,
      totalReviews,
      ratingDistribution
    })
  } catch (error) {
    logger.error('Failed to fetch reviews', {
      productId: productId || 'all',
      page,
      limit
    }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  let session: any
  let body: any
  
  try {
    session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    body = await request.json()
    const { productId, rating, comment, title } = body

    // Validate input
    if (!productId || !rating) {
      return NextResponse.json(
        { error: 'Product ID and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      )
    }

    // Check if user has purchased this product (optional validation)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        sku: {
          productId: productId
        },
        order: {
          userId: session.user.id,
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          }
        }
      }
    })

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: productId,
        rating: rating,
        comment: comment || '',
        title: title || ''
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })


    // Transform response to hide sensitive info
    const transformedReview = {
      ...review,
      user: {
        id: review.user.id,
        name: review.user.name || `${review.user.email?.charAt(0).toUpperCase()}***`,
        displayName: review.user.name || `${review.user.email?.split('@')[0].charAt(0).toUpperCase()}***@${review.user.email?.split('@')[1]}`
      }
    }

    return NextResponse.json({
      success: true,
      review: transformedReview
    })
  } catch (error) {
    logger.error('Failed to create review', {
      userId: session?.user?.id,
      productId: body?.productId,
      rating: body?.rating
    }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}