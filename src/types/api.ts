/**
 * API-related type definitions for VobVorot store
 * Includes request/response types, error handling, and API state management
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean
  /** Response data (present on success) */
  data?: T
  /** Success message */
  message?: string
  /** Error information (present on failure) */
  error?: ApiError
}

/**
 * API error structure
 */
export interface ApiError {
  /** Error message */
  message: string
  /** Error code for programmatic handling */
  code?: string
  /** Additional error details */
  details?: any
  /** HTTP status code */
  status?: number
  /** Stack trace (development only) */
  stack?: string
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  /** Number of items per page */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Page number (alternative to offset) */
  page?: number
}

/**
 * Sorting parameters
 */
export interface SortParams {
  /** Field to sort by */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Generic list response with pagination
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[]
  /** Pagination metadata */
  pagination: {
    total: number
    limit: number
    offset: number
    page?: number
    totalPages?: number
    hasMore: boolean
    hasPrevious?: boolean
  }
}

/**
 * API request state for loading management
 */
export interface ApiRequestState {
  /** Whether request is in progress */
  loading: boolean
  /** Error if request failed */
  error: ApiError | null
  /** When the request was last made */
  lastFetch?: Date
  /** Whether data has been loaded at least once */
  hasLoaded: boolean
}

/**
 * Authentication-related API types
 */
export namespace AuthAPI {
  /** User registration request */
  export interface RegisterRequest {
    email: string
    password: string
    name: string
    acceptTerms: boolean
  }

  /** User login request */
  export interface LoginRequest {
    email: string
    password: string
    rememberMe?: boolean
  }

  /** Password reset request */
  export interface ResetPasswordRequest {
    token: string
    password: string
  }

  /** User profile response */
  export interface UserProfile {
    id: string
    email: string
    name: string
    avatar?: string
    role: 'user' | 'admin' | 'moderator'
    isEmailVerified: boolean
    createdAt: Date
    lastLoginAt?: Date
  }

  /** Authentication token response */
  export interface TokenResponse {
    accessToken: string
    refreshToken: string
    expiresIn: number
    user: UserProfile
  }
}

/**
 * Product-related API types
 */
export namespace ProductAPI {
  /** Product search request */
  export interface SearchRequest extends PaginationParams, SortParams {
    query?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    brand?: string
    tags?: string[]
    inStockOnly?: boolean
  }

  /** Product creation request */
  export interface CreateRequest {
    name: string
    description?: string
    brand?: string
    categoryId: string
    images: Array<{
      url: string
      alt?: string
      isPrimary?: boolean
    }>
    skus: Array<{
      sku?: string
      size?: string
      color?: string
      price: number
      stock: number
    }>
    tags?: string[]
    metaTitle?: string
    metaDescription?: string
  }

  /** Product update request */
  export interface UpdateRequest extends Partial<CreateRequest> {
    id: string
  }
}

/**
 * Order-related API types
 */
export namespace OrderAPI {
  /** Shipping address */
  export interface ShippingAddress {
    firstName: string
    lastName: string
    company?: string
    address: string
    address2?: string
    city: string
    state?: string
    postalCode: string
    country: string
    phone?: string
  }

  /** Order item */
  export interface OrderItem {
    productId: string
    skuId: string
    quantity: number
    price: number
  }

  /** Order creation request */
  export interface CreateOrderRequest {
    items: OrderItem[]
    shippingAddress: ShippingAddress
    billingAddress?: ShippingAddress
    paymentMethod: string
    shippingMethod?: string
    couponCode?: string
    notes?: string
  }

  /** Order status */
  export type OrderStatus = 
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'

  /** Order response */
  export interface OrderResponse {
    id: string
    orderNumber: string
    status: OrderStatus
    items: Array<OrderItem & {
      productName: string
      productImage?: string
      size?: string
      color?: string
    }>
    subtotal: number
    tax: number
    shipping: number
    discount: number
    total: number
    shippingAddress: ShippingAddress
    billingAddress?: ShippingAddress
    paymentMethod: string
    trackingNumber?: string
    createdAt: Date
    updatedAt: Date
  }
}

/**
 * Cart-related API types
 */
export namespace CartAPI {
  /** Add item to cart request */
  export interface AddItemRequest {
    productId: string
    skuId: string
    quantity: number
  }

  /** Update cart item request */
  export interface UpdateItemRequest {
    skuId: string
    quantity: number
  }

  /** Cart response */
  export interface CartResponse {
    items: Array<{
      id: string
      productId: string
      skuId: string
      quantity: number
      productName: string
      productImage?: string
      price: number
      size?: string
      color?: string
      maxStock: number
    }>
    subtotal: number
    tax: number
    shipping: number
    total: number
    itemCount: number
  }
}

/**
 * File upload API types
 */
export namespace UploadAPI {
  /** File upload request */
  export interface UploadRequest {
    file: File
    category?: 'product' | 'avatar' | 'general'
    folder?: string
  }

  /** File upload response */
  export interface UploadResponse {
    url: string
    publicId: string
    width?: number
    height?: number
    format: string
    size: number
  }

  /** Multiple files upload response */
  export interface MultiUploadResponse {
    successful: UploadResponse[]
    failed: Array<{
      filename: string
      error: string
    }>
  }
}

/**
 * Analytics API types
 */
export namespace AnalyticsAPI {
  /** Page view tracking */
  export interface PageViewEvent {
    path: string
    title?: string
    referrer?: string
    userId?: string
    sessionId: string
  }

  /** Product view tracking */
  export interface ProductViewEvent {
    productId: string
    productName: string
    category: string
    price: number
    userId?: string
    sessionId: string
  }

  /** Purchase tracking */
  export interface PurchaseEvent {
    orderId: string
    value: number
    currency: string
    items: Array<{
      productId: string
      productName: string
      category: string
      quantity: number
      price: number
    }>
    userId?: string
  }
}

/**
 * Generic API client interface
 */
export interface ApiClient {
  /** GET request */
  get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>>
  
  /** POST request */
  post<T = any>(url: string, data?: any): Promise<ApiResponse<T>>
  
  /** PUT request */
  put<T = any>(url: string, data?: any): Promise<ApiResponse<T>>
  
  /** DELETE request */
  delete<T = any>(url: string): Promise<ApiResponse<T>>
  
  /** Upload file */
  upload<T = any>(url: string, file: File, data?: Record<string, any>): Promise<ApiResponse<T>>
}

/**
 * API hook return type for React hooks
 */
export interface ApiHookReturn<T> extends ApiRequestState {
  /** Data returned from API */
  data: T | null
  /** Function to manually trigger request */
  refetch: () => Promise<void>
  /** Function to update data optimistically */
  updateData: (updater: (data: T | null) => T | null) => void
}

/**
 * Mutation hook return type
 */
export interface MutationHookReturn<TData, TVariables> {
  /** Execute the mutation */
  mutate: (variables: TVariables) => Promise<TData>
  /** Current mutation state */
  state: ApiRequestState
  /** Reset mutation state */
  reset: () => void
}

/**
 * WebSocket message types for real-time updates
 */
export namespace WebSocketAPI {
  /** Base message structure */
  export interface BaseMessage {
    type: string
    timestamp: Date
  }

  /** Stock update message */
  export interface StockUpdate extends BaseMessage {
    type: 'stock_update'
    productId: string
    skuId: string
    newStock: number
  }

  /** Order status update */
  export interface OrderStatusUpdate extends BaseMessage {
    type: 'order_status'
    orderId: string
    status: OrderAPI.OrderStatus
    userId: string
  }

  /** Cart sync message */
  export interface CartSync extends BaseMessage {
    type: 'cart_sync'
    userId: string
    cart: CartAPI.CartResponse
  }

  /** System notification */
  export interface SystemNotification extends BaseMessage {
    type: 'notification'
    message: string
    level: 'info' | 'warning' | 'error'
    userId?: string
  }

  /** Union type for all message types */
  export type Message = 
    | StockUpdate 
    | OrderStatusUpdate 
    | CartSync 
    | SystemNotification
}