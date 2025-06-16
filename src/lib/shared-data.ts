// Общие данные для сайта и админ API
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  brand: string
  price: number
  stock: number
  reservedStock?: number // Зарезервированные остатки
  availableStock?: number // Доступные остатки (stock - reservedStock)
  weight?: number // Вес в килограммах для расчета доставки
  category: {
    name: string
    slug: string
  }
  images: Array<{
    url: string
    alt: string
    isPrimary: boolean
  }>
  video?: {
    url: string
    thumbnail?: string
    title?: string
  }
  status?: string
  sizes?: string[]
  colors?: string[]
  averageRating?: number
  createdAt?: string
  updatedAt?: string
}

// Единый источник данных для сайта и админки
// Используем global для сохранения состояния в development режиме
const globalForProducts = globalThis as unknown as {
  sharedProducts: Product[] | undefined
}

export const sharedProducts: Product[] = globalForProducts.sharedProducts ?? []
globalForProducts.sharedProducts = sharedProducts

export const categories = [
  { id: 'cat-shoes', name: 'Shoes', slug: 'shoes', emoji: '👠' },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', emoji: '💍' },
  { id: 'cat-hats', name: 'Hats', slug: 'hats', emoji: '🎩' },
  { id: 'cat-exvicpmour', name: 'EXVICPMOUR', slug: 'exvicpmour', emoji: '✨' },
  { id: 'cat-bags', name: 'Bags', slug: 'bags', emoji: '👜' },
  { id: 'cat-clothing', name: 'Clothing', slug: 'clothing', emoji: '👕' }
]

// Функция для добавления новой категории
export function addCategory(name: string, emoji?: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const id = `cat-${slug}`
  
  // Проверяем, что категория не существует
  const exists = categories.find(cat => cat.slug === slug)
  if (exists) {
    return exists
  }
  
  const newCategory = { 
    id, 
    name, 
    slug, 
    emoji: emoji || '📦' // Дефолтный эмодзи если не указан
  }
  categories.push(newCategory)
  return newCategory
}

// Заказы
export interface Order {
  id: string
  customerName: string
  customerEmail: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  shippingAddress: {
    street: string
    city: string
    country: string
    postalCode?: string
  }
  createdAt: string
  updatedAt: string
  paymentStatus?: string
  trackingNumber?: string
}

// Используем global для заказов тоже
const globalForOrders = globalThis as unknown as {
  sharedOrders: Order[] | undefined
}

export const sharedOrders: Order[] = globalForOrders.sharedOrders ?? []
globalForOrders.sharedOrders = sharedOrders

// Функции для работы с заказами
export function addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  const newOrder: Order = {
    ...order,
    id: `ORD-${String(sharedOrders.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  sharedOrders.push(newOrder)
  return newOrder
}

export function updateOrder(id: string, updates: Partial<Order>) {
  const index = sharedOrders.findIndex(o => o.id === id)
  if (index !== -1) {
    sharedOrders[index] = {
      ...sharedOrders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return sharedOrders[index]
  }
  return null
}

export function getOrders(filters?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  let filtered = [...sharedOrders]
  
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter(o => o.status === filters.status)
  }
  
  if (filters?.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(o => 
      o.id.toLowerCase().includes(search) ||
      o.customerEmail.toLowerCase().includes(search) ||
      o.customerName.toLowerCase().includes(search)
    )
  }
  
  // Сортировка по дате создания (новые первыми)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  const total = filtered.length
  
  if (filters?.limit) {
    const offset = filters.offset || 0
    filtered = filtered.slice(offset, offset + filters.limit)
  }
  
  return {
    orders: filtered,
    total
  }
}

// Функции для работы с данными
export function addProduct(product: Omit<Product, 'id' | 'slug' | 'createdAt' | 'updatedAt'>) {
  // Проверяем и исправляем URL изображений
  const validImages = product.images.map(img => ({
    ...img,
    url: img.url.startsWith('http') || img.url.startsWith('/') ? img.url : '/assets/images/placeholder.jpg'
  }))

  const newProduct: Product = {
    ...product,
    images: validImages.length > 0 ? validImages : [{ url: '/assets/images/placeholder.jpg', alt: product.name, isPrimary: true }],
    id: `prod-${Date.now()}`,
    slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  sharedProducts.push(newProduct)
  return newProduct
}

export function updateProduct(id: string, updates: Partial<Product>) {
  const index = sharedProducts.findIndex(p => p.id === id)
  if (index !== -1) {
    sharedProducts[index] = {
      ...sharedProducts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return sharedProducts[index]
  }
  return null
}

export function deleteProduct(id: string) {
  const index = sharedProducts.findIndex(p => p.id === id)
  if (index !== -1) {
    return sharedProducts.splice(index, 1)[0]
  }
  return null
}

export function getProducts(filters?: {
  category?: string
  search?: string
  status?: string
  limit?: number
  offset?: number
}) {
  let filtered = [...sharedProducts]
  
  if (filters?.category && filters.category !== 'all') {
    filtered = filtered.filter(p => p.category.slug === filters.category)
  }
  
  if (filters?.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search)
    )
  }
  
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter(p => p.status === filters.status)
  }
  
  const total = filtered.length
  
  if (filters?.limit) {
    const offset = filters.offset || 0
    filtered = filtered.slice(offset, offset + filters.limit)
  }
  
  return {
    products: filtered,
    total,
    hasMore: filters?.limit ? (filters.offset || 0) + filters.limit < total : false
  }
}

// Функции для работы с резервированием
export function updateProductStock(id: string, stock: number, reservedStock?: number) {
  const product = updateProduct(id, { 
    stock, 
    reservedStock: reservedStock ?? 0,
    availableStock: stock - (reservedStock ?? 0)
  })
  return product
}

export function reserveProductStock(id: string, quantity: number) {
  const product = sharedProducts.find(p => p.id === id)
  if (!product) {
    return { success: false, error: 'Product not found' }
  }

  const currentReserved = product.reservedStock ?? 0
  const availableStock = product.stock - currentReserved

  if (availableStock < quantity) {
    return { 
      success: false, 
      error: 'Insufficient stock',
      available: availableStock,
      requested: quantity
    }
  }

  const updatedProduct = updateProduct(id, {
    reservedStock: currentReserved + quantity,
    availableStock: product.stock - (currentReserved + quantity)
  })

  return { success: true, product: updatedProduct }
}

export function releaseProductReservation(id: string, quantity: number) {
  const product = sharedProducts.find(p => p.id === id)
  if (!product) {
    return { success: false, error: 'Product not found' }
  }

  const currentReserved = product.reservedStock ?? 0
  const newReserved = Math.max(0, currentReserved - quantity)

  const updatedProduct = updateProduct(id, {
    reservedStock: newReserved,
    availableStock: product.stock - newReserved
  })

  return { success: true, product: updatedProduct }
}

export function confirmProductReservation(id: string, quantity: number) {
  const product = sharedProducts.find(p => p.id === id)
  if (!product) {
    return { success: false, error: 'Product not found' }
  }

  const currentReserved = product.reservedStock ?? 0
  const newStock = Math.max(0, product.stock - quantity)
  const newReserved = Math.max(0, currentReserved - quantity)

  const updatedProduct = updateProduct(id, {
    stock: newStock,
    reservedStock: newReserved,
    availableStock: newStock - newReserved
  })

  return { success: true, product: updatedProduct }
}

// Синхронизация с базой данных
export async function syncWithDatabase() {
  try {
    // Динамический импорт чтобы избежать циклических зависимостей
    const { prisma } = await import('@/lib/prisma')
    
    // Получить все продукты с их SKU и резервированием
    const dbProducts = await prisma.product.findMany({
      include: {
        skus: {
          select: {
            stock: true,
            reservedStock: true
          }
        },
        images: {
          where: { isPrimary: true },
          take: 1
        }
      }
    })

    // Синхронизировать данные
    for (const dbProduct of dbProducts) {
      const totalStock = dbProduct.skus.reduce((sum, sku) => sum + sku.stock, 0)
      const totalReserved = dbProduct.skus.reduce((sum, sku) => sum + sku.reservedStock, 0)
      
      const existingProduct = sharedProducts.find(p => p.name === dbProduct.name)
      
      if (existingProduct) {
        updateProduct(existingProduct.id, {
          stock: totalStock,
          reservedStock: totalReserved,
          availableStock: totalStock - totalReserved
        })
      }
    }

    console.log('✅ Shared-data synchronized with database', {
      syncedProducts: dbProducts.length,
      syncedAt: new Date().toISOString()
    })

    return { success: true, syncedProducts: dbProducts.length }
    
  } catch (error) {
    console.error('❌ Failed to sync shared-data with database:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}