# EXVICPMOUR Email System Documentation

This document describes the enhanced email system for the EXVICPMOUR e-commerce store, featuring professional templates, multilingual support, and comprehensive notification types.

## 🚀 Features

- **Professional Design**: Modern, responsive email templates with EXVICPMOUR branding
- **Multilingual Support**: English and Russian language support
- **Mobile Responsive**: Optimized for all devices
- **Multiple Email Types**: Order confirmations, status updates, welcome emails, password resets, and admin notifications
- **Bulk Operations**: Send emails to multiple recipients efficiently
- **Rich Templates**: Beautiful HTML templates with consistent styling
- **Error Handling**: Comprehensive error tracking and logging

## 📧 Email Types

### 1. Order Confirmation
- **File**: `generateOrderConfirmationTemplate()` in `/src/lib/email.ts`
- **Purpose**: Sent immediately after order placement
- **Features**: 
  - Order details with product images
  - Shipping information
  - Order total breakdown
  - Estimated delivery date
  - Customer account link

### 2. Order Status Updates
- **File**: `generateOrderStatusUpdateTemplate()` in `/src/lib/email.ts`
- **Purpose**: Notify customers of order status changes
- **Supported Statuses**: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- **Features**:
  - Status-specific messaging
  - Tracking information for shipped orders
  - Estimated delivery updates

### 3. Welcome Email
- **File**: `generateWelcomeEmailTemplate()` in `/src/lib/email.ts`
- **Purpose**: Welcome new customers to EXVICPMOUR
- **Features**:
  - Brand introduction
  - Member benefits overview
  - Call-to-action to explore collections
  - Professional hero imagery

### 4. Password Reset
- **File**: `generatePasswordResetTemplate()` in `/src/lib/email.ts`
- **Purpose**: Secure password reset functionality
- **Features**:
  - Secure reset link with token
  - Security warnings
  - Link expiration notice
  - Clear instructions

### 5. Low Stock Notifications (Admin)
- **File**: `generateLowStockNotificationTemplate()` in `/src/lib/email.ts`
- **Purpose**: Alert administrators about low inventory
- **Features**:
  - Product details
  - Current stock levels
  - Threshold information
  - Direct links to admin panel

### 6. Admin Order Notifications
- **File**: `generateAdminNotificationTemplate()` in `/src/lib/email.ts`
- **Purpose**: Notify administrators of new orders
- **Features**:
  - Order summary
  - Customer information
  - Quick action suggestions
  - Direct links to order management

## 🔧 Configuration

### Environment Variables

```env
# Required
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@exvicpmour.com
ADMIN_EMAIL=admin@exvicpmour.com
NEXT_PUBLIC_SITE_URL=https://exvicpmour.com

# Optional
NEWSLETTER_FROM_EMAIL=newsletter@exvicpmour.com
```

### Dependencies

```json
{
  "resend": "^2.0.0"
}
```

## 🛠 Usage Examples

### Basic Email Sending

```typescript
import { emailService } from '@/lib/email'

// Send order confirmation
await emailService.sendOrderConfirmation(orderData)

// Send welcome email
await emailService.sendWelcomeEmail({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  language: 'en'
})

// Send password reset
await emailService.sendPasswordResetEmail({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  resetToken: 'secure-token',
  language: 'en'
})
```

### Utility Functions

```typescript
import { 
  sendWelcomeEmailToUser,
  sendPasswordResetEmailToUser,
  checkInventoryAndNotify,
  sendBulkOrderNotifications
} from '@/lib/email-utils'

// Send welcome email by user ID
await sendWelcomeEmailToUser('user-123', 'en')

// Send password reset
await sendPasswordResetEmailToUser('user@example.com', 'token', 'en')

// Check inventory and notify admin
await checkInventoryAndNotify(10) // threshold of 10 items

// Bulk send order confirmations
await sendBulkOrderNotifications('confirmation', {
  status: 'CONFIRMED',
  dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000)
})
```

### Newsletter Campaigns

```typescript
import { createNewsletterTemplate, sendNewsletterEmail } from '@/lib/email-utils'

// Create newsletter template
const { html, text } = createNewsletterTemplate(
  'Winter Collection 2024',
  '<h2>New arrivals are here!</h2><p>Check out our latest pieces...</p>',
  'Shop Now',
  'https://exvicpmour.com/collections/winter',
  'en'
)

// Send to recent customers
await sendNewsletterEmail(
  'EXVICPMOUR Winter Collection 2024',
  html,
  text,
  {
    onlyRecentCustomers: true,
    daysBack: 30
  }
)
```

## 🌐 Multilingual Support

The system supports English (en) and Russian (ru) languages:

```typescript
// English (default)
const orderData = {
  // ... other data
  language: 'en'
}

// Russian
const orderData = {
  // ... other data
  language: 'ru'
}
```

### Translation Coverage

- Order confirmations
- Status updates
- Welcome emails
- Password reset emails
- All customer-facing text
- Date and number formatting

## 🎨 Template Customization

### Email Styling

The email templates use a consistent design system:

- **Colors**: Black/white/gray palette matching EXVICPMOUR brand
- **Typography**: Inter font family for modern look
- **Layout**: Responsive grid system
- **Components**: Reusable cards, buttons, and status badges

### Custom Styles

```typescript
// Base styles are defined in getBaseEmailStyles()
const customHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    ${getBaseEmailStyles()}
  </head>
  <body>
    <div class="email-container">
      <!-- Your custom content -->
    </div>
  </body>
  </html>
`
```

## 📊 Monitoring and Analytics

### Email Statistics

```typescript
import { getEmailStats } from '@/lib/email-utils'

const stats = await getEmailStats(
  new Date('2024-01-01'), // from date
  new Date('2024-12-31')  // to date
)

console.log(stats)
// {
//   totalOrders: 1234,
//   uniqueCustomers: 567,
//   ordersByStatus: [...]
// }
```

### Error Handling

All email functions include comprehensive error handling:

```typescript
try {
  await emailService.sendOrderConfirmation(orderData)
} catch (error) {
  console.error('Email failed:', error)
  // Log to monitoring service
  // Retry logic if needed
}
```

## 🔄 Automation

### Order Flow Integration

```typescript
// In your order creation API
export async function createOrder(orderData: any) {
  const order = await prisma.order.create({ data: orderData })
  
  // Send confirmation email
  await emailService.sendOrderConfirmation(transformOrderData(order))
  
  // Send admin notification
  await emailService.sendAdminOrderNotification(transformAdminData(order))
  
  return order
}
```

### User Registration Hook

```typescript
// In your user registration
export async function registerUser(userData: any) {
  const user = await prisma.user.create({ data: userData })
  
  // Send welcome email
  await sendWelcomeEmailToUser(user.id, userData.language || 'en')
  
  return user
}
```

### Inventory Monitoring

Set up a cron job to check inventory:

```typescript
// In your scheduled task
import { checkInventoryAndNotify } from '@/lib/email-utils'

export async function dailyInventoryCheck() {
  const results = await checkInventoryAndNotify(5) // 5 item threshold
  console.log('Inventory check completed:', results)
}
```

## 🧪 Testing

### Test Email Function

```typescript
import { emailService } from '@/lib/email'

// Send test email
await emailService.sendTestEmail('test@example.com')
```

### Development Testing

For development, you can use services like:
- **MailHog**: Local SMTP testing
- **Resend**: Production-ready email service
- **Nodemailer**: For testing different SMTP providers

## 🚨 Best Practices

### 1. Rate Limiting
- Built-in delays between bulk emails
- Respect email provider limits
- Monitor bounce rates

### 2. Error Handling
- Always wrap email calls in try-catch
- Log failures for monitoring
- Implement retry logic for transient failures

### 3. Template Management
- Keep templates consistent with brand
- Test on multiple email clients
- Validate HTML for accessibility

### 4. Data Privacy
- Never log sensitive customer data
- Respect unsubscribe requests
- Follow GDPR/CCPA guidelines

## 📝 File Structure

```
src/lib/
├── email.ts              # Core email service and templates
├── email-utils.ts        # Utility functions and bulk operations
├── email-examples.ts     # Usage examples and documentation
└── prisma.ts            # Database client
```

## 🔗 API Integration

### REST API Examples

```typescript
// /api/emails/welcome
export async function POST(request: Request) {
  const { userId, language } = await request.json()
  
  try {
    await sendWelcomeEmailToUser(userId, language)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

// /api/emails/newsletter
export async function POST(request: Request) {
  const { subject, content, options } = await request.json()
  
  try {
    const results = await sendNewsletterEmail(subject, content, '', options)
    return Response.json({ success: true, results })
  } catch (error) {
    return Response.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
```

## 🛡 Security Considerations

- Email content is sanitized to prevent XSS
- Reset tokens are securely generated
- Admin emails are restricted to authorized addresses
- Rate limiting prevents abuse
- Sensitive data is never logged

## 📞 Support

For issues or questions about the email system:
1. Check the examples in `/src/lib/email-examples.ts`
2. Review error logs for specific issues
3. Test with the test email function
4. Verify environment variables are set correctly

---

**EXVICPMOUR Email System** - Professional, multilingual, responsive email communications for luxury e-commerce.