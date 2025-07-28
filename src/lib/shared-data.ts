// Общие данные для сайта и админ API
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  brand: string
  price: number
  stock: number
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

// Sync function for mock data from API
export async function syncMockDataToShared(products: any[]) {
  try {
    // Clear existing products
    sharedProducts.length = 0
    
    // Convert API products to shared data format
    const convertedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      brand: 'EXVICPMOUR',
      price: product.skus?.[0]?.price || 0,
      stock: product.skus?.[0]?.availableStock || 0,
      weight: 0.5,
      category: {
        name: product.category?.name || 'General',
        slug: product.category?.slug || 'general'
      },
      images: product.images || [{
        url: '/assets/images/placeholder.jpg',
        alt: product.name,
        isPrimary: true
      }],
      status: product.isActive ? 'active' : 'inactive',
      sizes: product.skus?.map((sku: any) => sku.size).filter(Boolean) || [],
      colors: product.skus?.map((sku: any) => sku.color).filter(Boolean) || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    // Add converted products to shared storage
    sharedProducts.push(...convertedProducts)
    
    console.log(`Synced ${convertedProducts.length} products to shared data`)
    return { success: true, count: convertedProducts.length }
  } catch (error) {
    console.error('Failed to sync mock data to shared:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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