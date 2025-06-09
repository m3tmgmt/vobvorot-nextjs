import { z } from 'zod'
import { NextRequest } from 'next/server'

// Схемы валидации для продуктов
export const productSchema = z.object({
  name: z.string().min(1, 'Название продукта обязательно').max(200, 'Название слишком длинное'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Некорректный ID категории'),
  price: z.number().positive('Цена должна быть положительной'),
  stock: z.number().int().min(0, 'Количество не может быть отрицательным'),
  images: z.array(z.string().url('Некорректный URL изображения')).optional(),
  slug: z.string().optional(),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true)
})

export const updateProductSchema = productSchema.partial()

// Схемы валидации для категорий
export const categorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно').max(100, 'Название слишком длинное'),
  description: z.string().optional(),
  slug: z.string().optional(),
  parentId: z.string().uuid().optional(),
  active: z.boolean().optional().default(true)
})

export const updateCategorySchema = categorySchema.partial()

// Схемы валидации для заказов
export const orderItemSchema = z.object({
  productId: z.string().uuid('Некорректный ID продукта'),
  skuId: z.string().uuid('Некорректный ID SKU'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  price: z.number().positive('Цена должна быть положительной')
})

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Полное имя обязательно'),
  street: z.string().min(1, 'Адрес обязателен'),
  city: z.string().min(1, 'Город обязателен'),
  state: z.string().optional(),
  country: z.string().min(1, 'Страна обязательна'),
  postalCode: z.string().min(1, 'Почтовый индекс обязателен'),
  phone: z.string().optional()
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Заказ должен содержать хотя бы один товар'),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['westernbid'], { 
    required_error: 'Метод оплаты обязателен',
    invalid_type_error: 'Некорректный метод оплаты'
  }),
  customerEmail: z.string().email('Некорректный email'),
  customerName: z.string().min(1, 'Имя клиента обязательно'),
  customerPhone: z.string().optional(),
  notes: z.string().optional()
})

// Схемы валидации для пользователей
export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  name: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  phone: z.string().optional()
})

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен')
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: z.string().min(8, 'Новый пароль должен содержать минимум 8 символов'),
  confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword']
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Токен сброса обязателен'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword']
})

// Схемы валидации для отзывов
export const reviewSchema = z.object({
  productId: z.string().uuid('Некорректный ID продукта'),
  rating: z.number().int().min(1, 'Рейтинг должен быть от 1 до 5').max(5, 'Рейтинг должен быть от 1 до 5'),
  comment: z.string().max(1000, 'Комментарий слишком длинный').optional(),
  customerName: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  customerEmail: z.string().email('Некорректный email')
})

// Схемы валидации для загрузки файлов
export const uploadSchema = z.object({
  file: z.instanceof(File, { message: 'Файл обязателен' }),
  folder: z.string().optional(),
  maxSize: z.number().optional().default(5 * 1024 * 1024), // 5MB по умолчанию
  allowedTypes: z.array(z.string()).optional().default(['image/jpeg', 'image/png', 'image/webp'])
})

// Схемы валидации для cart
export const addToCartSchema = z.object({
  productId: z.string().uuid('Некорректный ID продукта'),
  skuId: z.string().uuid('Некорректный ID SKU'),
  quantity: z.number().int().positive('Количество должно быть положительным').max(99, 'Максимальное количество: 99')
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Количество не может быть отрицательным').max(99, 'Максимальное количество: 99')
})

// Схемы валидации для админки
export const adminAuthSchema = z.object({
  apiKey: z.string().min(1, 'API ключ обязателен')
})

// Общие схемы
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

export const searchSchema = z.object({
  q: z.string().min(1, 'Поисковый запрос обязателен').max(200, 'Запрос слишком длинный'),
  category: z.string().uuid().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  ...paginationSchema.shape
})

// Тип для ошибок валидации
export interface ValidationError {
  field: string
  message: string
}

// Функция для валидации JSON тела запроса
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: ValidationError[] }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'body', message: 'Некорректный JSON формат' }]
    }
  }
}

// Функция для валидации query параметров
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const params: Record<string, any> = {}
    
    // Преобразуем URLSearchParams в объект
    for (const [key, value] of searchParams.entries()) {
      // Пробуем преобразовать числовые значения
      if (!isNaN(Number(value)) && value !== '') {
        params[key] = Number(value)
      } else if (value === 'true') {
        params[key] = true
      } else if (value === 'false') {
        params[key] = false
      } else {
        params[key] = value
      }
    }
    
    const result = schema.safeParse(params)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'params', message: 'Ошибка обработки параметров' }]
    }
  }
}

// Middleware для проверки Admin API ключа
export function validateAdminApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const apiKey = authHeader?.replace('Bearer ', '')
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return false
  }
  
  return true
}

// Функция для создания стандартного ответа об ошибке валидации
export function createValidationErrorResponse(errors: ValidationError[]) {
  return Response.json(
    {
      success: false,
      error: 'Ошибка валидации',
      errors
    },
    { status: 400 }
  )
}

// Функция для создания стандартного ответа об ошибке авторизации
export function createAuthErrorResponse(message = 'Неавторизованный доступ') {
  return Response.json(
    {
      success: false,
      error: message
    },
    { status: 401 }
  )
}

// Функция для создания стандартного ответа об ошибке сервера
export function createServerErrorResponse(message = 'Внутренняя ошибка сервера') {
  return Response.json(
    {
      success: false,
      error: message
    },
    { status: 500 }
  )
}

// Экспорт всех схем как объект для удобства
export const schemas = {
  product: productSchema,
  updateProduct: updateProductSchema,
  category: categorySchema,
  updateCategory: updateCategorySchema,
  orderItem: orderItemSchema,
  shippingAddress: shippingAddressSchema,
  createOrder: createOrderSchema,
  register: registerSchema,
  login: loginSchema,
  changePassword: changePasswordSchema,
  resetPassword: resetPasswordSchema,
  review: reviewSchema,
  upload: uploadSchema,
  addToCart: addToCartSchema,
  updateCartItem: updateCartItemSchema,
  adminAuth: adminAuthSchema,
  pagination: paginationSchema,
  search: searchSchema
} as const