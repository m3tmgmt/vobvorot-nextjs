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
  estimatedDelivery?: string
  language?: 'en' | 'ru'
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

export interface WelcomeEmailData {
  customerName: string
  customerEmail: string
  language?: 'en' | 'ru'
}

export interface PasswordResetData {
  customerName: string
  customerEmail: string
  resetToken: string
  language?: 'en' | 'ru'
}

export interface LowStockNotificationData {
  productName: string
  sku: string
  currentStock: number
  minThreshold: number
  productUrl?: string
}

export interface SignOrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  signName: string
  extraNotes?: string
  amount: number
  estimatedDelivery: string
  language?: 'en' | 'ru'
}

// Localization texts
const translations = {
  en: {
    // Order Confirmation
    orderConfirmation: 'Order Confirmation',
    thankYou: 'Thank you for your order!',
    orderDetails: 'Order Details',
    orderNumber: 'Order Number',
    customer: 'Customer',
    email: 'Email',
    itemsOrdered: 'Items Ordered',
    item: 'Item',
    quantity: 'Qty',
    price: 'Price',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    shippingAddress: 'Shipping Address',
    estimatedDelivery: 'Estimated Delivery',
    shippingConfirmation: "We'll send you a shipping confirmation email when your order is on its way.",
    questions: 'Questions? Contact us at',
    copyright: '© 2024 EXVICPMOUR. All rights reserved.',
    
    // Order Status Update
    orderUpdate: 'Order Update',
    orderStatus: 'Order Status',
    trackingNumber: 'Tracking Number',
    trackPackage: 'Track Your Package',
    
    // Status messages
    pending: 'Your order is being processed',
    confirmed: 'Your order has been confirmed',
    processing: 'Your order is being prepared',
    shipped: 'Your order has been shipped',
    delivered: 'Your order has been delivered',
    cancelled: 'Your order has been cancelled',
    
    // Welcome Email
    welcome: 'Welcome to EXVICPMOUR!',
    welcomeMessage: 'Thank you for joining our exclusive community of fashion enthusiasts.',
    exploreCollection: 'Explore Our Collection',
    getStarted: 'Get started by browsing our latest arrivals and exclusive pieces.',
    benefits: 'As a member, you enjoy:',
    exclusiveAccess: 'Exclusive access to new collections',
    memberDiscounts: 'Member-only discounts and offers',
    freeShipping: 'Free shipping on orders over $100',
    prioritySupport: 'Priority customer support',
    
    // Password Reset
    passwordReset: 'Reset Your Password',
    passwordResetMessage: 'You requested to reset your password. Click the button below to create a new password.',
    resetPassword: 'Reset Password',
    linkExpires: 'This link will expire in 24 hours.',
    notRequested: "If you didn't request this, please ignore this email.",
    
    // Low Stock Admin
    lowStockAlert: 'Low Stock Alert',
    lowStockMessage: 'The following product is running low on stock and requires attention:',
    product: 'Product',
    currentStock: 'Current Stock',
    threshold: 'Minimum Threshold',
    action: 'Immediate action recommended to restock this item.',
    viewProduct: 'View Product'
  },
  ru: {
    // Order Confirmation
    orderConfirmation: 'Подтверждение заказа',
    thankYou: 'Спасибо за ваш заказ!',
    orderDetails: 'Детали заказа',
    orderNumber: 'Номер заказа',
    customer: 'Клиент',
    email: 'Email',
    itemsOrdered: 'Заказанные товары',
    item: 'Товар',
    quantity: 'Кол-во',
    price: 'Цена',
    total: 'Итого',
    subtotal: 'Подытог',
    shipping: 'Доставка',
    shippingAddress: 'Адрес доставки',
    estimatedDelivery: 'Ориентировочная дата доставки',
    shippingConfirmation: 'Мы отправим вам уведомление о доставке, когда ваш заказ будет отправлен.',
    questions: 'Вопросы? Свяжитесь с нами',
    copyright: '© 2024 EXVICPMOUR. Все права защищены.',
    
    // Order Status Update
    orderUpdate: 'Обновление заказа',
    orderStatus: 'Статус заказа',
    trackingNumber: 'Номер отслеживания',
    trackPackage: 'Отследить посылку',
    
    // Status messages
    pending: 'Ваш заказ обрабатывается',
    confirmed: 'Ваш заказ подтвержден',
    processing: 'Ваш заказ готовится к отправке',
    shipped: 'Ваш заказ отправлен',
    delivered: 'Ваш заказ доставлен',
    cancelled: 'Ваш заказ отменен',
    
    // Welcome Email
    welcome: 'Добро пожаловать в EXVICPMOUR!',
    welcomeMessage: 'Спасибо за присоединение к нашему эксклюзивному сообществу ценителей моды.',
    exploreCollection: 'Изучить коллекцию',
    getStarted: 'Начните с просмотра наших последних поступлений и эксклюзивных предметов.',
    benefits: 'Как участник, вы получаете:',
    exclusiveAccess: 'Эксклюзивный доступ к новым коллекциям',
    memberDiscounts: 'Скидки и предложения только для участников',
    freeShipping: 'Бесплатная доставка при заказе от $100',
    prioritySupport: 'Приоритетная поддержка клиентов',
    
    // Password Reset
    passwordReset: 'Сброс пароля',
    passwordResetMessage: 'Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы создать новый пароль.',
    resetPassword: 'Сбросить пароль',
    linkExpires: 'Эта ссылка истечет через 24 часа.',
    notRequested: 'Если вы не запрашивали это, просто игнорируйте это письмо.',
    
    // Low Stock Admin
    lowStockAlert: 'Уведомление о малом остатке',
    lowStockMessage: 'Следующий товар заканчивается на складе и требует внимания:',
    product: 'Товар',
    currentStock: 'Текущий остаток',
    threshold: 'Минимальный порог',
    action: 'Рекомендуется немедленное пополнение запасов.',
    viewProduct: 'Посмотреть товар'
  }
}

// Helper function to get base email styles
function getBaseEmailStyles(): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      .email-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
      }
      
      .header {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        padding: 30px 40px;
        text-align: center;
        border-radius: 12px 12px 0 0;
      }
      
      .header h1 {
        color: #ffffff;
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      .content {
        padding: 40px;
        background: #ffffff;
      }
      
      .card {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
        border-left: 4px solid #1a1a1a;
      }
      
      .button {
        display: inline-block;
        background: #1a1a1a;
        color: #ffffff !important;
        padding: 16px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        transition: all 0.3s ease;
        margin: 16px 0;
      }
      
      .button:hover {
        background: #2d2d2d;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(26, 26, 26, 0.2);
      }
      
      .button-secondary {
        background: transparent;
        color: #1a1a1a !important;
        border: 2px solid #1a1a1a;
      }
      
      .button-secondary:hover {
        background: #1a1a1a;
        color: #ffffff !important;
      }
      
      .footer {
        background: #f8f9fa;
        padding: 30px 40px;
        text-align: center;
        border-radius: 0 0 12px 12px;
        color: #6b7280;
        font-size: 14px;
      }
      
      .social-links {
        margin: 20px 0;
      }
      
      .social-links a {
        display: inline-block;
        margin: 0 10px;
        padding: 8px;
        background: #1a1a1a;
        color: #ffffff;
        border-radius: 50%;
        text-decoration: none;
        width: 40px;
        height: 40px;
        line-height: 24px;
        text-align: center;
      }
      
      .order-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .order-table th {
        background: #1a1a1a;
        color: #ffffff;
        padding: 16px;
        font-weight: 600;
        text-align: left;
      }
      
      .order-table td {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .order-table tr:last-child td {
        border-bottom: none;
      }
      
      .price {
        font-weight: 600;
        color: #059669;
      }
      
      .status-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-confirmed { background: #d1fae5; color: #065f46; }
      .status-processing { background: #fef3c7; color: #92400e; }
      .status-shipped { background: #dbeafe; color: #1e40af; }
      .status-delivered { background: #d1fae5; color: #065f46; }
      .status-cancelled { background: #fee2e2; color: #991b1b; }
      
      @media only screen and (max-width: 600px) {
        .email-container {
          margin: 0;
          border-radius: 0;
        }
        
        .header, .content, .footer {
          padding: 20px;
        }
        
        .order-table {
          font-size: 14px;
        }
        
        .order-table th,
        .order-table td {
          padding: 12px 8px;
        }
        
        .button {
          display: block;
          width: 100%;
          box-sizing: border-box;
        }
      }
    </style>
  `
}

export const emailService = {
  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(orderData: OrderEmailData): Promise<void> {
    const template = generateOrderConfirmationTemplate(orderData)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
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
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
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
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: orderData.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send welcome email to new customer
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    const template = generateWelcomeEmailTemplate(data)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetData): Promise<void> {
    const template = generatePasswordResetTemplate(data)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send low stock notification to admin
   */
  async sendLowStockNotification(data: LowStockNotificationData): Promise<void> {
    const template = generateLowStockNotificationTemplate(data)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send sign order confirmation email to customer
   */
  async sendSignOrderConfirmation(data: SignOrderEmailData): Promise<void> {
    const template = generateSignOrderConfirmationTemplate(data)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send payment confirmation email to customer (for completed payments)
   */
  async sendPaymentConfirmation(orderData: OrderEmailData): Promise<void> {
    const template = generatePaymentConfirmationTemplate(orderData)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: orderData.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  },

  /**
   * Send payment notification to admin (for completed payments)
   */
  async sendAdminPaymentNotification(data: AdminNotificationData): Promise<void> {
    const template = generateAdminPaymentNotificationTemplate(data)
    const client = getResendClient()
    
    await client.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
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
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to,
      subject: 'Test Email from EXVICPMOUR Store',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${getBaseEmailStyles()}
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>EXVICPMOUR</h1>
            </div>
            <div class="content">
              <h2>Email Test Successful!</h2>
              <p>This is a test email from EXVICPMOUR. If you received this message, the email service is working correctly.</p>
              <div class="card">
                <p><strong>Test Details:</strong></p>
                <p>Timestamp: ${new Date().toISOString()}</p>
                <p>Recipient: ${to}</p>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 EXVICPMOUR. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: 'This is a test email from EXVICPMOUR. If you received this, email service is working correctly!'
    })
  }
}

/**
 * Generate order confirmation email template
 */
function generateOrderConfirmationTemplate(orderData: OrderEmailData): EmailTemplate {
  const lang = orderData.language || 'en'
  const t = translations[lang]
  
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td>
        <div style="display: flex; align-items: center;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 16px;">` : ''}
          <div>
            <div style="font-weight: 600; color: #1a1a1a;">${item.name}</div>
            ${item.size ? `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Size: ${item.size}</div>` : ''}
            ${item.color ? `<div style="font-size: 14px; color: #6b7280; margin-top: 2px;">Color: ${item.color}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
      <td style="text-align: right; font-weight: 600;">$${Number(item.price).toFixed(2)}</td>
      <td style="text-align: right; font-weight: 600; color: #059669;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${t.orderConfirmation} - ${orderData.orderNumber}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">${t.orderConfirmation}</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 8px 0;">${t.thankYou}</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">Order #${orderData.orderNumber}</p>
          </div>

          <div class="card">
            <h3 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">${t.orderDetails}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">${t.orderNumber}</p>
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${orderData.orderNumber}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">${t.customer}</p>
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${orderData.customerName}</p>
              </div>
            </div>
            ${orderData.estimatedDelivery ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${t.estimatedDelivery}</p>
                <p style="margin: 4px 0 0 0; font-weight: 600; color: #059669;">${orderData.estimatedDelivery}</p>
              </div>
            ` : ''}
          </div>

          <div style="margin: 32px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px;">${t.itemsOrdered}</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>${t.item}</th>
                  <th style="text-align: center;">${t.quantity}</th>
                  <th style="text-align: right;">${t.price}</th>
                  <th style="text-align: right;">${t.total}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="margin: 32px 0;">
            <div style="background: #f8f9fa; border-radius: 12px; padding: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280;">${t.subtotal}:</span>
                <span style="font-weight: 600;">$${Number(orderData.subtotal).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <span style="color: #6b7280;">${t.shipping}:</span>
                <span style="font-weight: 600;">$${Number(orderData.shippingCost).toFixed(2)}</span>
              </div>
              <div style="border-top: 2px solid #1a1a1a; padding-top: 16px; display: flex; justify-content: space-between;">
                <span style="font-size: 18px; font-weight: 700; color: #1a1a1a;">${t.total}:</span>
                <span style="font-size: 18px; font-weight: 700; color: #059669;">$${Number(orderData.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">${t.shippingAddress}</h3>
            <div style="color: #6b7280; line-height: 1.6;">
              <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">${orderData.shippingAddress.name}</div>
              <div>${orderData.shippingAddress.address}</div>
              <div>${orderData.shippingAddress.city}, ${orderData.shippingAddress.zip}</div>
              <div>${orderData.shippingAddress.country}</div>
            </div>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders" class="button">
              View Order Details
            </a>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
              ${t.shippingConfirmation}
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              ${t.questions} <a href="mailto:noreply@vobvorot.com" style="color: #1a1a1a; font-weight: 600;">noreply@vobvorot.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="#" style="text-decoration: none;">📧</a>
            <a href="#" style="text-decoration: none;">📱</a>
            <a href="#" style="text-decoration: none;">🌐</a>
          </div>
          <p style="margin: 0; font-size: 14px;">${t.copyright}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Luxury Fashion Redefined
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${t.orderConfirmation} - ${orderData.orderNumber}

${t.thankYou}

${t.orderDetails}:
- ${t.orderNumber}: ${orderData.orderNumber}
- ${t.customer}: ${orderData.customerName}
- ${t.email}: ${orderData.customerEmail}
${orderData.estimatedDelivery ? `- ${t.estimatedDelivery}: ${orderData.estimatedDelivery}` : ''}

${t.itemsOrdered}:
${orderData.items.map(item => 
  `- ${item.name} ${item.size ? `(Size: ${item.size})` : ''} ${item.color ? `(Color: ${item.color})` : ''} x${item.quantity} - $${(Number(item.price) * item.quantity).toFixed(2)}`
).join('\n')}

${t.subtotal}: $${Number(orderData.subtotal).toFixed(2)}
${t.shipping}: $${Number(orderData.shippingCost).toFixed(2)}
${t.total}: $${Number(orderData.total).toFixed(2)}

${t.shippingAddress}:
${orderData.shippingAddress.name}
${orderData.shippingAddress.address}
${orderData.shippingAddress.city}, ${orderData.shippingAddress.zip}
${orderData.shippingAddress.country}

${t.shippingConfirmation}
${t.questions} noreply@vobvorot.com

${t.copyright}
  `

  return {
    subject: `${t.orderConfirmation} - ${orderData.orderNumber}`,
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
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">New Order Alert</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #059669; font-size: 32px;">🎉</span>
            </div>
            <h2 style="color: #059669; font-size: 24px; margin: 0 0 8px 0;">New Order Received!</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">
              Order #${data.orderNumber}
            </p>
          </div>

          <div class="card" style="border-left: 4px solid #059669;">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px;">Order Summary</h3>
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Order Number:</span>
                <span style="font-weight: 600; color: #1a1a1a; font-family: monospace;">${data.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Customer:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.customerName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Email:</span>
                <a href="mailto:${data.customerEmail}" style="font-weight: 600; color: #1a1a1a; text-decoration: none;">${data.customerEmail}</a>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Total Amount:</span>
                <span style="font-weight: 700; color: #059669; font-size: 20px;">$${Number(data.total).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Items:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.itemCount} item(s)</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Payment Method:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.paymentMethod}</span>
              </div>
              <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500; display: block; margin-bottom: 8px;">Shipping Address:</span>
                <span style="color: #1a1a1a; line-height: 1.5;">${data.shippingAddress}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${data.orderNumber}" class="button">
              View Order Details
            </a>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders" class="button button-secondary" style="margin-left: 16px;">
              All Orders
            </a>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 20px; margin: 32px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="color: #0ea5e9; font-size: 20px; margin-right: 12px;">💡</span>
              <h4 style="color: #0c4a6e; margin: 0; font-size: 16px; font-weight: 600;">Quick Actions</h4>
            </div>
            <ul style="color: #0c4a6e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
              <li>Confirm and process the order</li>
              <li>Check inventory levels</li>
              <li>Prepare shipping label</li>
              <li>Send customer confirmation</li>
            </ul>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This is an automated notification from EXVICPMOUR Order Management System.
            </p>
            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 12px;">
              Timestamp: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0; font-size: 14px;">© 2024 EXVICPMOUR. All rights reserved.</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Admin Dashboard
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🎉 New Order Received! - ${data.orderNumber}

Order Summary:
- Order Number: ${data.orderNumber}
- Customer: ${data.customerName}
- Email: ${data.customerEmail}
- Total Amount: $${Number(data.total).toFixed(2)}
- Items: ${data.itemCount} item(s)
- Payment Method: ${data.paymentMethod}
- Shipping Address: ${data.shippingAddress}

Quick Actions:
- Confirm and process the order
- Check inventory levels
- Prepare shipping label
- Send customer confirmation

View order details: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${data.orderNumber}
All orders: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders

This is an automated notification from EXVICPMOUR Order Management System.
Timestamp: ${new Date().toLocaleString()}
  `

  return {
    subject: `🎉 New Order Received - ${data.orderNumber} - $${Number(data.total).toFixed(2)}`,
    html,
    text
  }
}

/**
 * Generate order status update email template
 */
function generateOrderStatusUpdateTemplate(orderData: OrderEmailData): EmailTemplate {
  const lang = orderData.language || 'en'
  const t = translations[lang]
  
  const statusClass = `status-${orderData.status?.toLowerCase()}`
  const statusMessage = t[orderData.status?.toLowerCase() as keyof typeof t] || t.pending

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${t.orderUpdate} - ${orderData.orderNumber}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">${t.orderUpdate}</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 16px 0;">${statusMessage}</h2>
            <span class="status-badge ${statusClass}" style="font-size: 14px;">${orderData.status}</span>
          </div>

          <div class="card">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px;">${t.orderDetails}</h3>
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280;">${t.orderNumber}:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${orderData.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280;">${t.orderStatus}:</span>
                <span class="status-badge ${statusClass}">${orderData.status}</span>
              </div>
              ${orderData.trackingNumber ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6b7280;">${t.trackingNumber}:</span>
                  <span style="font-weight: 600; color: #1a1a1a; font-family: monospace;">${orderData.trackingNumber}</span>
                </div>
              ` : ''}
              ${orderData.estimatedDelivery ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6b7280;">${t.estimatedDelivery}:</span>
                  <span style="font-weight: 600; color: #059669;">${orderData.estimatedDelivery}</span>
                </div>
              ` : ''}
            </div>
          </div>

          ${orderData.status === 'SHIPPED' && orderData.trackingNumber ? `
            <div style="text-align: center; margin: 32px 0;">
              <a href="#" class="button">
                ${t.trackPackage}
              </a>
              <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0 0;">
                ${t.trackingNumber}: ${orderData.trackingNumber}
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders/${orderData.orderNumber}" class="button button-secondary">
              View Order Details
            </a>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              ${t.questions} <a href="mailto:noreply@vobvorot.com" style="color: #1a1a1a; font-weight: 600;">noreply@vobvorot.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="#" style="text-decoration: none;">📧</a>
            <a href="#" style="text-decoration: none;">📱</a>
            <a href="#" style="text-decoration: none;">🌐</a>
          </div>
          <p style="margin: 0; font-size: 14px;">${t.copyright}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Luxury Fashion Redefined
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${t.orderUpdate} - ${orderData.orderNumber}

${statusMessage}

${t.orderDetails}:
- ${t.orderNumber}: ${orderData.orderNumber}
- ${t.orderStatus}: ${orderData.status}
${orderData.trackingNumber ? `- ${t.trackingNumber}: ${orderData.trackingNumber}` : ''}
${orderData.estimatedDelivery ? `- ${t.estimatedDelivery}: ${orderData.estimatedDelivery}` : ''}

${t.questions} noreply@vobvorot.com

${t.copyright}
  `

  return {
    subject: `${t.orderUpdate} - ${orderData.orderNumber} - ${orderData.status}`,
    html,
    text
  }
}

/**
 * Generate welcome email template
 */
function generateWelcomeEmailTemplate(data: WelcomeEmailData): EmailTemplate {
  const lang = data.language || 'en'
  const t = translations[lang]

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${t.welcome}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">Welcome to Luxury</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #1a1a1a; font-size: 28px; margin: 0 0 16px 0;">${t.welcome}</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0; line-height: 1.6;">
              ${t.welcomeMessage}
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <img src="${process.env.NEXT_PUBLIC_SITE_URL}/images/welcome-hero.jpg" 
                 alt="EXVICPMOUR Collection" 
                 style="max-width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;">
          </div>

          <div class="card">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px; text-align: center;">${t.benefits}</h3>
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; align-items: center; padding: 16px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 40px; height: 40px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                  <span style="color: #ffffff; font-size: 20px;">✨</span>
                </div>
                <span style="color: #1a1a1a; font-weight: 500;">${t.exclusiveAccess}</span>
              </div>
              <div style="display: flex; align-items: center; padding: 16px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 40px; height: 40px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                  <span style="color: #ffffff; font-size: 20px;">🎯</span>
                </div>
                <span style="color: #1a1a1a; font-weight: 500;">${t.memberDiscounts}</span>
              </div>
              <div style="display: flex; align-items: center; padding: 16px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 40px; height: 40px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                  <span style="color: #ffffff; font-size: 20px;">🚚</span>
                </div>
                <span style="color: #1a1a1a; font-weight: 500;">${t.freeShipping}</span>
              </div>
              <div style="display: flex; align-items: center; padding: 16px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 40px; height: 40px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                  <span style="color: #ffffff; font-size: 20px;">💬</span>
                </div>
                <span style="color: #1a1a1a; font-weight: 500;">${t.prioritySupport}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/collections" class="button">
              ${t.exploreCollection}
            </a>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
              ${t.getStarted}
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              ${t.questions} <a href="mailto:noreply@vobvorot.com" style="color: #1a1a1a; font-weight: 600;">noreply@vobvorot.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="#" style="text-decoration: none;">📧</a>
            <a href="#" style="text-decoration: none;">📱</a>
            <a href="#" style="text-decoration: none;">🌐</a>
          </div>
          <p style="margin: 0; font-size: 14px;">${t.copyright}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Luxury Fashion Redefined
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${t.welcome}

${t.welcomeMessage}

${t.benefits}:
- ${t.exclusiveAccess}
- ${t.memberDiscounts}
- ${t.freeShipping}
- ${t.prioritySupport}

${t.getStarted}

${t.exploreCollection}: ${process.env.NEXT_PUBLIC_SITE_URL}/collections

${t.questions} noreply@vobvorot.com

${t.copyright}
  `

  return {
    subject: t.welcome,
    html,
    text
  }
}

/**
 * Generate password reset email template
 */
function generatePasswordResetTemplate(data: PasswordResetData): EmailTemplate {
  const lang = data.language || 'en'
  const t = translations[lang]
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${data.resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${t.passwordReset}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">Security</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 16px 0;">${t.passwordReset}</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0; line-height: 1.6;">
              Hello ${data.customerName}
            </p>
          </div>

          <div class="card">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="color: #dc2626; font-size: 32px;">🔒</span>
              </div>
            </div>
            <p style="color: #374151; margin: 0 0 24px 0; text-align: center; line-height: 1.6;">
              ${t.passwordResetMessage}
            </p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                ${t.resetPassword}
              </a>
            </div>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 32px 0;">
            <div style="display: flex; align-items: flex-start;">
              <span style="color: #f59e0b; font-size: 20px; margin-right: 12px; margin-top: 2px;">⚠️</span>
              <div>
                <p style="color: #92400e; margin: 0 0 8px 0; font-weight: 600;">Security Notice</p>
                <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                  ${t.linkExpires}<br>
                  ${t.notRequested}
                </p>
              </div>
            </div>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              ${t.questions} <a href="mailto:noreply@vobvorot.com" style="color: #1a1a1a; font-weight: 600;">noreply@vobvorot.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="#" style="text-decoration: none;">📧</a>
            <a href="#" style="text-decoration: none;">📱</a>
            <a href="#" style="text-decoration: none;">🌐</a>
          </div>
          <p style="margin: 0; font-size: 14px;">${t.copyright}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Luxury Fashion Redefined
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${t.passwordReset}

Hello ${data.customerName},

${t.passwordResetMessage}

${t.resetPassword}: ${resetUrl}

${t.linkExpires}
${t.notRequested}

${t.questions} noreply@vobvorot.com

${t.copyright}
  `

  return {
    subject: t.passwordReset,
    html,
    text
  }
}

/**
 * Generate low stock notification template for admin
 */
function generateLowStockNotificationTemplate(data: LowStockNotificationData): EmailTemplate {
  const t = translations.en // Admin emails in English

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${t.lowStockAlert}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">${t.lowStockAlert}</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #dc2626; font-size: 32px;">📦</span>
            </div>
            <h2 style="color: #dc2626; font-size: 24px; margin: 0 0 8px 0;">${t.lowStockAlert}</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">
              ${t.lowStockMessage}
            </p>
          </div>

          <div class="card" style="border-left: 4px solid #dc2626;">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px;">${t.product} Details</h3>
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">${t.product}:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.productName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">SKU:</span>
                <span style="font-weight: 600; color: #1a1a1a; font-family: monospace;">${data.sku}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">${t.currentStock}:</span>
                <span style="font-weight: 600; color: #dc2626; font-size: 18px;">${data.currentStock}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">${t.threshold}:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.minThreshold}</span>
              </div>
            </div>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 32px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="color: #f59e0b; font-size: 20px; margin-right: 12px;">⚠️</span>
              <h4 style="color: #92400e; margin: 0; font-size: 16px; font-weight: 600;">Action Required</h4>
            </div>
            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
              ${t.action}
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            ${data.productUrl ? `
              <a href="${data.productUrl}" class="button">
                ${t.viewProduct}
              </a>
            ` : `
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/inventory" class="button">
                Manage Inventory
              </a>
            `}
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This is an automated system notification from EXVICPMOUR Inventory Management.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0; font-size: 14px;">${t.copyright}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Admin Dashboard
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${t.lowStockAlert}

${t.lowStockMessage}

${t.product} Details:
- ${t.product}: ${data.productName}
- SKU: ${data.sku}
- ${t.currentStock}: ${data.currentStock}
- ${t.threshold}: ${data.minThreshold}

${t.action}

${data.productUrl ? `${t.viewProduct}: ${data.productUrl}` : `Manage Inventory: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/inventory`}

This is an automated system notification from EXVICPMOUR Inventory Management.
${t.copyright}
  `

  return {
    subject: `🚨 ${t.lowStockAlert} - ${data.productName}`,
    html,
    text
  }
}

/**
 * Generate sign order confirmation email template
 */
function generateSignOrderConfirmationTemplate(data: SignOrderEmailData): EmailTemplate {
  const lang = data.language || 'en'
  const t = translations[lang]

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Your Name, My Pic - Order Confirmation</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #FF6B9D 0%, #9D4EDD 100%);">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">Your Name, My Pic</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FF6B9D, #9D4EDD); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #ffffff; font-size: 32px;">✍️</span>
            </div>
            <h2 style="color: #1a1a1a; font-size: 28px; margin: 0 0 16px 0;">Thanks, babe. It's cooking.</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0; line-height: 1.6;">
              Hey ${data.customerName}! Your custom sign photo is on its way.
            </p>
          </div>

          <div class="card" style="border-left: 4px solid #FF6B9D;">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Order Details</h3>
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Order Number:</span>
                <span style="font-weight: 600; color: #1a1a1a; font-family: monospace;">${data.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Sign Text:</span>
                <span style="font-weight: 600; color: #FF6B9D; font-size: 18px;">"${data.signName}"</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Amount Paid:</span>
                <span style="font-weight: 600; color: #1a1a1a; font-size: 18px;">$${data.amount.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Estimated Delivery:</span>
                <span style="font-weight: 600; color: #9D4EDD;">${data.estimatedDelivery}</span>
              </div>
            </div>
            ${data.extraNotes ? `
              <div style="margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 16px;">Your Notes:</h4>
                <p style="color: #6b7280; margin: 0; font-style: italic;">"${data.extraNotes}"</p>
              </div>
            ` : ''}
          </div>

          <div style="background: linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(157, 78, 221, 0.1)); border: 1px solid #FF6B9D; border-radius: 12px; padding: 20px; margin: 32px 0;">
            <div style="text-align: center;">
              <h4 style="color: #FF6B9D; margin: 0 0 12px 0; font-size: 18px;">What Happens Next?</h4>
              <div style="display: grid; gap: 12px; text-align: left;">
                <div style="display: flex; align-items: center;">
                  <span style="color: #FF6B9D; font-size: 20px; margin-right: 12px;">✨</span>
                  <span style="color: #1a1a1a; font-size: 14px;">I'll handwrite your sign with love and style</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #9D4EDD; font-size: 20px; margin-right: 12px;">📸</span>
                  <span style="color: #1a1a1a; font-size: 14px;">Take a gorgeous photo just for you</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #FF6B9D; font-size: 20px; margin-right: 12px;">💌</span>
                  <span style="color: #1a1a1a; font-size: 14px;">Send it directly to your email in 2-7 days</span>
                </div>
              </div>
            </div>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
              Stay golden, stay chill. ✨
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Questions? Reply to this email or contact us at <a href="mailto:noreply@vobvorot.com" style="color: #FF6B9D; font-weight: 600;">noreply@vobvorot.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="#" style="text-decoration: none;">📧</a>
            <a href="#" style="text-decoration: none;">📱</a>
            <a href="#" style="text-decoration: none;">🌐</a>
          </div>
          <p style="margin: 0; font-size: 14px;">${t.copyright}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Your Name, My Pic
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Your Name, My Pic - Order Confirmation

Thanks, babe. It's cooking.

Hey ${data.customerName}! Your custom sign photo is on its way.

Order Details:
- Order Number: ${data.orderNumber}
- Sign Text: "${data.signName}"
- Amount Paid: $${data.amount.toFixed(2)}
- Estimated Delivery: ${data.estimatedDelivery}
${data.extraNotes ? `- Your Notes: "${data.extraNotes}"` : ''}

What Happens Next?
✨ I'll handwrite your sign with love and style
📸 Take a gorgeous photo just for you
💌 Send it directly to your email in 2-7 days

Stay golden, stay chill. ✨

Questions? Reply to this email or contact us at noreply@vobvorot.com

${t.copyright}
EXVICPMOUR - Your Name, My Pic
  `

  return {
    subject: `✍️ Your custom sign "${data.signName}" is being created!`,
    html,
    text
  }
}

/**
 * Generate payment confirmation email template
 */
function generatePaymentConfirmationTemplate(orderData: OrderEmailData): EmailTemplate {
  const lang = orderData.language || 'en'
  const t = translations[lang]
  
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td>
        <div style="display: flex; align-items: center;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 16px;">` : ''}
          <div>
            <div style="font-weight: 600; color: #1a1a1a;">${item.name}</div>
            ${item.size ? `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Size: ${item.size}</div>` : ''}
            ${item.color ? `<div style="font-size: 14px; color: #6b7280; margin-top: 2px;">Color: ${item.color}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
      <td style="text-align: right; font-weight: 600;">$${Number(item.price).toFixed(2)}</td>
      <td style="text-align: right; font-weight: 600; color: #059669;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Confirmed - ${orderData.orderNumber}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">Payment Confirmed</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #059669; font-size: 32px;">✅</span>
            </div>
            <h2 style="color: #059669; font-size: 24px; margin: 0 0 8px 0;">Payment Successful!</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">Order #${orderData.orderNumber}</p>
          </div>

          <div style="background: #d1fae5; border: 1px solid #059669; border-radius: 12px; padding: 20px; margin: 32px 0; text-align: center;">
            <h3 style="color: #059669; margin: 0 0 12px 0; font-size: 18px;">Your payment has been processed successfully!</h3>
            <p style="color: #047857; margin: 0; font-size: 14px;">
              Your order is now confirmed and will be processed for shipping.
            </p>
          </div>

          <div class="card">
            <h3 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">Order Summary</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">Order Number</p>
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${orderData.orderNumber}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">Customer</p>
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${orderData.customerName}</p>
              </div>
            </div>
          </div>

          <div style="margin: 32px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px;">Items Ordered</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="margin: 32px 0;">
            <div style="background: #f8f9fa; border-radius: 12px; padding: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280;">Subtotal:</span>
                <span style="font-weight: 600;">$${Number(orderData.subtotal).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <span style="color: #6b7280;">Shipping:</span>
                <span style="font-weight: 600;">$${Number(orderData.shippingCost).toFixed(2)}</span>
              </div>
              <div style="border-top: 2px solid #059669; padding-top: 16px; display: flex; justify-content: space-between;">
                <span style="font-size: 18px; font-weight: 700; color: #1a1a1a;">Total Paid:</span>
                <span style="font-size: 18px; font-weight: 700; color: #059669;">$${Number(orderData.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders" class="button">
              Track Your Order
            </a>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
              We'll send you a shipping confirmation when your order is on its way.
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Questions? Contact us at <a href="mailto:noreply@vobvorot.com" style="color: #1a1a1a; font-weight: 600;">noreply@vobvorot.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="#" style="text-decoration: none;">📧</a>
            <a href="#" style="text-decoration: none;">📱</a>
            <a href="#" style="text-decoration: none;">🌐</a>
          </div>
          <p style="margin: 0; font-size: 14px;">© 2024 EXVICPMOUR. All rights reserved.</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Luxury Fashion Redefined
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Payment Successful! - ${orderData.orderNumber}

Your payment has been processed successfully!
Your order is now confirmed and will be processed for shipping.

Order Summary:
- Order Number: ${orderData.orderNumber}
- Customer: ${orderData.customerName}
- Email: ${orderData.customerEmail}

Items Ordered:
${orderData.items.map(item => 
  `- ${item.name} ${item.size ? `(Size: ${item.size})` : ''} ${item.color ? `(Color: ${item.color})` : ''} x${item.quantity} - $${(Number(item.price) * item.quantity).toFixed(2)}`
).join('\n')}

Subtotal: $${Number(orderData.subtotal).toFixed(2)}
Shipping: $${Number(orderData.shippingCost).toFixed(2)}
Total Paid: $${Number(orderData.total).toFixed(2)}

We'll send you a shipping confirmation when your order is on its way.
Questions? Contact us at noreply@vobvorot.com

© 2024 EXVICPMOUR. All rights reserved.
  `

  return {
    subject: `✅ Payment Confirmed - Order ${orderData.orderNumber}`,
    html,
    text
  }
}

/**
 * Generate admin payment notification template
 */
function generateAdminPaymentNotificationTemplate(data: AdminNotificationData): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Received - ${data.orderNumber}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
          <h1>EXVICPMOUR</h1>
          <p style="color: #ffffff; font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">Payment Received</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #059669; font-size: 32px;">💰</span>
            </div>
            <h2 style="color: #059669; font-size: 24px; margin: 0 0 8px 0;">Payment Received!</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">
              Order #${data.orderNumber}
            </p>
          </div>

          <div class="card" style="border-left: 4px solid #059669;">
            <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px;">Payment Details</h3>
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Order Number:</span>
                <span style="font-weight: 600; color: #1a1a1a; font-family: monospace;">${data.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Customer:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.customerName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Email:</span>
                <a href="mailto:${data.customerEmail}" style="font-weight: 600; color: #1a1a1a; text-decoration: none;">${data.customerEmail}</a>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Amount Received:</span>
                <span style="font-weight: 700; color: #059669; font-size: 20px;">$${Number(data.total).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Payment Method:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.paymentMethod}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 500;">Items:</span>
                <span style="font-weight: 600; color: #1a1a1a;">${data.itemCount} item(s)</span>
              </div>
            </div>
          </div>

          <div style="background: #d1fae5; border: 1px solid #059669; border-radius: 12px; padding: 20px; margin: 32px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="color: #059669; font-size: 20px; margin-right: 12px;">📋</span>
              <h4 style="color: #047857; margin: 0; font-size: 16px; font-weight: 600;">Next Steps</h4>
            </div>
            <ul style="color: #047857; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
              <li>Process the order for fulfillment</li>
              <li>Prepare items for shipping</li>
              <li>Generate shipping label and tracking</li>
              <li>Send shipping confirmation to customer</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${data.orderNumber}" class="button">
              Process Order
            </a>
          </div>

          <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; margin: 32px 0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Payment processing completed automatically.
            </p>
            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 12px;">
              Timestamp: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0; font-size: 14px;">© 2024 EXVICPMOUR. All rights reserved.</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            EXVICPMOUR - Admin Dashboard
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
💰 Payment Received! - ${data.orderNumber}

Payment Details:
- Order Number: ${data.orderNumber}
- Customer: ${data.customerName}
- Email: ${data.customerEmail}
- Amount Received: $${Number(data.total).toFixed(2)}
- Payment Method: ${data.paymentMethod}
- Items: ${data.itemCount} item(s)

Next Steps:
- Process the order for fulfillment
- Prepare items for shipping
- Generate shipping label and tracking
- Send shipping confirmation to customer

Process order: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${data.orderNumber}

Payment processing completed automatically.
Timestamp: ${new Date().toLocaleString()}
  `

  return {
    subject: `💰 Payment Received - ${data.orderNumber} - $${Number(data.total).toFixed(2)}`,
    html,
    text
  }
}

/**
 * Generic email sending function
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  const client = getResendClient()
  
  await client.emails.send({
    from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  })
}