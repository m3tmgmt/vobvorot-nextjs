/**
 * Email Examples and Usage Documentation for EXVICPMOUR Store
 * 
 * This file contains examples of how to use the improved email system
 * with all the new templates and multilingual support.
 */

import { 
  emailService,
  type OrderEmailData,
  type WelcomeEmailData,
  type PasswordResetData,
  type LowStockNotificationData
} from '@/lib/email'
import {
  sendBulkOrderNotifications,
  sendWelcomeEmailToUser,
  sendPasswordResetEmailToUser,
  checkInventoryAndNotify,
  sendNewsletterEmail,
  createNewsletterTemplate
} from '@/lib/email-utils'

/**
 * Example: Send order confirmation email
 */
export async function exampleOrderConfirmation() {
  const orderData: OrderEmailData = {
    orderNumber: 'EXVIC-2024-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    language: 'en', // or 'ru' for Russian
    estimatedDelivery: 'December 15, 2024',
    items: [
      {
        name: 'Premium Wool Coat',
        quantity: 1,
        price: 299.99,
        size: 'L',
        color: 'Black',
        imageUrl: 'https://example.com/coat.jpg'
      },
      {
        name: 'Luxury Silk Scarf',
        quantity: 2,
        price: 89.99,
        color: 'Navy Blue',
        imageUrl: 'https://example.com/scarf.jpg'
      }
    ],
    subtotal: 479.97,
    shippingCost: 15.00,
    total: 494.97,
    shippingAddress: {
      name: 'John Doe',
      address: '123 Fashion Street',
      city: 'New York',
      country: 'United States',
      zip: '10001'
    }
  }

  try {
    await emailService.sendOrderConfirmation(orderData)
    console.log('Order confirmation sent successfully')
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
  }
}

/**
 * Example: Send order status update
 */
export async function exampleOrderStatusUpdate() {
  const orderData: OrderEmailData = {
    orderNumber: 'EXVIC-2024-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    language: 'en',
    status: 'SHIPPED',
    trackingNumber: 'TRACK123456789',
    estimatedDelivery: 'December 15, 2024',
    items: [], // Not needed for status update
    subtotal: 479.97,
    shippingCost: 15.00,
    total: 494.97,
    shippingAddress: {
      name: 'John Doe',
      address: '123 Fashion Street',
      city: 'New York',
      country: 'United States',
      zip: '10001'
    }
  }

  try {
    await emailService.sendOrderStatusUpdate(orderData)
    console.log('Order status update sent successfully')
  } catch (error) {
    console.error('Failed to send order status update:', error)
  }
}

/**
 * Example: Send welcome email to new user
 */
export async function exampleWelcomeEmail() {
  try {
    // Using the utility function with user ID
    await sendWelcomeEmailToUser('user-id-123', 'en')
    
    // Or using the service directly
    const welcomeData: WelcomeEmailData = {
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      language: 'ru' // Russian version
    }
    await emailService.sendWelcomeEmail(welcomeData)
    
    console.log('Welcome emails sent successfully')
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

/**
 * Example: Send password reset email
 */
export async function examplePasswordResetEmail() {
  try {
    // Using the utility function
    await sendPasswordResetEmailToUser(
      'user@example.com',
      'reset-token-123',
      'en'
    )
    
    // Or using the service directly
    const resetData: PasswordResetData = {
      customerName: 'Maria Garcia',
      customerEmail: 'maria@example.com',
      resetToken: 'secure-reset-token-456',
      language: 'ru'
    }
    await emailService.sendPasswordResetEmail(resetData)
    
    console.log('Password reset emails sent successfully')
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}

/**
 * Example: Send low stock notification to admin
 */
export async function exampleLowStockNotification() {
  try {
    // Check all inventory and send notifications
    const results = await checkInventoryAndNotify(10) // threshold of 10 items
    console.log('Inventory check results:', results)
    
    // Or send specific notification
    const stockData: LowStockNotificationData = {
      productName: 'Premium Wool Coat',
      sku: 'PWC-BLK-L',
      currentStock: 3,
      minThreshold: 10,
      productUrl: 'https://exvicpmour.com/admin/products/premium-wool-coat'
    }
    await emailService.sendLowStockNotification(stockData)
    
    console.log('Low stock notifications sent successfully')
  } catch (error) {
    console.error('Failed to send low stock notifications:', error)
  }
}

/**
 * Example: Send promotional newsletter
 */
export async function exampleNewsletterEmail() {
  try {
    // Create newsletter template
    const { html, text } = createNewsletterTemplate(
      'Winter Collection 2024',
      `
        <h2>Discover Our Exclusive Winter Collection</h2>
        <p>Step into luxury with our carefully curated winter pieces, designed for the modern fashion enthusiast.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Featured Items</h3>
          <ul>
            <li>Premium Wool Coats - Starting at $299</li>
            <li>Cashmere Sweaters - Limited Edition</li>
            <li>Luxury Accessories - Perfect for gifting</li>
          </ul>
        </div>
        
        <p><strong>Special Offer:</strong> Use code WINTER20 for 20% off your first purchase from our winter collection.</p>
      `,
      'Shop Winter Collection',
      'https://exvicpmour.com/collections/winter-2024',
      'en'
    )

    // Send to recent customers
    const results = await sendNewsletterEmail(
      '❄️ EXVICPMOUR Winter Collection 2024 - 20% Off!',
      html,
      text,
      {
        onlyRecentCustomers: true,
        daysBack: 60,
        language: 'en'
      }
    )
    
    console.log('Newsletter sent successfully:', results)
  } catch (error) {
    console.error('Failed to send newsletter:', error)
  }
}

/**
 * Example: Bulk operations
 */
export async function exampleBulkOperations() {
  try {
    // Send confirmation emails for recent orders
    const confirmationResults = await sendBulkOrderNotifications('confirmation', {
      dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
      status: 'CONFIRMED'
    })
    console.log('Bulk confirmations:', confirmationResults)

    // Send status updates for shipped orders
    const statusResults = await sendBulkOrderNotifications('status-update', {
      status: 'SHIPPED'
    })
    console.log('Bulk status updates:', statusResults)
    
  } catch (error) {
    console.error('Failed to send bulk emails:', error)
  }
}

/**
 * Example: Test email functionality
 */
export async function exampleTestEmail() {
  try {
    await emailService.sendTestEmail('admin@exvicpmour.com')
    console.log('Test email sent successfully')
  } catch (error) {
    console.error('Failed to send test email:', error)
  }
}

/**
 * Example: Complete order flow emails
 */
export async function exampleCompleteOrderFlow() {
  const orderData: OrderEmailData = {
    orderNumber: 'EXVIC-2024-002',
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    language: 'en',
    items: [
      {
        name: 'Designer Handbag',
        quantity: 1,
        price: 599.99,
        color: 'Burgundy',
        imageUrl: 'https://example.com/handbag.jpg'
      }
    ],
    subtotal: 599.99,
    shippingCost: 0.00, // Free shipping
    total: 599.99,
    shippingAddress: {
      name: 'Alice Johnson',
      address: '456 Luxury Lane',
      city: 'Los Angeles',
      country: 'United States',
      zip: '90210'
    }
  }

  try {
    // 1. Order confirmation
    await emailService.sendOrderConfirmation(orderData)
    console.log('Step 1: Order confirmation sent')

    // 2. Order confirmed (status update)
    const confirmedOrder = { ...orderData, status: 'CONFIRMED' }
    await emailService.sendOrderStatusUpdate(confirmedOrder)
    console.log('Step 2: Order confirmed notification sent')

    // 3. Order shipped (with tracking)
    const shippedOrder = { 
      ...orderData, 
      status: 'SHIPPED',
      trackingNumber: 'TRACK987654321',
      estimatedDelivery: 'December 18, 2024'
    }
    await emailService.sendOrderStatusUpdate(shippedOrder)
    console.log('Step 3: Order shipped notification sent')

    // 4. Order delivered
    const deliveredOrder = { ...orderData, status: 'DELIVERED' }
    await emailService.sendOrderStatusUpdate(deliveredOrder)
    console.log('Step 4: Order delivered notification sent')

    console.log('Complete order flow emails sent successfully!')
  } catch (error) {
    console.error('Failed to send order flow emails:', error)
  }
}

/**
 * Example usage in API routes or server actions
 */
export const emailExamples = {
  orderConfirmation: exampleOrderConfirmation,
  orderStatusUpdate: exampleOrderStatusUpdate,
  welcomeEmail: exampleWelcomeEmail,
  passwordReset: examplePasswordResetEmail,
  lowStockNotification: exampleLowStockNotification,
  newsletter: exampleNewsletterEmail,
  bulkOperations: exampleBulkOperations,
  testEmail: exampleTestEmail,
  completeOrderFlow: exampleCompleteOrderFlow
}

// Example API usage:
/*
// In your API route (e.g., /api/orders/confirmation)
import { emailExamples } from '@/lib/email-examples'

export async function POST(request: Request) {
  try {
    await emailExamples.orderConfirmation()
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
*/

// Example in user registration:
/*
// In your user registration handler
import { sendWelcomeEmailToUser } from '@/lib/email-utils'

export async function createUser(userData: any) {
  const user = await prisma.user.create({ data: userData })
  
  // Send welcome email
  await sendWelcomeEmailToUser(user.id, 'en')
  
  return user
}
*/

// Example in password reset flow:
/*
// In your password reset handler
import { sendPasswordResetEmailToUser } from '@/lib/email-utils'

export async function requestPasswordReset(email: string) {
  const resetToken = generateSecureToken()
  
  // Save token to database
  await saveResetToken(email, resetToken)
  
  // Send reset email
  await sendPasswordResetEmailToUser(email, resetToken, 'en')
}
*/