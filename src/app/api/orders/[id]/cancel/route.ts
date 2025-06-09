import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const orderId = id

    // Find the order and verify ownership
    const order = await prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: {
          include: {
            sku: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING', 'CONFIRMED']
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}` },
        { status: 400 }
      )
    }

    // Update order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Restore inventory for cancelled items
    for (const item of order.items) {
      await prisma.productSku.update({
        where: {
          id: item.skuId
        },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Order cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}