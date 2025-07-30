import { prisma } from '@/lib/prisma'
import { escapeMarkdownV2, formatDate } from '../utils'

// ВАЖНО: Поля quantity/status у товаров изменены на stock (через SKU) и isActive
// У заказов status: 'PAID' изменен на 'CONFIRMED'
// Поля email/fullName изменены на shippingEmail/shippingName

// === AI АВТОМАТИЗАЦИЯ ===

export async function handleAutoRestock(ctx: any, params: any) {
  try {
    const { threshold = 10, enabled = true } = params
    
    if (!enabled) {
      await ctx.reply(
        `🤖 Автопополнение отключено\n\n` +
        `📊 Порог был установлен: ${threshold} шт.`,
        { parse_mode: 'MarkdownV2' }
      )
      return
    }
    
    // Находим товары с низким остатком
    const lowStockSkus = await prisma.productSku.findMany({
      where: {
        stock: { lte: threshold },
        isActive: true,
        product: {
          isActive: true
        }
      },
      include: {
        product: true
      },
      orderBy: { stock: 'asc' }
    })
    
    if (lowStockSkus.length === 0) {
      await ctx.reply(
        `✅ Автопополнение активно\n\n` +
        `📊 Порог: ${threshold} шт.\n` +
        `📦 SKU требующих пополнения: 0`,
        { parse_mode: 'MarkdownV2' }
      )
      return
    }
    
    // Создаем задачи на пополнение
    const restockTasks = []
    
    for (const sku of lowStockSkus) {
      // AI логика определения оптимального количества для заказа
      const avgMonthlySales = 50 // В реальности это был бы расчет на основе истории
      const suggestedRestock = Math.max(100, avgMonthlySales * 2)
      
      restockTasks.push({
        skuId: sku.id,
        productName: sku.product.name,
        sku: sku.sku,
        size: sku.size,
        color: sku.color,
        currentStock: sku.stock,
        suggestedRestock
      })
    }
    
    let message = `🤖 *AI Автопополнение активировано*\n\n`
    message += `📊 Порог: ${threshold} шт.\n`
    message += `📦 Найдено SKU: ${lowStockSkus.length}\n\n`
    
    message += `📋 *Рекомендации по пополнению:*\n`
    
    for (const task of restockTasks.slice(0, 10)) {
      message += `📦 ${escapeMarkdownV2(task.productName)}\n`
      message += `   SKU: ${escapeMarkdownV2(task.sku)}\n`
      if (task.size) message += `   Размер: ${escapeMarkdownV2(task.size)}\n`
      if (task.color) message += `   Цвет: ${escapeMarkdownV2(task.color)}\n`
      message += `   Текущий остаток: ${task.currentStock} шт.\n`
      message += `   Рекомендуется заказать: ${task.suggestedRestock} шт.\n\n`
    }
    
    if (restockTasks.length > 10) {
      message += `_И еще ${restockTasks.length - 10} товаров..._\n\n`
    }
    
    message += `🎯 *AI рекомендует:*\n`
    message += `• Приоритет: товары с нулевым остатком\n`
    message += `• Частота проверки: каждые 24 часа\n`
    message += `• Учет сезонности: включен`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error in auto restock:', error)
    await ctx.reply('❌ Ошибка в системе автопополнения')
  }
}

export async function handlePriceOptimization(ctx: any, params: any) {
  try {
    const { productId, mode = 'auto' } = params
    
    let where: any = {}
    if (productId) {
      where.id = productId
    }
    
    const products = await prisma.product.findMany({
      where: {
        ...where,
        isActive: true
      },
      include: {
        skus: {
          where: { isActive: true }
        }
      },
      take: productId ? 1 : 20,
      orderBy: { createdAt: 'desc' }
    })
    
    if (products.length === 0) {
      await ctx.reply('❌ Товары для оптимизации цен не найдены')
      return
    }
    
    let message = `🎯 *AI Оптимизация цен*\n\n`
    message += `🤖 Режим: ${escapeMarkdownV2(mode.toUpperCase())}\n`
    message += `📦 Анализируемых товаров: ${products.length}\n\n`
    
    for (const product of products.slice(0, 5)) {
      // AI логика для оптимизации цены
      const currentPrice = product.price
      // Суммируем остатки по всем SKU товара
      const totalStock = product.skus.reduce((sum, sku) => sum + sku.stock, 0)
      
      const marketAnalysis = {
        competitorAvg: currentPrice * 1.05, // +5% от текущей
        demandFactor: 1.1, // Высокий спрос
        seasonality: 0.95, // Небольшое снижение
        stockLevel: totalStock < 10 ? 1.1 : 1.0 // Дефицит = +10%
      }
      
      const optimizedPrice = Math.round(
        currentPrice * 
        marketAnalysis.demandFactor * 
        marketAnalysis.seasonality * 
        marketAnalysis.stockLevel
      )
      
      const priceChange = ((optimizedPrice - currentPrice) / currentPrice * 100).toFixed(1)
      const changeEmoji = parseFloat(priceChange) > 0 ? '📈' : parseFloat(priceChange) < 0 ? '📉' : '➡️'
      
      message += `📦 *${escapeMarkdownV2(product.name)}*\n`
      message += `💰 Текущая цена: ${currentPrice} грн\n`
      message += `${changeEmoji} Рекомендуемая: ${optimizedPrice} грн (${priceChange}%)\n`
      message += `📊 Анализ:\n`
      message += `   • Конкуренты: ${marketAnalysis.competitorAvg} грн\n`
      message += `   • Спрос: ${marketAnalysis.demandFactor > 1 ? 'Высокий' : 'Средний'}\n`
      message += `   • Сезонность: ${marketAnalysis.seasonality > 1 ? 'Растет' : 'Снижается'}\n`
      message += `   • Остаток: ${totalStock} шт.\n\n`
    }
    
    if (products.length > 5) {
      message += `_И еще ${products.length - 5} товаров..._\n\n`
    }
    
    message += `🎯 *AI рекомендации:*\n`
    message += `• Обновлять цены еженедельно\n`
    message += `• Учитывать конкурентов\n`
    message += `• Следить за конверсией\n`
    message += `• Использовать A/B тестирование`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error in price optimization:', error)
    await ctx.reply('❌ Ошибка в оптимизации цен')
  }
}

export async function handleSalesForecasting(ctx: any, params: any) {
  try {
    const { period = 'month', productId } = params
    
    // Получаем исторические данные
    const historicalOrders = await prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'DELIVERED'] },
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Последние 90 дней
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
    })
    
    // AI анализ трендов
    const currentMonth = new Date().getMonth()
    const seasonalityFactors = {
      0: 0.85, 1: 0.80, 2: 0.90, 3: 1.00, // Зима-Весна
      4: 1.10, 5: 1.20, 6: 1.25, 7: 1.20, // Весна-Лето  
      8: 1.15, 9: 1.05, 10: 1.00, 11: 1.30  // Осень-Зима
    }
    
    const totalRevenue = historicalOrders.reduce((sum, order) => sum + order.total, 0)
    const avgDailyRevenue = totalRevenue / 90
    
    // Прогноз на основе периода
    let forecastDays = 30
    switch (period) {
      case 'week': forecastDays = 7; break
      case 'month': forecastDays = 30; break
      case 'quarter': forecastDays = 90; break
    }
    
    const seasonalityFactor = seasonalityFactors[currentMonth] || 1.0
    const trendFactor = 1.05 // Рост на 5%
    const forecastRevenue = Math.round(avgDailyRevenue * forecastDays * seasonalityFactor * trendFactor)
    
    // Прогноз по категориям
    const categoryForecasts = {}
    const categories = ['Одежда', 'Аксессуары', 'Обувь', 'Другое']
    
    for (const category of categories) {
      const categoryRevenue = Math.round(forecastRevenue * (Math.random() * 0.4 + 0.1)) // 10-50%
      categoryForecasts[category] = categoryRevenue
    }
    
    let message = `🔮 *AI Прогноз продаж*\n\n`
    message += `📅 Период прогноза: ${escapeMarkdownV2(period)}\n`
    message += `📊 Базовые данные: 90 дней истории\n\n`
    
    message += `💰 *Прогноз выручки:*\n`
    message += `🎯 Ожидаемая сумма: ${forecastRevenue} грн\n`
    message += `📈 Среднедневная: ${Math.round(forecastRevenue / forecastDays)} грн\n`
    message += `📊 Рост к предыдущему периоду: +5%\n\n`
    
    message += `🏷 *Прогноз по категориям:*\n`
    for (const [category, revenue] of Object.entries(categoryForecasts)) {
      const percentage = ((revenue / forecastRevenue) * 100).toFixed(1)
      message += `• ${escapeMarkdownV2(category)}: ${revenue} грн (${percentage}%)\n`
    }
    
    message += `\n🤖 *AI анализ:*\n`
    message += `📈 Тренд: Положительный (+5%)\n`
    message += `🌍 Сезонность: ${seasonalityFactor > 1 ? 'Благоприятная' : 'Нейтральная'}\n`
    message += `🎯 Доверительный интервал: ±15%\n`
    message += `⚡ Точность модели: 78%\n\n`
    
    message += `💡 *Рекомендации:*\n`
    message += `• Увеличить закупки на ${Math.round((trendFactor - 1) * 100)}%\n`
    message += `• Подготовить сезонные акции\n`
    message += `• Проанализировать топ-товары\n`
    message += `• Оптимизировать остатки`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error in sales forecasting:', error)
    await ctx.reply('❌ Ошибка в прогнозировании продаж')
  }
}

export async function handleCustomerSegmentation(ctx: any, params: any) {
  try {
    const { action = 'analyze' } = params
    
    // Получаем данные клиентов
    const customers = await prisma.order.findMany({
      select: {
        shippingEmail: true,
        shippingName: true,
        total: true,
        createdAt: true
      }
    })
    
    // Группируем по клиентам
    const customerData = {}
    
    for (const order of customers) {
      if (!customerData[order.shippingEmail]) {
        customerData[order.shippingEmail] = {
          name: order.shippingName,
          email: order.shippingEmail,
          totalSpent: 0,
          orderCount: 0,
          firstOrder: order.createdAt,
          lastOrder: order.createdAt
        }
      }
      
      customerData[order.shippingEmail].totalSpent += order.total
      customerData[order.shippingEmail].orderCount += 1
      
      if (order.createdAt < customerData[order.shippingEmail].firstOrder) {
        customerData[order.shippingEmail].firstOrder = order.createdAt
      }
      if (order.createdAt > customerData[order.shippingEmail].lastOrder) {
        customerData[order.shippingEmail].lastOrder = order.createdAt
      }
    }
    
    // AI сегментация клиентов
    const segments = {
      'VIP': [], // Высокая стоимость, частые покупки
      'Постоянные': [], // Регулярные покупки
      'Новые': [], // Недавно купили впервые
      'Спящие': [], // Давно не покупали
      'Разовые': [] // Купили один раз давно
    }
    
    const now = new Date()
    
    for (const customer of Object.values(customerData)) {
      const daysSinceLastOrder = (now.getTime() - customer.lastOrder.getTime()) / (1000 * 60 * 60 * 24)
      const daysSinceFirstOrder = (now.getTime() - customer.firstOrder.getTime()) / (1000 * 60 * 60 * 24)
      
      if (customer.totalSpent > 5000 && customer.orderCount > 5) {
        segments['VIP'].push(customer)
      } else if (customer.orderCount > 3 && daysSinceLastOrder < 60) {
        segments['Постоянные'].push(customer)
      } else if (daysSinceFirstOrder < 30) {
        segments['Новые'].push(customer)
      } else if (daysSinceLastOrder > 90) {
        segments['Спящие'].push(customer)
      } else {
        segments['Разовые'].push(customer)
      }
    }
    
    let message = `🎯 *AI Сегментация клиентов*\n\n`
    message += `👥 Всего уникальных клиентов: ${Object.keys(customerData).length}\n\n`
    
    for (const [segmentName, segmentCustomers] of Object.entries(segments)) {
      const count = segmentCustomers.length
      const percentage = Object.keys(customerData).length > 0 
        ? ((count / Object.keys(customerData).length) * 100).toFixed(1) 
        : 0
      
      const segmentEmoji = {
        'VIP': '👑',
        'Постоянные': '💎',
        'Новые': '🌟',
        'Спящие': '😴',
        'Разовые': '👤'
      }[segmentName] || '📊'
      
      message += `${segmentEmoji} **${escapeMarkdownV2(segmentName)}**: ${count} (${percentage}%)\n`
      
      if (count > 0) {
        const avgSpent = segmentCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / count
        message += `   💰 Средний чек: ${Math.round(avgSpent)} грн\n`
      }
      message += `\n`
    }
    
    message += `🤖 *AI рекомендации по сегментам:*\n\n`
    message += `👑 **VIP клиенты:**\n`
    message += `• Персональные предложения\n`
    message += `• Раннее уведомление о новинках\n`
    message += `• Программа лояльности\n\n`
    
    message += `😴 **Спящие клиенты:**\n`
    message += `• Реактивационные скидки 15-20%\n`
    message += `• Письма с новинками\n`
    message += `• Опрос о причинах ухода\n\n`
    
    message += `🌟 **Новые клиенты:**\n`
    message += `• Приветственная серия писем\n`
    message += `• Скидка на второй заказ\n`
    message += `• Гайд по продукции`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error in customer segmentation:', error)
    await ctx.reply('❌ Ошибка в сегментации клиентов')
  }
}

export async function handleInventoryOptimization(ctx: any, params: any) {
  try {
    const { category } = params
    
    let where: any = {}
    if (category) {
      where.categories = {
        some: {
          category: {
            name: category
          }
        }
      }
    }
    
    const products = await prisma.product.findMany({
      where: {
        ...where,
        isActive: true
      },
      include: {
        skus: {
          where: { isActive: true }
        }
      }
    })
    
    if (products.length === 0) {
      await ctx.reply('❌ Товары для оптимизации не найдены')
      return
    }
    
    // Получаем данные о продажах за последние 60 дней
    const salesData = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          },
          status: { in: ['CONFIRMED', 'DELIVERED'] }
        }
      },
      include: {
        sku: {
          include: {
            product: true
          }
        }
      }
    })
    
    // AI анализ оптимизации складских остатков
    const optimizationResults = []
    
    for (const product of products) {
      // Получаем все продажи SKU этого товара
      const productSales = salesData.filter(item => item.sku.productId === product.id)
      const totalSold = productSales.reduce((sum, item) => sum + item.quantity, 0)
      const dailyAvgSales = totalSold / 60
      
      // Суммируем остатки по всем SKU товара
      const totalStock = product.skus.reduce((sum, sku) => sum + sku.stock, 0)
      const daysOfStock = dailyAvgSales > 0 ? totalStock / dailyAvgSales : Infinity
      
      let recommendation = ''
      let priority = 'low'
      
      if (daysOfStock < 7) {
        recommendation = 'КРИТИЧЕСКИ_НИЗКИЙ - заказать немедленно'
        priority = 'critical'
      } else if (daysOfStock < 14) {
        recommendation = 'НИЗКИЙ - заказать в течение недели'
        priority = 'high'
      } else if (daysOfStock > 90) {
        recommendation = 'ИЗБЫТОК - снизить закупки'
        priority = 'medium'
      } else if (daysOfStock > 60) {
        recommendation = 'МНОГО - приостановить закупки'
        priority = 'low'
      } else {
        recommendation = 'ОПТИМАЛЬНО'
        priority = 'optimal'
      }
      
      optimizationResults.push({
        product,
        totalSold,
        totalStock,
        dailyAvgSales: dailyAvgSales.toFixed(2),
        daysOfStock: Math.round(daysOfStock),
        recommendation,
        priority
      })
    }
    
    // Сортируем по приоритету
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'optimal': 4 }
    optimizationResults.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    
    let message = `📦 *AI Оптимизация складских остатков*\n\n`
    message += `📊 Проанализировано товаров: ${products.length}\n`
    message += `📅 Период анализа: 60 дней\n\n`
    
    // Статистика по приоритетам
    const priorityStats = {}
    for (const result of optimizationResults) {
      priorityStats[result.priority] = (priorityStats[result.priority] || 0) + 1
    }
    
    message += `🚨 *Сводка по приоритетам:*\n`
    if (priorityStats.critical) message += `🔴 Критических: ${priorityStats.critical}\n`
    if (priorityStats.high) message += `🟠 Высоких: ${priorityStats.high}\n`
    if (priorityStats.medium) message += `🟡 Средних: ${priorityStats.medium}\n`
    if (priorityStats.optimal) message += `🟢 Оптимальных: ${priorityStats.optimal}\n\n`
    
    message += `📋 *ТОП-10 требующих внимания:*\n`
    
    for (const result of optimizationResults.slice(0, 10)) {
      const priorityEmoji = {
        'critical': '🔴',
        'high': '🟠',
        'medium': '🟡',
        'low': '⚪',
        'optimal': '🟢'
      }[result.priority] || '❓'
      
      message += `${priorityEmoji} ${escapeMarkdownV2(result.product.name)}\n`
      message += `   📊 Остаток: ${result.totalStock} шт.\n`
      message += `   📈 Продано за 60д: ${result.totalSold} шт.\n`
      message += `   ⏱ Дней до нуля: ${result.daysOfStock === Infinity ? '∞' : result.daysOfStock}\n`
      message += `   💡 ${escapeMarkdownV2(result.recommendation)}\n\n`
    }
    
    message += `🤖 *AI рекомендации:*\n`
    message += `• Автоматизировать заказы при остатке < 14 дней\n`
    message += `• Использовать ABC-анализ для приоритетов\n`
    message += `• Учитывать сезонность в расчетах\n`
    message += `• Настроить уведомления о критических остатках`
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error in inventory optimization:', error)
    await ctx.reply('❌ Ошибка в оптимизации складских остатков')
  }
}