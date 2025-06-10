import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailService, type OrderEmailData } from '@/lib/email'
import { logger } from '@/lib/logger'

interface UpdateStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  trackingNumber?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined
  let session: any
  let status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | undefined
  
  try {
    const resolvedParams = await params
    id = resolvedParams.id
    session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const requestData: UpdateStatusRequest = await request.json()
    status = requestData.status
    const trackingNumber = requestData.trackingNumber
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingNumber && { paymentId: trackingNumber }) // Store tracking number in paymentId field for now
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

    // Send status update email to customer
    try {
      logger.info('Sending order status update email', {
        orderNumber: order.orderNumber,
        newStatus: status,
        customerEmail: updatedOrder.shippingEmail,
        hasTrackingNumber: !!trackingNumber
      })
      
      const emailData: OrderEmailData = {
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.shippingName,
        customerEmail: updatedOrder.shippingEmail,
        items: updatedOrder.items.map(item => ({
          name: item.sku.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          size: item.sku.size || undefined,
          color: item.sku.color || undefined,
          imageUrl: item.sku.product.images[0]?.url
        })),
        subtotal: Number(updatedOrder.subtotal),
        shippingCost: Number(updatedOrder.shippingCost),
        total: Number(updatedOrder.total),
        shippingAddress: {
          name: updatedOrder.shippingName,
          address: updatedOrder.shippingAddress,
          city: updatedOrder.shippingCity,
          country: updatedOrder.shippingCountry,
          zip: updatedOrder.shippingZip
        },
        status: updatedOrder.status,
        trackingNumber
      }

      await emailService.sendOrderStatusUpdate(emailData)
      
      logger.info('Order status update email sent successfully', {
        orderNumber: order.orderNumber,
        newStatus: status,
        customerEmail: updatedOrder.shippingEmail
      })
    } catch (emailError) {
      logger.error('Failed to send order status update email', {
        orderNumber: order.orderNumber,
        newStatus: status,
        customerEmail: updatedOrder.shippingEmail
      }, emailError instanceof Error ? emailError : new Error(String(emailError)))
      // Don't fail the status update if email fails
    }

    return NextResponse.json({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      trackingNumber,
      message: 'Order status updated successfully'
    })

  } catch (error) {
    logger.error('Failed to update order status', {
      orderId: id,
      newStatus: status,
      adminUserId: session?.user?.id
    }, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}