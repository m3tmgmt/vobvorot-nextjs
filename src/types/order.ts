export interface OrderItem {
  id: string
  quantity: number
  price: number
  sku: {
    id: string
    size?: string
    color?: string
    product: {
      id: string
      name: string
      slug: string
      images: { url: string; alt?: string }[]
    }
  }
}

export interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  total: number
  currency: string
  createdAt: string
  updatedAt: string
  shippingName: string
  shippingEmail: string
  shippingPhone?: string
  shippingAddress: string
  shippingCity: string
  shippingCountry: string
  shippingZip: string
  subtotal: number
  shippingCost: number
  paymentMethod?: string
  paymentId?: string
  items: OrderItem[]
}

export interface OrderFilters {
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface OrderResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: Record<string, number>
  filters: {
    status: string | null
    sortBy: string
    sortOrder: string
  }
}

export interface TrackingEvent {
  id: string
  status: string
  description: string
  location?: string
  timestamp: string
  icon: string
}

export interface TrackingInfo {
  orderId: string
  orderNumber: string
  status: string
  trackingNumber: string
  estimatedDelivery: string
  currentStatus: {
    status: string
    description: string
    timestamp: string
    icon: string
  }
  events: TrackingEvent[]
  shippingInfo: {
    carrier: string
    method: string
    address: {
      name: string
      line1: string
      city: string
      country: string
      zipCode: string
    }
  }
}

export interface OrderStatus {
  value: string
  label: string
  color: string
}