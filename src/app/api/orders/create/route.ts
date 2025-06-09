import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { westernbid } from '@/lib/westernbid'
import { emailService, type OrderEmailData, type AdminNotificationData } from '@/lib/email'
import { logPaymentCreation, logPaymentFailure } from '@/lib/payment-logger'
import { getWesternBidConfig, isFeatureEnabled } from '@/lib/payment-config'

interface OrderItem {
  product: {
    id: string
    name: string
    price: any
    images: { url: string; alt?: string }[]
  }
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface ShippingInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  state?: string
}

interface PaymentInfo {
  method: 'westernbid'
}

interface OrderData {
  shippingInfo: ShippingInfo
  paymentInfo: PaymentInfo
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orderData: OrderData = await request.json()
    
    // Validate required fields
    if (!orderData.shippingInfo || !orderData.paymentInfo || !orderData.items?.length) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `EXV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        status: 'PENDING',
        currency: 'USD',
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        total: orderData.total,
        
        // Shipping information
        shippingName: `${orderData.shippingInfo.firstName} ${orderData.shippingInfo.lastName}`,
        shippingEmail: orderData.shippingInfo.email,
        shippingPhone: orderData.shippingInfo.phone,
        shippingAddress: orderData.shippingInfo.address,
        shippingCity: orderData.shippingInfo.city,
        shippingZip: orderData.shippingInfo.postalCode,
        shippingCountry: orderData.shippingInfo.country,
        
        // Payment information
        paymentMethod: orderData.paymentInfo.method,
        paymentStatus: 'PENDING',
        
        // Order items will be created separately
        items: {
          create: await Promise.all(orderData.items.map(async (item) => {
            // Find or create SKU for this product variant
            let sku = await prisma.productSku.findFirst({
              where: {
                productId: item.product.id,
                size: item.selectedSize || null,
                color: item.selectedColor || null
              }
            })
            
            if (!sku) {
              // Create SKU if it doesn't exist
              sku = await prisma.productSku.create({
                data: {
                  productId: item.product.id,
                  sku: `${item.product.id}-${item.selectedSize || 'NS'}-${item.selectedColor || 'NC'}`,
                  size: item.selectedSize,
                  color: item.selectedColor,
                  stock: 999, // Default high stock
                  price: Number(item.product.price)
                }
              })
            }
            
            return {
              skuId: sku.id,
              quantity: item.quantity,
              price: Number(item.product.price),
              productName: item.product.name,
              productSku: sku.sku
            }
          }))
        }
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

    // Send order confirmation email
    try {
      console.log(`Sending order confirmation email for order: ${orderNumber}`)
      
      // Prepare email data
      const emailData: OrderEmailData = {
        orderNumber: order.orderNumber,
        customerName: order.shippingName,
        customerEmail: order.shippingEmail,
        items: order.items.map(item => ({
          name: item.sku.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          size: item.sku.size || undefined,
          color: item.sku.color || undefined,
          imageUrl: item.sku.product.images[0]?.url
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        shippingAddress: {
          name: order.shippingName,
          address: order.shippingAddress,
          city: order.shippingCity,
          country: order.shippingCountry,
          zip: order.shippingZip
        }
      }

      // Send confirmation email to customer
      await emailService.sendOrderConfirmation(emailData)

      // Send notification email to admin
      const adminData: AdminNotificationData = {
        orderNumber: order.orderNumber,
        customerName: order.shippingName,
        customerEmail: order.shippingEmail,
        total: Number(order.total),
        itemCount: order.items.length,
        paymentMethod: order.paymentMethod || 'WesternBid',
        shippingAddress: `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingCountry}`
      }

      await emailService.sendAdminOrderNotification(adminData)
      
      console.log(`Order confirmation emails sent successfully for order: ${orderNumber}`)
    } catch (emailError) {
      console.error('Failed to send order confirmation emails:', emailError)
      // Don't fail the order creation if email fails
    }

    // Check if payment gateway is enabled
    const westernbidConfig = getWesternBidConfig()
    if (!westernbidConfig.enabled) {
      return NextResponse.json(
        { error: 'Payment gateway is currently disabled' },
        { status: 503 }
      )
    }

    // Process payment with WesternBid
    console.log('Creating WesternBid payment for order:', orderNumber)
    
    const startTime = Date.now()
    
    const paymentRequest = {
      orderId: orderNumber,
      amount: orderData.total,
      currency: 'USD',
      description: `Order ${orderNumber} - ${orderData.items.length} items`,
      customerEmail: orderData.shippingInfo.email,
      customerName: `${orderData.shippingInfo.firstName} ${orderData.shippingInfo.lastName}`,
      customerPhone: orderData.shippingInfo.phone,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        orderNumber: orderNumber,
        userId: session.user.id,
        userEmail: session.user.email,
        itemCount: orderData.items.length,
        shippingCountry: orderData.shippingInfo.country
      }
    }

    // Log payment creation attempt
    logPaymentCreation({
      orderId: orderNumber,
      userId: session.user.id,
      amount: orderData.total,
      currency: 'USD',
      gateway: 'WESTERNBID',
      metadata: paymentRequest.metadata,
      request: {
        method: 'POST',
        url: '/api/orders/create',
        body: { ...paymentRequest, metadata: '[LOGGED_SEPARATELY]' }
      }
    })

    const paymentResult = await westernbid.createPayment(paymentRequest)
    const duration = Date.now() - startTime
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      // Update order with payment information
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PENDING',
          paymentId: paymentResult.paymentId,
          sessionId: paymentResult.sessionId
        }
      })

      return NextResponse.json({
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        total: updatedOrder.total,
        paymentUrl: paymentResult.paymentUrl,
        paymentId: paymentResult.paymentId,
        sessionId: paymentResult.sessionId,
        message: 'Order created successfully'
      })
    } else {
      // Log payment failure
      logPaymentFailure({
        orderId: orderNumber,
        paymentId: paymentResult.paymentId,
        userId: session.user.id,
        amount: orderData.total,
        currency: 'USD',
        gateway: 'WESTERNBID',
        error: new Error(paymentResult.error || 'Payment creation failed'),
        metadata: {
          errorCode: paymentResult.errorCode,
          duration
        },
        duration
      })

      // Payment creation failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          failureReason: paymentResult.error
        }
      })

      return NextResponse.json(
        { 
          error: 'Payment processing failed',
          details: paymentResult.error,
          errorCode: paymentResult.errorCode,
          orderId: orderNumber
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}