import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailService, type OrderEmailData } from '@/lib/email'

interface UpdateStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  trackingNumber?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status, trackingNumber }: UpdateStatusRequest = await request.json()
    
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
      console.log(`Sending status update email for order: ${order.orderNumber}`)
      
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
      
      console.log(`Status update email sent successfully for order: ${order.orderNumber}`)
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
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
    console.error('Order status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}