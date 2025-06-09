import { prisma } from '@/lib/prisma'
import { emailService, type OrderEmailData } from '@/lib/email'

interface BulkEmailOptions {
  orderIds?: string[]
  status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Send bulk email notifications for multiple orders
 */
export async function sendBulkOrderNotifications(
  type: 'confirmation' | 'status-update',
  options: BulkEmailOptions = {}
) {
  try {
    // Build query conditions
    const whereConditions: any = {}
    
    if (options.orderIds?.length) {
      whereConditions.id = { in: options.orderIds }
    }
    
    if (options.status) {
      whereConditions.status = options.status
    }
    
    if (options.dateFrom || options.dateTo) {
      whereConditions.createdAt = {}
      if (options.dateFrom) {
        whereConditions.createdAt.gte = options.dateFrom
      }
      if (options.dateTo) {
        whereConditions.createdAt.lte = options.dateTo
      }
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereConditions,
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

    console.log(`Found ${orders.length} orders for bulk email notification`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Send emails for each order
    for (const order of orders) {
      try {
        const emailData: OrderEmailData = {
          orderNumber: order.orderNumber,
          customerName: order.shippingName,
          customerEmail: order.shippingEmail,
          items: order.items.map(item => ({
            name: item.sku.product.name,
            quantity: item.quantity,
            price: item.price,
            size: item.sku.size || undefined,
            color: item.sku.color || undefined,
            imageUrl: item.sku.product.images[0]?.url
          })),
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          total: order.total,
          shippingAddress: {
            name: order.shippingName,
            address: order.shippingAddress,
            city: order.shippingCity,
            country: order.shippingCountry,
            zip: order.shippingZip
          },
          status: order.status
        }

        if (type === 'confirmation') {
          await emailService.sendOrderConfirmation(emailData)
        } else if (type === 'status-update') {
          await emailService.sendOrderStatusUpdate(emailData)
        }

        results.success++
        console.log(`Email sent successfully for order: ${order.orderNumber}`)
      } catch (error) {
        results.failed++
        const errorMessage = `Failed to send email for order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMessage)
        console.error(errorMessage)
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  } catch (error) {
    console.error('Bulk email notification error:', error)
    throw error
  }
}

/**
 * Send promotional or marketing emails to all customers
 */
export async function sendMarketingEmail(
  subject: string,
  htmlContent: string,
  textContent?: string,
  options: {
    customerIds?: string[]
    onlyRecentCustomers?: boolean
    daysBack?: number
  } = {}
) {
  try {
    // Build query for customers
    const whereConditions: any = {}
    
    if (options.customerIds?.length) {
      whereConditions.id = { in: options.customerIds }
    }
    
    if (options.onlyRecentCustomers) {
      const daysBack = options.daysBack || 30
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      whereConditions.orders = {
        some: {
          createdAt: {
            gte: cutoffDate
          }
        }
      }
    }

    // Get unique customer emails
    const customers = await prisma.user.findMany({
      where: whereConditions,
      select: {
        email: true,
        name: true
      },
      distinct: ['email']
    })

    console.log(`Found ${customers.length} customers for marketing email`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Send emails to each customer
    for (const customer of customers) {
      try {
        // Personalize content by replacing placeholders
        const personalizedHtml = htmlContent
          .replace('{{customerName}}', customer.name || 'Valued Customer')
          .replace('{{email}}', customer.email)
        
        const personalizedText = textContent
          ?.replace('{{customerName}}', customer.name || 'Valued Customer')
          ?.replace('{{email}}', customer.email)

        // Use Resend directly for marketing emails
        const { Resend } = await import('resend')
        
        if (!process.env.RESEND_API_KEY) {
          throw new Error('RESEND_API_KEY is not set')
        }
        
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'noreply@exvicpmour.com',
          to: customer.email,
          subject,
          html: personalizedHtml,
          text: personalizedText
        })

        results.success++
        console.log(`Marketing email sent successfully to: ${customer.email}`)
      } catch (error) {
        results.failed++
        const errorMessage = `Failed to send marketing email to ${customer.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMessage)
        console.error(errorMessage)
      }

      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return results
  } catch (error) {
    console.error('Marketing email error:', error)
    throw error
  }
}

/**
 * Get email statistics for a date range
 */
export async function getEmailStats(dateFrom?: Date, dateTo?: Date) {
  try {
    const whereConditions: any = {}
    
    if (dateFrom || dateTo) {
      whereConditions.createdAt = {}
      if (dateFrom) whereConditions.createdAt.gte = dateFrom
      if (dateTo) whereConditions.createdAt.lte = dateTo
    }

    const totalOrders = await prisma.order.count({
      where: whereConditions
    })

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: whereConditions,
      _count: {
        id: true
      }
    })

    const uniqueCustomers = await prisma.order.findMany({
      where: whereConditions,
      select: {
        shippingEmail: true
      },
      distinct: ['shippingEmail']
    })

    return {
      totalOrders,
      uniqueCustomers: uniqueCustomers.length,
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      }))
    }
  } catch (error) {
    console.error('Email stats error:', error)
    throw error
  }
}