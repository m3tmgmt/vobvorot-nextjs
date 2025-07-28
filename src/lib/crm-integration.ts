// CRM Integration - связывает заказы с Telegram CRM

import { createTelegramCRM, Customer, Order } from './telegram-crm';
import { analytics } from '@/components/analytics/GoogleAnalytics';
import { prisma } from './prisma';

export class CRMIntegration {
  private telegramCRM: any;

  constructor() {
    this.telegramCRM = createTelegramCRM();
  }

  // Notify when new order is created
  async notifyNewOrder(orderData: {
    orderId: string;
    orderNumber?: string;
    orderType?: 'PRODUCT' | 'SIGN_PHOTO';
    customerEmail: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      sku: string;
    }>;
    total: number;
    paymentMethod: string;
    shippingAddress: {
      name: string;
      address1: string;
      city: string;
      country: string;
      postalCode: string;
    };
    notes?: string;
  }) {
    if (!this.telegramCRM) return;

    try {
      // Create customer object
      const customer: Customer = {
        id: orderData.customerEmail,
        email: orderData.customerEmail,
        name: orderData.customerName,
        phone: orderData.customerPhone,
        orders: [],
        total_spent: orderData.total,
        created_at: new Date(),
        tags: [],
        notes: [],
        status: 'active'
      };

      // Create order object
      const order: Order = {
        id: orderData.orderId,
        order_number: orderData.orderNumber,
        order_type: orderData.orderType || 'PRODUCT',
        customer_id: orderData.customerEmail,
        items: orderData.items.map(item => ({
          product_id: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: orderData.total,
        status: 'pending',
        payment_method: orderData.paymentMethod,
        payment_status: 'pending',
        shipping_address: {
          name: orderData.shippingAddress.name,
          address1: orderData.shippingAddress.address1,
          city: orderData.shippingAddress.city,
          country: orderData.shippingAddress.country,
          postal_code: orderData.shippingAddress.postalCode
        },
        created_at: new Date(),
        updated_at: new Date(),
        notes: orderData.notes ? [{ 
          text: orderData.notes, 
          created_at: new Date() 
        }] : []
      };

      // Send notification to Telegram
      await this.telegramCRM.notifyNewOrder(order, customer);

      // Track in analytics
      analytics.event('crm_order_notification', {
        order_id: orderData.orderId,
        total: orderData.total,
        event_category: 'CRM'
      });

    } catch (error) {
      console.error('Failed to notify new order:', error);
    }
  }

  // Notify when order status changes
  async notifyOrderStatusUpdate(orderId: string, oldStatus: string, newStatus: string, trackingNumber?: string) {
    if (!this.telegramCRM) return;

    try {
      const order: Partial<Order> = {
        id: orderId,
        status: newStatus as any,
        tracking_number: trackingNumber,
        updated_at: new Date()
      };

      await this.telegramCRM.notifyOrderStatusUpdate(order, oldStatus, newStatus);

      // Track in analytics
      analytics.event('crm_status_update', {
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        event_category: 'CRM'
      });

    } catch (error) {
      console.error('Failed to notify status update:', error);
    }
  }

  // Send daily analytics
  async sendDailyAnalytics() {
    if (!this.telegramCRM) return;

    try {
      // Fetch real data from database
      const analyticsData = await this.getRealDailyData();

      await this.telegramCRM.sendDailyReport(analyticsData);

      // Track in analytics
      analytics.event('crm_daily_report', {
        orders: analyticsData.orders_today,
        revenue: analyticsData.revenue_today,
        event_category: 'CRM'
      });

    } catch (error) {
      console.error('Failed to send daily analytics:', error);
    }
  }

  // Fetch real daily data from database
  async getRealDailyData() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's orders
      const ordersToday = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          items: {
            include: {
              sku: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });

      // Calculate revenue today (only completed/confirmed orders)
      const revenueToday = ordersToday
        .filter(order => ['COMPLETED', 'CONFIRMED'].includes(order.paymentStatus))
        .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

      // Get new customers today
      const newCustomersToday = await prisma.order.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          userId: {
            not: null
          }
        },
        _count: {
          userId: true
        }
      });

      // Get pending orders
      const pendingOrders = await prisma.order.count({
        where: {
          status: 'PENDING'
        }
      });

      // Get top products (best-selling today)
      const topProducts = [];
      const productSales = new Map();

      ordersToday.forEach(order => {
        order.items.forEach(item => {
          const productName = item.sku?.product?.name || 'Unknown Product';
          const current = productSales.get(productName) || 0;
          productSales.set(productName, current + item.quantity);
        });
      });

      // Convert to array and sort
      for (const [name, sales] of productSales.entries()) {
        topProducts.push({ name, sales });
      }
      topProducts.sort((a, b) => b.sales - a.sales);

      return {
        orders_today: ordersToday.length,
        revenue_today: Math.round(revenueToday * 100) / 100,
        new_customers: newCustomersToday.length,
        pending_orders: pendingOrders,
        top_products: topProducts.slice(0, 3) // Top 3 products
      };
    } catch (error) {
      console.error('Failed to fetch real daily data:', error);
      // Fallback to basic data if database fails
      return {
        orders_today: 0,
        revenue_today: 0,
        new_customers: 0,
        pending_orders: 0,
        top_products: []
      };
    }
  }

  // Schedule daily reports
  scheduleDailyReports() {
    // Send report every day at 9 AM
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    
    if (next9AM <= now) {
      next9AM.setDate(next9AM.getDate() + 1);
    }
    
    const msUntil9AM = next9AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendDailyAnalytics();
      
      // Schedule for next day
      setInterval(() => {
        this.sendDailyAnalytics();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, msUntil9AM);
  }

  // Low stock alerts
  async checkInventoryLevels(products: Array<{name: string, stock: number, threshold: number}>) {
    if (!this.telegramCRM) return;

    const lowStockProducts = products.filter(p => p.stock <= p.threshold);
    
    if (lowStockProducts.length > 0) {
      await this.telegramCRM.notifyLowStock(lowStockProducts);
    }
  }
}

// Global CRM instance
export const globalCRM = new CRMIntegration();

// Webhook setup helper
export async function setupTelegramWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/telegram-webhook`;
  
  if (!botToken) {
    console.error('Telegram bot token not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    });

    const result = await response.json();
    console.log('Webhook setup result:', result);
    return result.ok;

  } catch (error) {
    console.error('Failed to setup webhook:', error);
    return false;
  }
}

// Initialize CRM on server start
if (typeof window === 'undefined') {
  globalCRM.scheduleDailyReports();
}