// Единые типы для продуктов
export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  images: { url: string; alt?: string; isPrimary: boolean }[]
  skus: { id: string; price: number; stock: number; size?: string; color?: string }[]
  category: { name: string; slug: string }
  averageRating?: number
  video?: {
    url: string
    thumbnail?: string
    title?: string
  }
}

export interface Category {
  id: string
  name: string
  slug: string
}