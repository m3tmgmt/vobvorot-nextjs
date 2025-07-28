import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { emailService, type OrderEmailData, type AdminNotificationData } from '@/lib/email'

interface TestEmailRequest {
  type: 'test' | 'order-confirmation' | 'admin-notification' | 'status-update'
  email: string
}

export async function POST(request: NextRequest) {
  let type: string = 'test'
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const requestData: TestEmailRequest = await request.json()
    type = requestData.type
    const { email } = requestData
    
    if (!type || !email) {
      return NextResponse.json(
        { error: 'Type and email are required' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'test':
        await emailService.sendTestEmail(email)
        break

      case 'order-confirmation':
        const mockOrderData: OrderEmailData = {
          orderNumber: 'EXV-TEST-123456',
          customerName: 'John Doe',
          customerEmail: email,
          items: [
            {
              name: 'Sample Product',
              quantity: 2,
              price: 29.99,
              size: 'M',
              color: 'Black',
              imageUrl: 'https://via.placeholder.com/150'
            },
            {
              name: 'Another Product',
              quantity: 1,
              price: 49.99,
              color: 'Blue'
            }
          ],
          subtotal: 109.97,
          shippingCost: 9.99,
          total: 119.96,
          shippingAddress: {
            name: 'John Doe',
            address: '123 Test Street',
            city: 'Test City',
            country: 'Test Country',
            zip: '12345'
          }
        }
        await emailService.sendOrderConfirmation(mockOrderData)
        break

      case 'admin-notification':
        const mockAdminData: AdminNotificationData = {
          orderNumber: 'EXV-TEST-123456',
          customerName: 'John Doe',
          customerEmail: 'customer@example.com',
          total: 119.96,
          itemCount: 3,
          paymentMethod: 'WesternBid',
          shippingAddress: '123 Test Street, Test City, Test Country'
        }
        // Override email to send to the specified address
        const originalAdminEmail = process.env.ADMIN_EMAIL
        process.env.ADMIN_EMAIL = email
        await emailService.sendAdminOrderNotification(mockAdminData)
        process.env.ADMIN_EMAIL = originalAdminEmail
        break

      case 'status-update':
        const mockStatusData: OrderEmailData = {
          orderNumber: 'EXV-TEST-123456',
          customerName: 'John Doe',
          customerEmail: email,
          items: [
            {
              name: 'Sample Product',
              quantity: 2,
              price: 29.99,
              size: 'M',
              color: 'Black'
            }
          ],
          subtotal: 59.98,
          shippingCost: 9.99,
          total: 69.97,
          shippingAddress: {
            name: 'John Doe',
            address: '123 Test Street',
            city: 'Test City',
            country: 'Test Country',
            zip: '12345'
          },
          status: 'SHIPPED',
          trackingNumber: 'TRACK123456789'
        }
        await emailService.sendOrderStatusUpdate(mockStatusData)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully to ${email}`
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: `Failed to send ${type} email: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email testing endpoint',
    usage: 'POST with { type: "test|order-confirmation|admin-notification|status-update", email: "test@example.com" }',
    types: {
      'test': 'Send a simple test email',
      'order-confirmation': 'Send a mock order confirmation email',
      'admin-notification': 'Send a mock admin notification email',
      'status-update': 'Send a mock order status update email'
    }
  })
}