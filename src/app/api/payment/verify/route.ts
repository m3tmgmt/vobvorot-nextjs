import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { westernbid } from '@/lib/westernbid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { paymentId, orderId } = await request.json()
    
    if (!paymentId || !orderId) {
      return NextResponse.json(
        { error: 'Missing payment ID or order ID' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderId,
        userId: session.user.id
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify payment with WesternBid
    const signature = 'mock_signature' // In real implementation, this would come from the callback
    const verificationResult = await westernbid.verifyPayment(paymentId, signature)
    
    if (verificationResult.success && verificationResult.status === 'completed') {
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully'
      })
    } else {
      // Payment verification failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED'
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Payment verification failed'
      })
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}