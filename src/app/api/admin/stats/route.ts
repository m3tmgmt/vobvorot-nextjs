import { NextRequest, NextResponse } from 'next/server'

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

// Общая статистика
async function getOverviewStats(startDate: Date, endDate: Date) {
  // Mock данные - в реальном проекте запросы к базе
  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalOrders: 156,
    totalRevenue: 12450.75,
    totalCustomers: 89,
    totalProducts: 45,
    
    // Изменения по сравнению с предыдущим периодом
    ordersChange: +15.3, // в процентах
    revenueChange: +23.7,
    customersChange: +8.2,
    productsChange: +5.0,
    
    // Статистика по статусам заказов
    ordersByStatus: {
      pending: 12,
      processing: 8,
      shipped: 15,
      completed: 120,
      cancelled: 1
    },
    
    // Топ товары
    topProducts: [
      { name: 'Vintage Canon AE-1', sales: 25, revenue: 2247.75 },
      { name: 'Custom Adidas Superstar', sales: 18, revenue: 2259.00 },
      { name: 'Vintage Fur Hat', sales: 15, revenue: 1019.85 }
    ],
    
    // Активность по дням недели
    salesByDay: [
      { day: 'Monday', orders: 22, revenue: 1580.25 },
      { day: 'Tuesday', orders: 18, revenue: 1245.50 },
      { day: 'Wednesday', orders: 25, revenue: 1890.75 },
      { day: 'Thursday', orders: 20, revenue: 1456.25 },
      { day: 'Friday', orders: 28, revenue: 2124.50 },
      { day: 'Saturday', orders: 35, revenue: 2589.25 },
      { day: 'Sunday', orders: 8, revenue: 564.25 }
    ]
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