/**
 * Core product and category type definitions with comprehensive JSDoc documentation
 */

/**
 * Represents a product image with optimization metadata
 */
export interface ProductImage {
  /** Unique identifier for the image */
  id?: string
  /** Image URL (absolute or relative) */
  url: string
  /** Alt text for accessibility */
  alt?: string
  /** Whether this is the primary/featured image */
  isPrimary: boolean
  /** Image width in pixels */
  width?: number
  /** Image height in pixels */
  height?: number
  /** Display order for image gallery */
  order?: number
  /** Cloudinary public ID for manipulation */
  publicId?: string
}

/**
 * Represents a product variant/SKU (Stock Keeping Unit)
 */
export interface ProductSKU {
  /** Unique identifier for the SKU */
  id: string
  /** SKU code for inventory management */
  sku?: string
  /** Price in USD cents (to avoid floating point issues) */
  price: number
  /** Current stock quantity */
  stock: number
  /** Reserved stock quantity (for pending orders) */
  reservedStock?: number
  /** Available stock (stock - reservedStock) */
  availableStock?: number
  /** Product size (e.g., "S", "M", "L", "XL") */
  size?: string
  /** Product color */
  color?: string
  /** Product material */
  material?: string
  /** Weight in grams */
  weight?: number
  /** Product dimensions */
  dimensions?: {
    length: number
    width: number
    height: number
  }
  /** Whether this SKU is active */
  isActive?: boolean
  /** Cost price for margin calculations */
  costPrice?: number
}

/**
 * Product video/media content
 */
export interface ProductVideo {
  /** Video URL */
  url: string
  /** Video thumbnail URL */
  thumbnail?: string
  /** Video title/description */
  title?: string
  /** Video duration in seconds */
  duration?: number
  /** Video type (e.g., "product-demo", "unboxing", "review") */
  type?: string
}

/**
 * Product review/rating information
 */
export interface ProductReview {
  /** Unique review identifier */
  id: string
  /** User who left the review */
  userId: string
  /** Username for display */
  username: string
  /** Rating from 1-5 stars */
  rating: number
  /** Review comment */
  comment?: string
  /** When the review was created */
  createdAt: Date
  /** Whether the review is verified purchase */
  isVerified?: boolean
  /** Helpful votes count */
  helpfulVotes?: number
}

/**
 * Main product interface with all associated data
 */
export interface Product {
  /** Unique product identifier */
  id: string
  /** Product name/title */
  name: string
  /** URL-friendly slug for routing */
  slug: string
  /** Detailed product description (supports markdown) */
  description?: string
  /** Brand name */
  brand?: string
  /** Product images array */
  images: ProductImage[]
  /** Available product variants/SKUs */
  skus: ProductSKU[]
  /** Product category */
  category: ProductCategory
  /** Average rating calculated from reviews */
  averageRating?: number
  /** Total number of reviews */
  reviewCount?: number
  /** Product video content */
  video?: ProductVideo
  /** SEO meta title */
  metaTitle?: string
  /** SEO meta description */
  metaDescription?: string
  /** Product tags for filtering */
  tags?: string[]
  /** Whether the product is featured */
  isFeatured?: boolean
  /** Whether the product is active/published */
  isActive?: boolean
  /** When the product was created */
  createdAt?: Date
  /** When the product was last updated */
  updatedAt?: Date
  /** Product condition (new, used, refurbished) */
  condition?: 'new' | 'used' | 'refurbished'
  /** Shipping information */
  shipping?: {
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    freeShipping: boolean
    shippingClass?: string
  }
}

/**
 * Product category with hierarchy support
 */
export interface ProductCategory {
  /** Unique category identifier */
  id: string
  /** Category name */
  name: string
  /** URL-friendly slug */
  slug: string
  /** Category description */
  description?: string
  /** Parent category ID for hierarchy */
  parentId?: string
  /** Child categories */
  children?: ProductCategory[]
  /** Category image URL */
  image?: string
  /** Display order */
  order?: number
  /** Whether the category is active */
  isActive?: boolean
  /** SEO meta title */
  metaTitle?: string
  /** SEO meta description */
  metaDescription?: string
}

/**
 * Product search/filter parameters
 */
export interface ProductSearchParams {
  /** Search query string */
  query?: string
  /** Category slug to filter by */
  category?: string
  /** Minimum price filter */
  minPrice?: number
  /** Maximum price filter */
  maxPrice?: number
  /** Brand filter */
  brand?: string
  /** Size filter */
  size?: string
  /** Color filter */
  color?: string
  /** Tags to filter by */
  tags?: string[]
  /** Sort order */
  sortBy?: 'name' | 'price' | 'rating' | 'newest' | 'oldest'
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Pagination limit */
  limit?: number
  /** Pagination offset */
  offset?: number
  /** Only show products in stock */
  inStockOnly?: boolean
  /** Only show featured products */
  featuredOnly?: boolean
}

/**
 * Product list response with pagination
 */
export interface ProductListResponse {
  /** Array of products */
  products: Product[]
  /** Pagination information */
  pagination: {
    /** Total number of products */
    total: number
    /** Current limit */
    limit: number
    /** Current offset */
    offset: number
    /** Whether there are more products */
    hasMore: boolean
    /** Current page number */
    page?: number
    /** Total pages */
    totalPages?: number
  }
  /** Applied filters */
  filters?: ProductSearchParams
}

/**
 * Cart item interface
 */
export interface CartItem {
  /** Product ID */
  productId: string
  /** SKU ID */
  skuId: string
  /** Quantity in cart */
  quantity: number
  /** Product name for display */
  productName: string
  /** Unit price */
  price: number
  /** Product image URL */
  image?: string
  /** Selected size */
  size?: string
  /** Selected color */
  color?: string
  /** Maximum available stock */
  maxStock: number
  /** When item was added to cart */
  addedAt?: Date
}

/**
 * Wishlist item interface
 */
export interface WishlistItem {
  /** Product ID */
  productId: string
  /** Product data */
  product: Product
  /** When item was added to wishlist */
  addedAt: Date
}

/**
 * Type guards for runtime type checking
 */
export const isProduct = (obj: any): obj is Product => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.slug === 'string' &&
    Array.isArray(obj.images) &&
    Array.isArray(obj.skus) &&
    obj.category &&
    typeof obj.category.name === 'string'
}

export const isProductSKU = (obj: any): obj is ProductSKU => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.stock === 'number'
}

export const isCartItem = (obj: any): obj is CartItem => {
  return obj &&
    typeof obj.productId === 'string' &&
    typeof obj.skuId === 'string' &&
    typeof obj.quantity === 'number' &&
    typeof obj.price === 'number'
}