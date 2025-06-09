import { NextRequest, NextResponse } from 'next/server'
import { sharedProducts, sharedOrders } from '@/lib/shared-data'

// GET - получить различные статистики магазина
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации админа
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y

    // Расчет дат для периода
    const now = new Date()
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    const days = periodDays[period as keyof typeof periodDays] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    switch (type) {
      case 'overview':
        return NextResponse.json(await getOverviewStats(startDate, now))
      
      case 'sales':
        return NextResponse.json(await getSalesStats(startDate, now))
      
      case 'products':
        return NextResponse.json(await getProductStats(startDate, now))
      
      case 'customers':
        return NextResponse.json(await getCustomerStats(startDate, now))
      
      case 'revenue':
        return NextResponse.json(await getRevenueStats(startDate, now))
      
      case 'inventory':
        return NextResponse.json(await getInventoryStats())
      
      default:
        return NextResponse.json({ error: 'Invalid stats type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Общая статистика на основе реальных данных
async function getOverviewStats(startDate: Date, endDate: Date) {
  const totalRevenue = sharedOrders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = sharedOrders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  
  // Уникальные клиенты
  const uniqueCustomers = new Set(sharedOrders.map(o => o.customerEmail)).size
  
  // Статистика по статусам заказов
  const ordersByStatus = {
    pending: sharedOrders.filter(o => o.status === 'pending').length,
    processing: sharedOrders.filter(o => o.status === 'processing').length,
    shipped: sharedOrders.filter(o => o.status === 'shipped').length,
    completed: sharedOrders.filter(o => o.status === 'completed').length,
    cancelled: sharedOrders.filter(o => o.status === 'cancelled').length
  }
  
  // Топ товары по количеству заказов
  const productSales = new Map()
  sharedOrders.forEach(order => {
    order.items.forEach(item => {
      const current = productSales.get(item.name) || { sales: 0, revenue: 0 }
      productSales.set(item.name, {
        sales: current.sales + item.quantity,
        revenue: current.revenue + (item.price * item.quantity)
      })
    })
  })
  
  const topProducts = Array.from(productSales.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)

  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCustomers: uniqueCustomers,
    totalProducts: sharedProducts.length,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    
    // Изменения по сравнению с предыдущим периодом (примерные)
    ordersChange: +15.3,
    revenueChange: +23.7,
    customersChange: +8.2,
    productsChange: +5.0,
    
    ordersByStatus,
    topProducts,
    
    // Активность по дням недели (примерные данные)
    salesByDay: [
      { day: 'Monday', orders: Math.floor(totalOrders * 0.12), revenue: Math.round(totalRevenue * 0.12) },
      { day: 'Tuesday', orders: Math.floor(totalOrders * 0.10), revenue: Math.round(totalRevenue * 0.10) },
      { day: 'Wednesday', orders: Math.floor(totalOrders * 0.15), revenue: Math.round(totalRevenue * 0.15) },
      { day: 'Thursday', orders: Math.floor(totalOrders * 0.13), revenue: Math.round(totalRevenue * 0.13) },
      { day: 'Friday', orders: Math.floor(totalOrders * 0.18), revenue: Math.round(totalRevenue * 0.18) },
      { day: 'Saturday', orders: Math.floor(totalOrders * 0.22), revenue: Math.round(totalRevenue * 0.22) },
      { day: 'Sunday', orders: Math.floor(totalOrders * 0.10), revenue: Math.round(totalRevenue * 0.10) }
    ],
    
    // Статистика по товарам
    activeProducts: sharedProducts.filter(p => p.status === 'active').length,
    lowStockCount: sharedProducts.filter(p => p.stock <= 5).length,
    outOfStockCount: sharedProducts.filter(p => p.stock === 0).length,
    newCustomers: Math.floor(uniqueCustomers * 0.3) // примерно 30% новых клиентов
  }
}

// Статистика продаж
async function getSalesStats(startDate: Date, endDate: Date) {
  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    
    // Общие метрики продаж
    totalSales: 156,
    totalRevenue: 12450.75,
    averageOrderValue: 79.81,
    conversionRate: 3.2, // в процентах
    
    // Тренды по дням
    dailySales: Array.from({ length: 30 }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      return {
        date: date.toISOString().split('T')[0],
        orders: Math.floor(Math.random() * 10) + 1,
        revenue: Math.floor(Math.random() * 800) + 200,
        customers: Math.floor(Math.random() * 8) + 1
      }
    }),
    
    // Продажи по категориям
    salesByCategory: [
      { category: 'Vintage Cameras', orders: 45, revenue: 3587.50, percentage: 28.8 },
      { category: 'Custom Shoes', orders: 38, revenue: 4769.00, percentage: 38.3 },
      { category: 'Accessories', orders: 32, revenue: 2178.25, percentage: 17.5 },
      { category: 'Vintage Fashion', orders: 25, revenue: 1456.75, percentage: 11.7 },
      { category: 'Designer Bags', orders: 16, revenue: 459.25, percentage: 3.7 }
    ],
    
    // Географическое распределение
    salesByCountry: [
      { country: 'United States', orders: 52, revenue: 4156.25, flag: '🇺🇸' },
      { country: 'Germany', orders: 28, revenue: 2245.50, flag: '🇩🇪' },
      { country: 'United Kingdom', orders: 22, revenue: 1789.75, flag: '🇬🇧' },
      { country: 'France', orders: 18, revenue: 1456.25, flag: '🇫🇷' },
      { country: 'Poland', orders: 15, revenue: 1203.50, flag: '🇵🇱' },
      { country: 'Other', orders: 21, revenue: 1599.50, flag: '🌍' }
    ]
  }
}

// Статистика товаров
async function getProductStats(startDate: Date, endDate: Date) {
  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    
    // Общие метрики товаров
    totalProducts: 45,
    activeProducts: 42,
    lowStockCount: 8,
    outOfStockProducts: 3,
    
    // Товары по производительности
    topSellingProducts: [
      {
        id: 'prod-001',
        name: 'Vintage Canon AE-1',
        sales: 25,
        revenue: 2247.75,
        stock: 3,
        views: 1250,
        conversionRate: 2.0
      },
      {
        id: 'prod-002',
        name: 'Custom Adidas Superstar',
        sales: 18,
        revenue: 2259.00,
        stock: 5,
        views: 980,
        conversionRate: 1.8
      },
      {
        id: 'prod-003',
        name: 'Vintage Fur Hat',
        sales: 15,
        revenue: 1019.85,
        stock: 2,
        views: 756,
        conversionRate: 2.0
      }
    ],
    
    // Товары требующие внимания
    lowStockProducts: [
      { id: 'prod-003', name: 'Vintage Fur Hat', stock: 2, lastSold: '2024-12-07' },
      { id: 'prod-007', name: 'Y2K Platform Boots', stock: 1, lastSold: '2024-12-06' },
      { id: 'prod-012', name: 'Custom Denim Jacket', stock: 3, lastSold: '2024-12-05' }
    ],
    
    // Новые товары
    recentlyAdded: [
      { id: 'prod-045', name: 'Holographic Handbag', addedDate: '2024-12-08', views: 45 },
      { id: 'prod-044', name: 'Cyber Goggles', addedDate: '2024-12-07', views: 78 },
      { id: 'prod-043', name: 'LED Necklace', addedDate: '2024-12-06', views: 123 }
    ],
    
    // Товары без продаж
    noSalesProducts: [
      { id: 'prod-040', name: 'Retro Sunglasses', daysSinceAdded: 15, views: 23 },
      { id: 'prod-038', name: 'Vintage Belt', daysSinceAdded: 12, views: 34 },
      { id: 'prod-035', name: 'Silver Chain', daysSinceAdded: 8, views: 67 }
    ]
  }
}

// Статистика клиентов
async function getCustomerStats(startDate: Date, endDate: Date) {
  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    
    // Общие метрики клиентов
    totalCustomers: 89,
    newCustomers: 23,
    returningCustomers: 66,
    customerRetentionRate: 74.2, // в процентах
    
    // Топ клиенты
    topCustomers: [
      {
        id: 'cust-001',
        name: 'Emma Thompson',
        email: 'emma@example.com',
        orders: 8,
        totalSpent: 654.75,
        lastOrder: '2024-12-07',
        country: '🇬🇧 UK'
      },
      {
        id: 'cust-002',
        name: 'Marco Silva',
        email: 'marco@example.com',
        orders: 6,
        totalSpent: 789.50,
        lastOrder: '2024-12-06',
        country: '🇵🇹 Portugal'
      },
      {
        id: 'cust-003',
        name: 'Anna Kowalski',
        email: 'anna@example.com',
        orders: 5,
        totalSpent: 567.25,
        lastOrder: '2024-12-08',
        country: '🇵🇱 Poland'
      }
    ],
    
    // Сегментация клиентов
    customerSegments: [
      { segment: 'VIP (>$500)', count: 12, percentage: 13.5, avgOrderValue: 125.50 },
      { segment: 'Regular ($100-$500)', count: 45, percentage: 50.6, avgOrderValue: 78.25 },
      { segment: 'New (<$100)', count: 32, percentage: 36.0, avgOrderValue: 45.75 }
    ],
    
    // География клиентов
    customersByCountry: [
      { country: 'United States', customers: 28, percentage: 31.5 },
      { country: 'Germany', customers: 15, percentage: 16.9 },
      { country: 'United Kingdom', customers: 12, percentage: 13.5 },
      { country: 'France', customers: 10, percentage: 11.2 },
      { country: 'Poland', customers: 8, percentage: 9.0 },
      { country: 'Other', customers: 16, percentage: 18.0 }
    ],
    
    // Возрастные группы (примерные данные)
    ageGroups: [
      { group: '18-24', count: 23, percentage: 25.8 },
      { group: '25-34', count: 35, percentage: 39.3 },
      { group: '35-44', count: 20, percentage: 22.5 },
      { group: '45+', count: 11, percentage: 12.4 }
    ]
  }
}

// Статистика доходов
async function getRevenueStats(startDate: Date, endDate: Date) {
  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    
    // Общие метрики доходов
    totalRevenue: 12450.75,
    netRevenue: 10963.16, // после комиссий и возвратов
    averageOrderValue: 79.81,
    totalOrders: 156,
    
    // Разбивка доходов
    revenueBreakdown: {
      productSales: 12450.75,
      shipping: 1876.50,
      taxes: 995.25,
      refunds: -325.75,
      fees: -1161.84 // комиссии платежных систем
    },
    
    // Доходы по методам оплаты
    revenueByPaymentMethod: [
      { method: 'Credit Card', amount: 8945.25, percentage: 71.9, orders: 112 },
      { method: 'PayPal', amount: 2456.75, percentage: 19.7, orders: 31 },
      { method: 'Bank Transfer', amount: 1048.75, percentage: 8.4, orders: 13 }
    ],
    
    // Прогноз на следующий период
    forecast: {
      expectedRevenue: 13567.50,
      expectedOrders: 170,
      growthRate: 8.9,
      confidence: 85
    },
    
    // Месячная динамика
    monthlyRevenue: [
      { month: 'Aug 2024', revenue: 8945.25, orders: 98 },
      { month: 'Sep 2024', revenue: 10256.75, orders: 126 },
      { month: 'Oct 2024', revenue: 11234.50, orders: 142 },
      { month: 'Nov 2024', revenue: 12450.75, orders: 156 }
    ]
  }
}

// Статистика складских остатков
async function getInventoryStats() {
  return {
    // Общие метрики склада
    totalProducts: 45,
    totalStock: 267,
    lowStockAlerts: 8,
    outOfStockCount: 3,
    averageStockLevel: 5.9,
    
    // Товары с низким остатком
    lowStockItems: [
      { id: 'prod-003', name: 'Vintage Fur Hat', stock: 2, threshold: 5, daysToStockout: 3 },
      { id: 'prod-007', name: 'Y2K Platform Boots', stock: 1, threshold: 5, daysToStockout: 1 },
      { id: 'prod-012', name: 'Custom Denim Jacket', stock: 3, threshold: 5, daysToStockout: 5 },
      { id: 'prod-018', name: 'Holographic Skirt', stock: 4, threshold: 8, daysToStockout: 7 }
    ],
    
    // Товары отсутствующие на складе
    outOfStockItems: [
      { id: 'prod-025', name: 'Cyber Gloves', lastSold: '2024-12-05', daysOutOfStock: 3 },
      { id: 'prod-031', name: 'LED Choker', lastSold: '2024-12-03', daysOutOfStock: 5 },
      { id: 'prod-037', name: 'Metallic Boots', lastSold: '2024-12-01', daysOutOfStock: 7 }
    ],
    
    // Рекомендации по пополнению
    restockRecommendations: [
      { 
        id: 'prod-003', 
        name: 'Vintage Fur Hat', 
        currentStock: 2, 
        recommendedOrder: 15,
        reason: 'High demand, low stock'
      },
      { 
        id: 'prod-025', 
        name: 'Cyber Gloves', 
        currentStock: 0, 
        recommendedOrder: 20,
        reason: 'Out of stock, regular sales'
      }
    ],
    
    // Движение товаров
    stockMovement: {
      lastWeek: {
        soldItems: 45,
        newArrivals: 12,
        returns: 2
      },
      thisMonth: {
        soldItems: 189,
        newArrivals: 28,
        returns: 5
      }
    }
  }
}