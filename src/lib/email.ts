import { Resend } from 'resend'

let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    color?: string
    imageUrl?: string
  }>
  subtotal: number
  shippingCost: number
  total: number
  shippingAddress: {
    name: string
    address: string
    city: string
    country: string
    zip: string
  }
  trackingNumber?: string
  status?: string
}

export interface AdminNotificationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  itemCount: number
  paymentMethod: string
  shippingAddress: string
}

export const emailService = {
  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(orderData: OrderEmailData): Promise<void> {
    const template = generateOrderConfirmationTemplate(orderData)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@exvicpmour.com',
      to: orderData.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send new order notification to admin
   */
  async sendAdminOrderNotification(data: AdminNotificationData): Promise<void> {
    const template = generateAdminNotificationTemplate(data)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@exvicpmour.com',
      to: process.env.ADMIN_EMAIL || 'admin@exvicpmour.com',
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send order status update email to customer
   */
  async sendOrderStatusUpdate(orderData: OrderEmailData): Promise<void> {
    const template = generateOrderStatusUpdateTemplate(orderData)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@exvicpmour.com',
      to: orderData.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Test email functionality
   */
  async sendTestEmail(to: string): Promise<void> {
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@exvicpmour.com',
      to,
      subject: 'Test Email from Exvicpmour Store',
      html: '<p>This is a test email. If you received this, email service is working correctly!</p>',
      text: 'This is a test email. If you received this, email service is working correctly!'
    })
  }
}

/**
 * Generate order confirmation email template
 */
function generateOrderConfirmationTemplate(orderData: OrderEmailData): EmailTemplate {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle;">` : ''}
        <strong>${item.name}</strong>
        ${item.size ? `<br><small>Size: ${item.size}</small>` : ''}
        ${item.color ? `<br><small>Color: ${item.color}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Confirmation - ${orderData.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin-bottom: 10px;">Order Confirmation</h1>
        <p style="font-size: 18px; color: #7f8c8d;">Thank you for your order!</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Order Details</h2>
        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
        <p><strong>Customer:</strong> ${orderData.customerName}</p>
        <p><strong>Email:</strong> ${orderData.customerEmail}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #2c3e50;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #34495e; color: white;">
              <th style="padding: 12px; text-align: left;">Item</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: right;">Price</th>
              <th style="padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 8px; text-align: right; width: 100px;">$${orderData.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; text-align: right;"><strong>Shipping:</strong></td>
            <td style="padding: 8px; text-align: right;">$${orderData.shippingCost.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #34495e;">
            <td style="padding: 12px; text-align: right; font-size: 18px;"><strong>Total:</strong></td>
            <td style="padding: 12px; text-align: right; font-size: 18px; color: #27ae60;"><strong>$${orderData.total.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Shipping Address</h3>
        <p>
          ${orderData.shippingAddress.name}<br>
          ${orderData.shippingAddress.address}<br>
          ${orderData.shippingAddress.city}, ${orderData.shippingAddress.zip}<br>
          ${orderData.shippingAddress.country}
        </p>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #7f8c8d;">
          We'll send you a shipping confirmation email when your order is on its way.<br>
          Questions? Contact us at <a href="mailto:support@exvicpmour.com" style="color: #3498db;">support@exvicpmour.com</a>
        </p>
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
          © 2024 Exvicpmour Store. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
Order Confirmation - ${orderData.orderNumber}

Thank you for your order, ${orderData.customerName}!

Order Details:
- Order Number: ${orderData.orderNumber}
- Customer: ${orderData.customerName}
- Email: ${orderData.customerEmail}

Items Ordered:
${orderData.items.map(item => 
  `- ${item.name} ${item.size ? `(Size: ${item.size})` : ''} ${item.color ? `(Color: ${item.color})` : ''} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

Order Summary:
Subtotal: $${orderData.subtotal.toFixed(2)}
Shipping: $${orderData.shippingCost.toFixed(2)}
Total: $${orderData.total.toFixed(2)}

Shipping Address:
${orderData.shippingAddress.name}
${orderData.shippingAddress.address}
${orderData.shippingAddress.city}, ${orderData.shippingAddress.zip}
${orderData.shippingAddress.country}

We'll send you a shipping confirmation email when your order is on its way.
Questions? Contact us at support@exvicpmour.com

© 2024 Exvicpmour Store. All rights reserved.
  `

  return {
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html,
    text
  }
}

/**
 * Generate admin notification email template
 */
function generateAdminNotificationTemplate(data: AdminNotificationData): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Order - ${data.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #e74c3c; margin-bottom: 10px;">🎉 New Order Received!</h1>
        <p style="font-size: 18px; color: #7f8c8d;">Order ${data.orderNumber}</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Order Summary</h2>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Order Number:</td>
            <td style="padding: 8px;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Customer:</td>
            <td style="padding: 8px;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px; color: #27ae60; font-size: 18px; font-weight: bold;">$${data.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Items:</td>
            <td style="padding: 8px;">${data.itemCount} item(s)</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Payment Method:</td>
            <td style="padding: 8px;">${data.paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Shipping Address:</td>
            <td style="padding: 8px;">${data.shippingAddress}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders" 
           style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Order in Admin Panel
        </a>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #7f8c8d; font-size: 14px;">
          This is an automated notification from Exvicpmour Store.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
New Order Received! - ${data.orderNumber}

Order Summary:
- Order Number: ${data.orderNumber}
- Customer: ${data.customerName}
- Email: ${data.customerEmail}
- Total Amount: $${data.total.toFixed(2)}
- Items: ${data.itemCount} item(s)
- Payment Method: ${data.paymentMethod}
- Shipping Address: ${data.shippingAddress}

View order details in the admin panel: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders

This is an automated notification from Exvicpmour Store.
  `

  return {
    subject: `🎉 New Order Received - ${data.orderNumber}`,
    html,
    text
  }
}

/**
 * Generate order status update email template
 */
function generateOrderStatusUpdateTemplate(orderData: OrderEmailData): EmailTemplate {
  const statusMessages = {
    PENDING: 'Your order is being processed',
    CONFIRMED: 'Your order has been confirmed',
    PROCESSING: 'Your order is being prepared',
    SHIPPED: 'Your order has been shipped',
    DELIVERED: 'Your order has been delivered',
    CANCELLED: 'Your order has been cancelled'
  }

  const statusMessage = statusMessages[orderData.status as keyof typeof statusMessages] || 'Your order status has been updated'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Update - ${orderData.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin-bottom: 10px;">Order Update</h1>
        <p style="font-size: 18px; color: #7f8c8d;">${statusMessage}</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Order Details</h2>
        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
        <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">${orderData.status}</span></p>
        ${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
      </div>

      ${orderData.status === 'SHIPPED' && orderData.trackingNumber ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Track Your Package
          </a>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #7f8c8d;">
          Questions? Contact us at <a href="mailto:support@exvicpmour.com" style="color: #3498db;">support@exvicpmour.com</a>
        </p>
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
          © 2024 Exvicpmour Store. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
Order Update - ${orderData.orderNumber}

${statusMessage}

Order Details:
- Order Number: ${orderData.orderNumber}
- Status: ${orderData.status}
${orderData.trackingNumber ? `- Tracking Number: ${orderData.trackingNumber}` : ''}

Questions? Contact us at support@exvicpmour.com

© 2024 Exvicpmour Store. All rights reserved.
  `

  return {
    subject: `Order Update - ${orderData.orderNumber} - ${orderData.status}`,
    html,
    text
  }
}