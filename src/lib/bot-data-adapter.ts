// Адаптационный слой для конвертации данных между реальной Prisma БД и структурой, которую ожидает бот
import { prisma } from '@/lib/prisma'

// === TYPES FOR BOT COMPATIBILITY ===

export interface BotOrder {
  id: string
  fullName: string
  email: string
  phone: string
  shippingAddress: string
  shippingCity: string
  shippingPostcode: string
  shippingCountry: string
  total: number
  subtotal: number
  shippingCost: number
  status: string
  createdAt: Date
  updatedAt: Date
  trackingNumber?: string
  notes?: string
  items: BotOrderItem[]
}

export interface BotOrderItem {
  id: string
  quantity: number
  price: number
  product: BotProduct
}

export interface BotProduct {
  id: string
  name: string
  slug: string
  description: string
  price: number
  quantity: number // stock
  category: string
  brand: string
  status: string
  images: BotProductImage[]
}

export interface BotProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
}

// === ORDER ADAPTERS ===

export async function getOrderForBot(orderId: string): Promise<BotOrder | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          sku: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!order) return null

  return {
    id: order.id,
    fullName: order.shippingName,
    email: order.shippingEmail,
    phone: order.shippingPhone || '',
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingPostcode: order.shippingZip,
    shippingCountry: order.shippingCountry,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    status: mapPrismaOrderStatusToBotStatus(order.status),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    trackingNumber: order.trackingNumber || undefined,
    notes: order.notes || undefined,
    items: order.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        id: item.sku.product.id,
        name: item.sku.product.name,
        slug: item.sku.product.slug,
        description: item.sku.product.description || '',
        price: Number(item.sku.price),
        quantity: item.sku.stock,
        category: item.sku.product.category.name,
        brand: item.sku.product.brand || '',
        status: item.sku.product.isActive ? 'ACTIVE' : 'INACTIVE',
        images: item.sku.product.images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt || '',
          isPrimary: img.isPrimary
        }))
      }
    }))
  }
}

export async function getOrdersForBot(filters?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ orders: BotOrder[], total: number }> {
  let where: any = {}

  // Фильтр по статусу
  if (filters?.status && filters.status !== 'all') {
    where.status = mapBotStatusToPrismaOrderStatus(filters.status)
  }

  // Поиск
  if (filters?.search) {
    where.OR = [
      { id: { contains: filters.search } },
      { shippingEmail: { contains: filters.search, mode: 'insensitive' } },
      { shippingName: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: {
                  include: {
                    images: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 10,
      skip: filters?.offset || 0
    }),
    prisma.order.count({ where })
  ])

  return {
    orders: orders.map(order => ({
      id: order.id,
      fullName: order.shippingName,
      email: order.shippingEmail,
      phone: order.shippingPhone || '',
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingPostcode: order.shippingZip,
      shippingCountry: order.shippingCountry,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      status: mapPrismaOrderStatusToBotStatus(order.status),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      trackingNumber: order.trackingNumber || undefined,
      notes: order.notes || undefined,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.sku.product.id,
          name: item.sku.product.name,
          slug: item.sku.product.slug,
          description: item.sku.product.description || '',
          price: Number(item.sku.price),
          quantity: item.sku.stock,
          category: item.sku.product.category.name,
          brand: item.sku.product.brand || '',
          status: item.sku.product.isActive ? 'ACTIVE' : 'INACTIVE',
          images: item.sku.product.images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt || '',
            isPrimary: img.isPrimary
          }))
        }
      }))
    })),
    total
  }
}

// === PRODUCT ADAPTERS ===

export async function getProductForBot(productId: string): Promise<BotProduct | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      skus: true,
      images: true,
      category: true
    }
  })

  if (!product) return null

  const firstSku = product.skus[0]

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: firstSku ? Number(firstSku.price) : 0,
    quantity: firstSku ? firstSku.stock : 0,
    category: product.category.name,
    brand: product.brand || '',
    status: product.isActive ? 'ACTIVE' : 'INACTIVE',
    images: product.images.map(img => ({
      id: img.id,
      url: img.url,
      alt: img.alt || '',
      isPrimary: img.isPrimary
    }))
  }
}

export async function getProductsForBot(filters?: {
  category?: string
  search?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ products: BotProduct[], total: number }> {
  let where: any = {}

  // Фильтр по активности
  if (filters?.status && filters.status !== 'all') {
    where.isActive = filters.status === 'ACTIVE'
  } else {
    where.isActive = true // По умолчанию показываем только активные
  }

  // Фильтр по категории
  if (filters?.category) {
    where.category = {
      name: { contains: filters.category, mode: 'insensitive' }
    }
  }

  // Поиск
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { brand: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        skus: {
          select: {
            price: true,
            stock: true
          }
        },
        images: true,
        category: true
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 20,
      skip: filters?.offset || 0
    }),
    prisma.product.count({ where })
  ])

  return {
    products: products.map(product => {
      const firstSku = product.skus[0]
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: firstSku ? Number(firstSku.price) : 0,
        quantity: firstSku ? firstSku.stock : 0,
        category: product.category.name,
        brand: product.brand || '',
        status: product.isActive ? 'ACTIVE' : 'INACTIVE',
        images: product.images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt || '',
          isPrimary: img.isPrimary
        }))
      }
    }),
    total
  }
}

// === STATUS MAPPING HELPERS ===

function mapPrismaOrderStatusToBotStatus(prismaStatus: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'CONFIRMED': 'processing',
    'PROCESSING': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'completed',
    'CANCELLED': 'cancelled',
    'REFUNDED': 'cancelled'
  }
  
  return statusMap[prismaStatus] || 'pending'
}

function mapBotStatusToPrismaOrderStatus(botStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'shipped': 'SHIPPED',
    'completed': 'DELIVERED',
    'cancelled': 'CANCELLED'
  }
  
  return statusMap[botStatus] || 'PENDING'
}

// === UPDATE HELPERS ===

export async function updateOrderStatusForBot(orderId: string, newStatus: string): Promise<boolean> {
  try {
    const prismaStatus = mapBotStatusToPrismaOrderStatus(newStatus)
    
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: prismaStatus as any,
        updatedAt: new Date()
      }
    })
    
    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    return false
  }
}

export async function updateProductStockForBot(productId: string, newStock: number): Promise<boolean> {
  try {
    // Обновляем stock в первом SKU товара
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { skus: true }
    })
    
    if (!product || !product.skus[0]) {
      return false
    }
    
    await prisma.productSku.update({
      where: { id: product.skus[0].id },
      data: { stock: newStock }
    })
    
    return true
  } catch (error) {
    console.error('Error updating product stock:', error)
    return false
  }
}

export async function updateProductPriceForBot(productId: string, newPrice: number): Promise<boolean> {
  try {
    // Обновляем price в первом SKU товара
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { skus: true }
    })
    
    if (!product || !product.skus[0]) {
      return false
    }
    
    await prisma.productSku.update({
      where: { id: product.skus[0].id },
      data: { price: newPrice }
    })
    
    return true
  } catch (error) {
    console.error('Error updating product price:', error)
    return false
  }
}