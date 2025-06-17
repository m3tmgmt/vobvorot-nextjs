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
  reserveInventory, 
  cancelReservation, 
  getAvailableStock,
  type ReservationItem 
} from '@/lib/inventory'

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
}

export async function POST(request: NextRequest) {
  let session: any
  let orderData: OrderData | undefined
  
  try {
    session = await getServerSession(authOptions)
    
    // Allow guest checkout - authentication is optional for orders
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    orderData = await request.json()
    
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

    // Generate order number
    const orderNumber = `EXV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Step 1: Найти или создать SKU для каждого товара
    const skuItems: Array<{ skuId: string; quantity: number; price: number; productName: string; productSku: string }> = []
    const reservationItems: ReservationItem[] = []

    for (const item of orderData.items) {
      // Find existing SKU for this product variant
      let sku = await prisma.productSku.findFirst({
        where: {
          productId: item.product.id,
          size: item.selectedSize || null,
          color: item.selectedColor || null,
          isActive: true
        }
      })
      
      // If specific size/color not found, try to find any available SKU for this product
      if (!sku) {
        sku = await prisma.productSku.findFirst({
          where: {
            productId: item.product.id,
            isActive: true
          },
          orderBy: { createdAt: 'asc' } // Use the first created SKU
        })
      }
      
      if (!sku) {
        // Create SKU if it doesn't exist
        // Try to find existing product first, create if not exists
        let product = await prisma.product.findUnique({
          where: { id: item.product.id }
        })

        if (!product) {
          // Create product if it doesn't exist (fallback for mock data)
          try {
            // First create a category if needed
            let category = await prisma.category.findFirst({
              where: { name: 'General' }
            })

            if (!category) {
              category = await prisma.category.create({
                data: {
                  name: 'General',
                  slug: 'general',
                  description: 'General products',
                  isActive: true
                }
              })
            }

            product = await prisma.product.create({
              data: {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: `Product: ${item.product.name}`,
                categoryId: category.id,
                isActive: true
              }
            })

            logger.info('Created product from order data', {
              productId: product.id,
              productName: product.name
            })
          } catch (productError) {
            logger.error('Failed to create product', { productError })
            // Continue with existing logic if product creation fails
          }
        }

        // Find product stock from shared-data
        let productStock = 0
        try {
          const { sharedProducts } = await import('@/lib/shared-data')
          const sharedProduct = sharedProducts.find(p => p.id === item.product.id || p.name === item.product.name)
          productStock = sharedProduct?.stock || 0
        } catch (error) {
          logger.warn('Could not get stock from shared-data, using default', {
            productId: item.product.id,
            error: error instanceof Error ? error.message : String(error)
          })
        }
        sku = await prisma.productSku.create({
          data: {
            productId: item.product.id,
            sku: `${item.product.id}-${item.selectedSize || 'NS'}-${item.selectedColor || 'NC'}`,
            size: item.selectedSize,
            color: item.selectedColor,
            stock: productStock, // Use actual stock from shared-data instead of default 999
            reservedStock: 0, // Explicitly set reserved stock to 0
            price: Number(item.product.price),
            isActive: true // Ensure SKU is active
          }
        })
        
        logger.info('Created new SKU with actual stock', {
          skuId: sku.id,
          productId: item.product.id,
          stock: productStock,
          reservedStock: 0,
          size: item.selectedSize,
          color: item.selectedColor,
          productName: item.product.name
        })
      } else {
        logger.info('Using existing SKU for order', {
          skuId: sku.id,
          productId: item.product.id,
          existingStock: sku.stock,
          existingReserved: sku.reservedStock,
          size: sku.size,
          color: sku.color,
          productName: item.product.name,
          requestedSize: item.selectedSize,
          requestedColor: item.selectedColor
        })
      }
      
      skuItems.push({
        skuId: sku.id,
        quantity: item.quantity,
        price: Number(item.product.price),
        productName: item.product.name,
        productSku: sku.sku
      })

      reservationItems.push({
        skuId: sku.id,
        quantity: item.quantity
      })
    }

    // Step 2: Создать заказ БЕЗ резервирования (сначала)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id || null, // Allow null for guest orders
        status: 'PENDING',
        currency: 'USD',
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        total: orderData.total,
        
        // Shipping information
        shippingName: orderData.shippingInfo.email, // Use email as identifier since we don't have name fields
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
        
        // Order items
        items: {
          create: skuItems
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

    // Step 3: Попытаться зарезервировать товары
    logger.info('Attempting to reserve inventory', {
      orderNumber,
      orderId: order.id,
      reservationItems: reservationItems.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity
      }))
    })

    // Debug: Check stock levels before reservation
    for (const item of reservationItems) {
      const skuStock = await prisma.productSku.findUnique({
        where: { id: item.skuId },
        select: { 
          id: true, 
          stock: true, 
          reservedStock: true,
          isActive: true,
          product: { select: { name: true, isActive: true } }
        }
      })
      
      if (skuStock) {
        const availableStock = skuStock.stock - (skuStock.reservedStock || 0)
        logger.info('Stock check before reservation', {
          skuId: item.skuId,
          productName: skuStock.product.name,
          totalStock: skuStock.stock,
          reservedStock: skuStock.reservedStock || 0,
          availableStock,
          requestedQuantity: item.quantity,
          isActive: skuStock.isActive,
          productActive: skuStock.product.isActive
        })
      } else {
        logger.error('SKU not found during stock check', {
          skuId: item.skuId,
          quantity: item.quantity
        })
      }
    }

    const reservationResult = await reserveInventory(order.id, reservationItems)

    if (!reservationResult.success) {
      // Если резервирование не удалось - удалить заказ
      await prisma.order.delete({
        where: { id: order.id }
      })

      // Вернуть детальную информацию о недостаточных остатках
      if (reservationResult.insufficientStock && reservationResult.insufficientStock.length > 0) {
        const insufficientItems = reservationResult.insufficientStock.map(stock => {
          const item = skuItems.find(item => item.skuId === stock.skuId)
          return {
            productName: item?.productName || 'Unknown',
            requested: stock.requested,
            available: stock.available
          }
        })

        logger.warn('Order creation failed - insufficient stock', {
          orderNumber,
          insufficientItems
        })

        return NextResponse.json({
          error: 'Insufficient stock',
          message: 'Some items are no longer available in the requested quantity',
          insufficientStock: insufficientItems
        }, { status: 400 })
      }

      logger.error('Order creation failed - reservation error', {
        orderNumber,
        error: reservationResult.error,
        reservationItems: reservationItems.map(item => ({
          skuId: item.skuId,
          quantity: item.quantity
        }))
      })

      return NextResponse.json({
        error: 'Unable to reserve inventory',
        message: reservationResult.error || 'Failed to reserve items for your order',
        debug: {
          orderNumber,
          totalItems: reservationItems.length,
          reservationError: reservationResult.error
        }
      }, { status: 500 })
    }

    logger.info('✅ Order created with inventory reserved', {
      orderNumber,
      orderId: order.id,
      itemsCount: reservationItems.length,
      reservationId: reservationResult.reservationId
    })

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

      // Payment creation failed - отменить резервирование
      logger.warn('Payment creation failed - cancelling reservation', {
        orderNumber,
        orderId: order.id,
        error: paymentResult.error
      })

      await cancelReservation(order.id)

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
    
    // Попытаться отменить резервирование если заказ был создан
    try {
      const orderNumber = `EXV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      // Найти заказ по номеру если он был создан
      const existingOrder = await prisma.order.findFirst({
        where: {
          shippingEmail: orderData?.shippingInfo?.email,
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 60000) // за последнюю минуту
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (existingOrder) {
        logger.info('Cancelling reservation for failed order', {
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber
        })
        await cancelReservation(existingOrder.id)
      }
    } catch (cleanupError) {
      logger.error('Failed to cleanup reservation after order creation error', {}, 
        cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)))
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}