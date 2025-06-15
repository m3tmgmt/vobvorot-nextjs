import { describe, it, expect } from '@jest/globals'
import {
  productSchema,
  categorySchema,
  createOrderSchema,
  registerSchema,
  validateRequestBody,
  validateSearchParams,
  validateEnv
} from '@/lib/validation'
import { NextRequest } from 'next/server'

describe('Validation Schemas', () => {
  describe('productSchema', () => {
    it('should validate a valid product', () => {
      const validProduct = {
        name: 'Test Product',
        description: 'Test description',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        price: 99.99,
        stock: 10,
        images: ['https://example.com/image.jpg'],
        featured: true,
        active: true
      }
      
      const result = productSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })
    
    it('should reject invalid product data', () => {
      const invalidProduct = {
        name: '', // Empty name
        categoryId: 'invalid-uuid',
        price: -10, // Negative price
        stock: -5 // Negative stock
      }
      
      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors).toHaveLength(4)
      }
    })
  })
  
  describe('registerSchema', () => {
    it('should validate a valid registration', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        phone: '+1234567890'
      }
      
      const result = registerSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })
    
    it('should reject weak passwords', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'weak', // Too short and missing requirements
        name: 'Test User'
      }
      
      const result = registerSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })
  
  describe('createOrderSchema', () => {
    it('should validate a valid order', () => {
      const validOrder = {
        items: [{
          productId: '550e8400-e29b-41d4-a716-446655440000',
          skuId: '550e8400-e29b-41d4-a716-446655440001',
          quantity: 2,
          price: 50
        }],
        shippingAddress: {
          fullName: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          country: 'USA',
          postalCode: '10001'
        },
        paymentMethod: 'westernbid',
        customerEmail: 'john@example.com',
        customerName: 'John Doe'
      }
      
      const result = createOrderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })
    
    it('should reject empty order items', () => {
      const invalidOrder = {
        items: [],
        shippingAddress: {
          fullName: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          country: 'USA',
          postalCode: '10001'
        },
        paymentMethod: 'westernbid',
        customerEmail: 'john@example.com',
        customerName: 'John Doe'
      }
      
      const result = createOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })
  })
})