import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendTelegramNotification } from '@/lib/telegram-notifications'

// Check if request has admin API key
function isAdminRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
  return authHeader === expectedToken
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedParams: { id: string } | undefined
  let session: any
  
  try {
    // Check if this is an admin API request
    const isAdmin = isAdminRequest(request)
    
    if (!isAdmin) {
      // Regular user session check
      session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    resolvedParams = await params
    
    // Build where clause based on user type
    const whereClause = isAdmin 
      ? { id: resolvedParams.id } // Admin can access any order
      : { id: resolvedParams.id, userId: session.user.id } // Users can only access their own orders

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        user: isAdmin, // Include user info for admin requests
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
        },
        payment: isAdmin // Include payment info for admin requests
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    logger.error('Failed to fetch order by ID', {
      orderId: resolvedParams?.id,
      userId: session?.user?.id
    }, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/orders/[id] - Update order (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params
    const body = await request.json()
    
    const { status, notes } = body

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!currentOrder) {
      return NextResponse.json({
        error: 'Order not found'
      }, { status: 404 })
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
        updatedAt: new Date()
      }
    })

    // Create order log entry if status changed
    if (status && status !== currentOrder.status) {
      await prisma.orderLog.create({
        data: {
          orderId: orderId,
          action: 'STATUS_UPDATED',
          details: {
            oldStatus: currentOrder.status,
            newStatus: status,
            updatedAt: new Date().toISOString(),
            source: 'telegram_bot'
          },
          userId: 'telegram_admin'
        }
      })

      // Send Telegram notification about status change
      try {
        const notificationMessage = `📋 Статус заказа изменен\n\n` +
          `🆔 Заказ: #${currentOrder.orderNumber || orderId}\n` +
          `📊 Было: ${currentOrder.status}\n` +
          `📊 Стало: ${status}\n` +
          `👤 Изменено через Telegram`
        
        await sendTelegramNotification(notificationMessage)
      } catch (notificationError) {
        console.warn('Failed to send Telegram notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        updatedAt: updatedOrder.updatedAt
      }
    })

  } catch (error) {
    console.error('Update order API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}