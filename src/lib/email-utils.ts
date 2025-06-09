import { prisma } from '@/lib/prisma'
import { 
  emailService, 
  type OrderEmailData, 
  type WelcomeEmailData, 
  type PasswordResetData, 
  type LowStockNotificationData 
} from '@/lib/email'

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

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmailToUser(userId: string, language: 'en' | 'ru' = 'en') {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const welcomeData: WelcomeEmailData = {
      customerName: user.name || 'Valued Customer',
      customerEmail: user.email,
      language
    }

    await emailService.sendWelcomeEmail(welcomeData)
    console.log(`Welcome email sent to: ${user.email}`)
  } catch (error) {
    console.error('Welcome email error:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmailToUser(
  email: string, 
  resetToken: string, 
  language: 'en' | 'ru' = 'en'
) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        name: true,
        email: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const resetData: PasswordResetData = {
      customerName: user.name || 'Valued Customer',
      customerEmail: user.email,
      resetToken,
      language
    }

    await emailService.sendPasswordResetEmail(resetData)
    console.log(`Password reset email sent to: ${user.email}`)
  } catch (error) {
    console.error('Password reset email error:', error)
    throw error
  }
}

/**
 * Check inventory and send low stock notifications
 */
export async function checkInventoryAndNotify(minThreshold: number = 5) {
  try {
    // Find SKUs with low stock
    const lowStockSkus = await prisma.productSku.findMany({
      where: {
        stock: {
          lte: minThreshold
        }
      },
      include: {
        product: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    console.log(`Found ${lowStockSkus.length} SKUs with low stock`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Send notification for each low stock item
    for (const sku of lowStockSkus) {
      try {
        const notificationData: LowStockNotificationData = {
          productName: sku.product.name,
          sku: sku.sku,
          currentStock: sku.stock,
          minThreshold,
          productUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/products/${sku.product.slug}`
        }

        await emailService.sendLowStockNotification(notificationData)
        results.success++
        console.log(`Low stock notification sent for SKU: ${sku.sku}`)
      } catch (error) {
        results.failed++
        const errorMessage = `Failed to send notification for SKU ${sku.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMessage)
        console.error(errorMessage)
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  } catch (error) {
    console.error('Inventory check error:', error)
    throw error
  }
}

/**
 * Send promotional newsletter to subscribers
 */
export async function sendNewsletterEmail(
  subject: string,
  htmlContent: string,
  textContent?: string,
  options: {
    userIds?: string[]
    onlyRecentCustomers?: boolean
    daysBack?: number
    language?: 'en' | 'ru'
  } = {}
) {
  try {
    // Build query for users
    const whereConditions: any = {}
    
    if (options.userIds?.length) {
      whereConditions.id = { in: options.userIds }
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

    // Get users
    const users = await prisma.user.findMany({
      where: whereConditions,
      select: {
        email: true,
        name: true
      },
      distinct: ['email']
    })

    console.log(`Found ${users.length} users for newsletter`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Send emails to each user
    for (const user of users) {
      try {
        // Personalize content by replacing placeholders
        const personalizedHtml = htmlContent
          .replace(/{{customerName}}/g, user.name || 'Valued Customer')
          .replace(/{{email}}/g, user.email)
        
        const personalizedText = textContent
          ?.replace(/{{customerName}}/g, user.name || 'Valued Customer')
          ?.replace(/{{email}}/g, user.email)

        // Use Resend directly for newsletter emails
        const { Resend } = await import('resend')
        
        if (!process.env.RESEND_API_KEY) {
          throw new Error('RESEND_API_KEY is not set')
        }
        
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'newsletter@exvicpmour.com',
          to: user.email,
          subject,
          html: personalizedHtml,
          text: personalizedText
        })

        results.success++
        console.log(`Newsletter sent successfully to: ${user.email}`)
      } catch (error) {
        results.failed++
        const errorMessage = `Failed to send newsletter to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMessage)
        console.error(errorMessage)
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    return results
  } catch (error) {
    console.error('Newsletter email error:', error)
    throw error
  }
}

/**
 * Template function to create professional newsletter HTML
 */
export function createNewsletterTemplate(
  title: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string,
  language: 'en' | 'ru' = 'en'
): { html: string; text: string } {
  const isRussian = language === 'ru'
  
  const unsubscribeText = isRussian 
    ? 'Отписаться от рассылки' 
    : 'Unsubscribe from newsletter'
  
  const viewOnlineText = isRussian 
    ? 'Посмотреть онлайн' 
    : 'View online'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .newsletter-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
        }
        
        .newsletter-header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 40px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        
        .newsletter-header h1 {
          color: #ffffff;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        
        .newsletter-content {
          padding: 40px;
          background: #ffffff;
        }
        
        .newsletter-footer {
          background: #f8f9fa;
          padding: 30px 40px;
          text-align: center;
          border-radius: 0 0 12px 12px;
          color: #6b7280;
          font-size: 14px;
        }
        
        .cta-button {
          display: inline-block;
          background: #1a1a1a;
          color: #ffffff !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 24px 0;
        }
        
        @media only screen and (max-width: 600px) {
          .newsletter-container {
            margin: 0;
            border-radius: 0;
          }
          
          .newsletter-header, .newsletter-content, .newsletter-footer {
            padding: 20px;
          }
          
          .cta-button {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    </head>
    <body>
      <div class="newsletter-container">
        <div class="newsletter-header">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 16px; margin: 0; opacity: 0.9;">${title}</p>
        </div>
        
        <div class="newsletter-content">
          <p style="color: #6b7280; margin: 0 0 24px 0;">
            ${isRussian ? 'Привет' : 'Hello'} {{customerName}},
          </p>
          
          ${content}
          
          ${ctaText && ctaUrl ? `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${ctaUrl}" class="cta-button">
                ${ctaText}
              </a>
            </div>
          ` : ''}
        </div>
        
        <div class="newsletter-footer">
          <p style="margin: 0 0 16px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/{{email}}" style="color: #6b7280; text-decoration: none;">
              ${viewOnlineText}
            </a>
            |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/{{email}}" style="color: #6b7280; text-decoration: none;">
              ${unsubscribeText}
            </a>
          </p>
          <p style="margin: 0; font-size: 12px;">
            © 2024 EXVICPMOUR. ${isRussian ? 'Все права защищены' : 'All rights reserved'}.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${title}

${isRussian ? 'Привет' : 'Hello'} {{customerName}},

${content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}

${ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}` : ''}

${viewOnlineText}: ${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/{{email}}
${unsubscribeText}: ${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/{{email}}

© 2024 EXVICPMOUR. ${isRussian ? 'Все права защищены' : 'All rights reserved'}.
  `

  return { html, text }
}