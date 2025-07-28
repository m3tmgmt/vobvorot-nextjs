// Telegram CRM System - Встроенная система управления клиентами

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  telegram_id?: string;
  orders: Order[];
  total_spent: number;
  created_at: Date;
  last_order_date?: Date;
  tags: string[];
  notes: string[];
  status: 'active' | 'inactive' | 'vip' | 'blocked';
}

export interface Order {
  id: string;
  order_number?: string;
  order_type?: 'PRODUCT' | 'SIGN_PHOTO';
  customer_id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  shipping_address: Address;
  created_at: Date;
  updated_at: Date;
  tracking_number?: string;
  notes: Array<{ text: string; created_at: Date }>;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface Address {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  country: string;
  postal_code: string;
  phone?: string;
}

export interface TelegramMessage {
  type: 'customer_info' | 'order_update' | 'new_order' | 'analytics' | 'task_reminder';
  title: string;
  content: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: Date;
}

// Telegram Bot Integration
class TelegramCRM {
  private botToken: string;
  private chatIds: string[];

  constructor(botToken: string, chatIds: string | string[]) {
    this.botToken = botToken;
    this.chatIds = Array.isArray(chatIds) ? chatIds : chatIds.split(',').map(id => id.trim());
  }

  // Send message to Telegram
  async sendMessage(message: string, options?: {
    parse_mode?: 'HTML' | 'Markdown';
    reply_markup?: any;
  }) {
    const results = [];
    
    for (const chatId of this.chatIds) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            ...options
          })
        });
        const result = await response.json();
        results.push(result);
      } catch (error) {
        console.error(`Failed to send Telegram message to ${chatId}:`, error);
        results.push(null);
      }
    }
    
    return results;
  }

  // Notify about new order
  async notifyNewOrder(order: Order, customer: Customer) {
    const orderTypeEmoji = order.order_type === 'SIGN_PHOTO' ? '✍️' : '🛍️';
    const orderTypeText = order.order_type === 'SIGN_PHOTO' ? 'SIGN PHOTO' : 'ТОВАРЫ';
    
    const message = `
🆕 <b>НОВЫЙ ЗАКАЗ ${order.order_number || order.id}</b>
${orderTypeEmoji} <b>Тип:</b> ${orderTypeText}

👤 <b>Клиент:</b> ${customer.name || customer.email}
📧 Email: ${customer.email}
📱 Телефон: ${customer.phone || 'Не указан'}

${orderTypeEmoji} <b>${order.order_type === 'SIGN_PHOTO' ? 'Заказ' : 'Товары'}:</b>
${order.items.map(item => 
  `• ${item.name} x${item.quantity} - $${item.price}`
).join('\n')}

${order.notes && order.notes.length > 0 ? `📝 <b>Заметки:</b> ${order.notes[0].text}\n` : ''}

💰 <b>Сумма:</b> $${order.total}
💳 <b>Оплата:</b> ${order.payment_method} (${order.payment_status})

📍 <b>${order.order_type === 'SIGN_PHOTO' ? 'Email доставки' : 'Адрес доставки'}:</b>
${order.order_type === 'SIGN_PHOTO' ? customer.email : `${order.shipping_address.name}
${order.shipping_address.address1}
${order.shipping_address.city}, ${order.shipping_address.country}`}

⏰ ${new Date(order.created_at).toLocaleString('ru-RU')}
    `;

    const keyboard = order.order_type === 'SIGN_PHOTO' ? {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `confirm_order_${order.id}` },
          { text: '📸 Загрузить фото', callback_data: `upload_photo_${order.id}` }
        ],
        [
          { text: '📧 Отправить клиенту', callback_data: `send_photo_${order.id}` },
          { text: '❌ Отменить', callback_data: `cancel_order_${order.id}` }
        ],
        [
          { text: '👤 Профиль клиента', callback_data: `customer_${customer.id}` }
        ]
      ]
    } : {
      inline_keyboard: [
        [
          { text: '✅ Принять в работу', callback_data: `accept_order_${order.id}` },
          { text: '❌ Отклонить', callback_data: `reject_order_${order.id}` }
        ],
        [
          { text: '👤 Профиль клиента', callback_data: `customer_${customer.id}` },
          { text: '🔄 Изменить статус', callback_data: `status_${order.id}` }
        ]
      ]
    };

    return this.sendMessage(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }

  // Daily analytics report
  async sendDailyReport(analytics: {
    orders_today: number;
    revenue_today: number;
    new_customers: number;
    pending_orders: number;
    top_products: Array<{name: string, sales: number}>;
  }) {
    const message = `
📊 <b>ЕЖЕДНЕВНЫЙ ОТЧЕТ</b>
📅 ${new Date().toLocaleDateString('ru-RU')}

📦 <b>Заказы сегодня:</b> ${analytics.orders_today}
💰 <b>Выручка:</b> $${analytics.revenue_today}
👥 <b>Новые клиенты:</b> ${analytics.new_customers}
⏳ <b>В обработке:</b> ${analytics.pending_orders}

🔥 <b>Топ товары:</b>
${analytics.top_products.map((product, index) => 
  `${index + 1}. ${product.name} (${product.sales} продаж)`
).join('\n')}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📈 Подробная аналитика', callback_data: 'detailed_analytics' },
          { text: '📋 Заказы на обработку', callback_data: 'pending_orders' }
        ]
      ]
    };

    return this.sendMessage(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }

  // Customer profile
  async showCustomerProfile(customer: Customer) {
    const message = `
👤 <b>ПРОФИЛЬ КЛИЕНТА</b>

<b>Основная информация:</b>
📧 Email: ${customer.email}
👤 Имя: ${customer.name || 'Не указано'}
📱 Телефон: ${customer.phone || 'Не указан'}
🏷️ Статус: ${customer.status}

<b>Статистика:</b>
🛍️ Заказов: ${customer.orders.length}
💰 Потрачено: $${customer.total_spent}
📅 Последний заказ: ${customer.last_order_date?.toLocaleDateString('ru-RU') || 'Нет заказов'}
📅 Регистрация: ${customer.created_at.toLocaleDateString('ru-RU')}

<b>Теги:</b> ${customer.tags.join(', ') || 'Нет тегов'}

<b>Заметки:</b>
${customer.notes.length > 0 ? customer.notes.join('\n') : 'Нет заметок'}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📝 Добавить заметку', callback_data: `add_note_${customer.id}` },
          { text: '🏷️ Управлять тегами', callback_data: `manage_tags_${customer.id}` }
        ],
        [
          { text: '📦 История заказов', callback_data: `orders_${customer.id}` },
          { text: '🎯 Изменить статус', callback_data: `customer_status_${customer.id}` }
        ]
      ]
    };

    return this.sendMessage(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }

  // Order status update
  async notifyOrderStatusUpdate(order: Order, oldStatus: string, newStatus: string) {
    const message = `
🔄 <b>ОБНОВЛЕНИЕ СТАТУСА ЗАКАЗА #${order.id}</b>

📊 ${oldStatus} → ${newStatus}
💰 Сумма: $${order.total}
📅 ${new Date().toLocaleString('ru-RU')}

${order.tracking_number ? `📦 Трек-номер: ${order.tracking_number}` : ''}
    `;

    return this.sendMessage(message, { parse_mode: 'HTML' });
  }

  // Inventory alerts
  async notifyLowStock(products: Array<{name: string, stock: number, threshold: number}>) {
    const message = `
⚠️ <b>ПРЕДУПРЕЖДЕНИЕ О ЗАПАСАХ</b>

Заканчиваются товары:
${products.map(product => 
  `• ${product.name}: ${product.stock} шт. (мин: ${product.threshold})`
).join('\n')}

🛒 Рекомендуется пополнить запасы
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Управление запасами', callback_data: 'manage_inventory' }]
      ]
    };

    return this.sendMessage(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }

  // Weekly analytics
  async sendWeeklyReport(analytics: {
    orders_week: number;
    revenue_week: number;
    avg_order_value: number;
    conversion_rate: number;
    top_traffic_sources: Array<{source: string, visits: number}>;
    customer_segments: {
      new: number;
      returning: number;
      vip: number;
    };
  }) {
    const message = `
📊 <b>ЕЖЕНЕДЕЛЬНЫЙ ОТЧЕТ</b>
📅 ${new Date().toLocaleDateString('ru-RU')}

<b>Продажи:</b>
📦 Заказов: ${analytics.orders_week}
💰 Выручка: $${analytics.revenue_week}
💳 Средний чек: $${analytics.avg_order_value}
📈 Конверсия: ${analytics.conversion_rate}%

<b>Трафик:</b>
${analytics.top_traffic_sources.map(source => 
  `• ${source.source}: ${source.visits} визитов`
).join('\n')}

<b>Клиенты:</b>
🆕 Новые: ${analytics.customer_segments.new}
🔄 Вернувшиеся: ${analytics.customer_segments.returning}
⭐ VIP: ${analytics.customer_segments.vip}
    `;

    return this.sendMessage(message, { parse_mode: 'HTML' });
  }
}

// Database operations for CRM
export class CRMDatabase {
  // Add these methods to your existing database or create new ones
  
  async getCustomer(email: string): Promise<Customer | null> {
    // Implement database query
    return null;
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    // Implement database insertion
    throw new Error('Not implemented');
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    // Implement database update
    throw new Error('Not implemented');
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    // Implement database query
    return [];
  }

  async getDailyAnalytics(date: Date) {
    // Implement analytics query
    return {
      orders_today: 0,
      revenue_today: 0,
      new_customers: 0,
      pending_orders: 0,
      top_products: []
    };
  }

  async getWeeklyAnalytics(startDate: Date, endDate: Date) {
    // Implement analytics query
    return {
      orders_week: 0,
      revenue_week: 0,
      avg_order_value: 0,
      conversion_rate: 0,
      top_traffic_sources: [],
      customer_segments: {
        new: 0,
        returning: 0,
        vip: 0
      }
    };
  }
}

// Initialize Telegram CRM
export function createTelegramCRM() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = process.env.TELEGRAM_OWNER_CHAT_ID;
  
  if (!botToken || !chatIds) {
    console.error('Telegram bot credentials not configured');
    return null;
  }
  
  return new TelegramCRM(botToken, chatIds);
}

export { TelegramCRM };