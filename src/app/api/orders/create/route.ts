import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { westernbid } from '@/lib/westernbid'
import { emailService, type OrderEmailData, type AdminNotificationData } from '@/lib/email'
import { logPaymentCreation, logPaymentFailure } from '@/lib/payment-logger'
import { getWesternBidConfig, isFeatureEnabled } from '@/lib/payment-config'
import { logger } from '@/lib/logger'
import { normalizePhoneNumber, validatePhoneNumber } from '@/lib/phone-utils'
import { 
  reserveStock, 
  checkStockAvailability, 
  type InventoryItem 
} from '@/lib/inventory-management'
import { RateLimiter, APIResponse, ValidationSchemas, InputSanitizer } from '@/lib/api-security'

interface OrderItem {
  skuId?: string
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
  email: string
  phone: string
  country: string
  state?: string
}

interface PaymentInfo {
  method: 'westernbid_stripe' | 'westernbid_paypal' | 'westernbid'
}

interface OrderData {
  shippingInfo: ShippingInfo
  paymentInfo: PaymentInfo
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  checkoutSessionId?: string
}

export async function POST(request: NextRequest) {
  let session: any
  let orderData: OrderData | undefined
  
  try {
    // Rate limiting для заказов
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateCheck = RateLimiter.checkLimit(`order-${clientIP}`, 5, 300000) // 5 orders per 5 minutes
    
    if (!rateCheck.allowed) {
      return APIResponse.rateLimitError(rateCheck.reset)
    }

    session = await getServerSession(authOptions)
    
    // Allow guest checkout - authentication is optional for orders
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const rawData = await request.json()
    
    // Input sanitization
    orderData = {
      shippingInfo: {
        email: InputSanitizer.sanitizeEmail(rawData.shippingInfo?.email || ''),
        phone: InputSanitizer.sanitizePhone(rawData.shippingInfo?.phone || ''),
        country: InputSanitizer.sanitizeString(rawData.shippingInfo?.country || ''),
        state: rawData.shippingInfo?.state ? InputSanitizer.sanitizeString(rawData.shippingInfo.state) : undefined
      },
      paymentInfo: rawData.paymentInfo,
      items: rawData.items || [],
      subtotal: Number(rawData.subtotal) || 0,
      shippingCost: Number(rawData.shippingCost) || 0,
      tax: Number(rawData.tax) || 0,
      total: Number(rawData.total) || 0,
      checkoutSessionId: rawData.checkoutSessionId
    } as OrderData
    
    // Validate required fields
    if (!orderData || !orderData.shippingInfo || !orderData.paymentInfo || !orderData.items?.length) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      )
    }

    // Validate and normalize phone number
    if (orderData.shippingInfo.phone) {
      const phoneValidation = validatePhoneNumber(orderData.shippingInfo.phone)
      if (!phoneValidation.isValid) {
        logger.warn('Invalid phone number provided', {
          phone: orderData.shippingInfo.phone,
          error: phoneValidation.error
        })
        // Don't fail the order, but normalize what we can
        orderData.shippingInfo.phone = phoneValidation.normalized
      } else {
        orderData.shippingInfo.phone = phoneValidation.normalized
      }
    }

    // Validate state for US addresses
    if (orderData.shippingInfo.country === 'US' && !orderData.shippingInfo.state) {
      return NextResponse.json(
        { error: 'State/Province is required for US addresses' },
        { status: 400 }
      )
    }

    // STEP 1: Validate stock availability for all items
    const inventoryItems: InventoryItem[] = []
    const skuMap = new Map<string, any>()

    // First, find all SKUs and validate they exist
    for (const item of orderData.items) {
      let sku
      
      // If skuId is provided, use it directly
      if (item.skuId) {
        sku = await prisma.productSku.findFirst({
          where: {
            id: item.skuId,
            isActive: true
          }
        })
      } else {
        // Fallback to searching by product attributes
        sku = await prisma.productSku.findFirst({
          where: {
            productId: item.product.id,
            size: item.selectedSize || null,
            color: item.selectedColor || null,
            isActive: true
          }
        })
      }
      
      if (!sku) {
        return NextResponse.json(
          { 
            error: 'Product variant not available',
            details: `No stock found for ${item.product.name} (${item.selectedSize || 'No size'}, ${item.selectedColor || 'No color'})`
          },
          { status: 400 }
        )
      }

      skuMap.set(`${item.product.id}-${item.selectedSize || 'NS'}-${item.selectedColor || 'NC'}`, sku)
      inventoryItems.push({
        skuId: sku.id,
        quantity: item.quantity
      })
    }

    // STEP 2: Check stock availability
    const stockCheck = await checkStockAvailability(inventoryItems)
    if (!stockCheck.available) {
      return NextResponse.json(
        { 
          error: 'Insufficient stock',
          unavailableItems: stockCheck.unavailableItems
        },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `EXV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const sessionId = request.headers.get('x-session-id') || `session-${Date.now()}`

    // STEP 3: Create the order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id || null,
        status: 'PENDING',
        currency: 'USD',
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        total: orderData.total,
        sessionId,
        
        // Shipping information
        shippingName: orderData.shippingInfo.email,
        shippingEmail: orderData.shippingInfo.email,
        shippingPhone: orderData.shippingInfo.phone,
        shippingAddress: 'Address to be provided',
        shippingCity: 'City to be provided',
        shippingState: orderData.shippingInfo.state || null,
        shippingZip: 'ZIP to be provided',
        shippingCountry: orderData.shippingInfo.country,
        
        // Payment information
        paymentMethod: orderData.paymentInfo.method,
        paymentStatus: 'PENDING',
        
        items: {
          create: orderData.items.map((item) => {
            const sku = skuMap.get(`${item.product.id}-${item.selectedSize || 'NS'}-${item.selectedColor || 'NC'}`)
            return {
              skuId: sku.id,
              quantity: item.quantity,
              price: Number(item.product.price),
              productName: item.product.name,
              productSku: sku.sku
            }
          })
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

    // STEP 4: Check if items are already reserved (temporary reservations) or reserve new stock
    let reservationResults: any[] = []
    
    // Try to find existing temporary reservations for these SKUs
    const skuIds = inventoryItems.map(item => item.skuId)
    const existingReservations = await prisma.stockReservation.findMany({
      where: { 
        skuId: { in: skuIds },
        orderId: 'TEMP_RESERVATIONS_ORDER', // Temporary reservations
        expiresAt: { gt: new Date() } // Still active
      }
    })
    
    if (existingReservations.length > 0) {
      console.log(`Found ${existingReservations.length} existing temporary reservations`)
      
      // Check if we have enough reserved stock for all requested items
      const reservedQuantities = new Map<string, number>()
      existingReservations.forEach(reservation => {
        const current = reservedQuantities.get(reservation.skuId) || 0
        reservedQuantities.set(reservation.skuId, current + reservation.quantity)
      })
      
      // Verify we have enough reserved for each item
      let canUseExistingReservations = true
      for (const item of inventoryItems) {
        const reserved = reservedQuantities.get(item.skuId) || 0
        if (reserved < item.quantity) {
          canUseExistingReservations = false
          console.log(`Not enough reserved for SKU ${item.skuId}: need ${item.quantity}, have ${reserved}`)
          break
        }
      }
      
      if (canUseExistingReservations) {
        // Update existing reservations to use the new order ID
        const reservationsToUpdate = []
        for (const item of inventoryItems) {
          let remainingQuantity = item.quantity
          const skuReservations = existingReservations.filter(r => r.skuId === item.skuId)
          
          for (const reservation of skuReservations) {
            if (remainingQuantity <= 0) break
            
            const useQuantity = Math.min(remainingQuantity, reservation.quantity)
            reservationsToUpdate.push(reservation.id)
            remainingQuantity -= useQuantity
          }
        }
        
        await prisma.stockReservation.updateMany({
          where: { id: { in: reservationsToUpdate } },
          data: { orderId: order.id }
        })
        
        // Mark as successful reservations
        reservationResults = reservationsToUpdate.map(id => ({
          success: true,
          reservationId: id
        }))
        
        console.log(`Updated ${reservationsToUpdate.length} existing reservations for order ${order.id}`)
      } else {
        console.log('Existing reservations insufficient, creating new ones')
        // Not enough existing reservations, create new ones
        reservationResults = await reserveStock(inventoryItems, order.id)
      }
    } else {
      console.log('No existing reservations found, creating new ones')
      // No existing reservations, create new ones
      reservationResults = await reserveStock(inventoryItems, order.id)
    }
    
    // Check if all reservations succeeded
    const failedReservations = reservationResults.filter(r => !r.success)
    if (failedReservations.length > 0) {
      // Delete the order if reservation failed
      await prisma.order.delete({ where: { id: order.id } })
      
      return NextResponse.json(
        { 
          error: 'Failed to reserve stock',
          details: failedReservations.map(r => r.error).join(', ')
        },
        { status: 400 }
      )
    }

    // Note: Emails will be sent AFTER successful payment creation

    // Check if payment gateway is enabled
    const westernbidConfig = getWesternBidConfig()
    if (!westernbidConfig.enabled) {
      return NextResponse.json(
        { error: 'Payment gateway is currently disabled' },
        { status: 503 }
      )
    }

    // Process payment with WesternBid (handles Stripe & PayPal)
    logger.info('Creating WesternBid payment', {
      orderNumber,
      amount: orderData.total,
      userId: session?.user?.id || 'guest',
      customerEmail: orderData.shippingInfo.email,
      requestedMethod: orderData.paymentInfo.method
    })
    
    const startTime = Date.now()
    
    const paymentRequest = {
      orderId: orderNumber,
      amount: orderData.total,
      currency: 'USD',
      description: `Order ${orderNumber} - ${orderData.items.length} items (${orderData.paymentInfo.method.toUpperCase()})`,
      customerEmail: orderData.shippingInfo.email,
      customerName: orderData.shippingInfo.email, // Use email as name since we don't have name fields
      customerPhone: orderData.shippingInfo.phone,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?orderId=${orderNumber}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel?orderId=${orderNumber}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/westernbid`,
      metadata: {
        orderNumber: orderNumber,
        userId: session?.user?.id || 'guest',
        userEmail: session?.user?.email || orderData.shippingInfo.email,
        itemCount: orderData.items.length,
        shippingCountry: orderData.shippingInfo.country,
        preferredPaymentMethod: orderData.paymentInfo.method,
        shippingAddress: 'Address to be provided',
        shippingCity: 'City to be provided',
        shippingState: orderData.shippingInfo.state || '',
        shippingZip: 'ZIP to be provided',
        // Detailed items information for better tracking
        items: orderData.items.map((item, index) => ({
          [`item_${index + 1}_name`]: item.product.name,
          [`item_${index + 1}_quantity`]: item.quantity,
          [`item_${index + 1}_price`]: Number(item.product.price),
          [`item_${index + 1}_size`]: item.selectedSize || 'N/A',
          [`item_${index + 1}_color`]: item.selectedColor || 'N/A'
        })).reduce((acc, item) => ({ ...acc, ...item }), {})
      }
    }

    // Log payment creation attempt
    logPaymentCreation({
      orderId: orderNumber,
      userId: session?.user?.id || 'guest',
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
      // Generate WesternBid form data for direct client submission
      const preferredGate = orderData.paymentInfo.method === 'westernbid_stripe' ? 'stripe' : 'paypal'
      const formData = westernbid.generatePaymentFormData(paymentRequest, paymentResult.paymentId || `wb_${Date.now()}_${orderNumber}`, preferredGate)
      // Update order with payment information
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PENDING',
          paymentId: paymentResult.paymentId,
          sessionId: paymentResult.sessionId
        }
      })

      // Send order confirmation emails ONLY after successful payment creation
      try {
        logger.info('Sending order confirmation email after payment creation', {
          orderNumber,
          customerEmail: order.shippingEmail,
          itemCount: order.items.length,
          total: Number(order.total)
        })
        
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

        // Note: Customer confirmation email will be sent via webhook after successful payment

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
        
        logger.info('Order confirmation emails sent successfully', {
          orderNumber,
          customerEmail: order.shippingEmail
        })
      } catch (emailError) {
        logger.error('Failed to send order confirmation emails', {
          orderNumber,
          customerEmail: order.shippingEmail
        }, emailError instanceof Error ? emailError : new Error(String(emailError)))
        // Don't fail the order flow if email fails
      }

      return NextResponse.json({
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        total: updatedOrder.total,
        paymentUrl: paymentResult.paymentUrl,
        paymentId: paymentResult.paymentId,
        sessionId: paymentResult.sessionId,
        formData: formData, // WesternBid form data for direct submission
        paymentGateway: 'westernbid',
        targetUrl: 'https://shop.westernbid.info',
        message: 'Order created successfully'
      })
    } else {
      // Log payment failure
      logPaymentFailure({
        orderId: orderNumber,
        paymentId: paymentResult.paymentId,
        userId: session?.user?.id || 'guest',
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
    logger.error('Order creation failed', {
      userId: session?.user?.id,
      shippingEmail: orderData?.shippingInfo?.email,
      itemCount: orderData?.items?.length,
      total: orderData?.total
    }, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}