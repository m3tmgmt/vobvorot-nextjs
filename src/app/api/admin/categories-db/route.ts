import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Проверка админской авторизации
function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const adminApiKey = process.env.ADMIN_API_KEY || 'admin_secret_key_2024'
  
  return authHeader === `Bearer ${adminApiKey}`
}

// GET - получить категории из базы данных
export async function GET(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            skus: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length
    })
  } catch (error: any) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - создать новую категорию
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, parentId } = body

    // Валидация обязательных полей
    if (!name) {
      return NextResponse.json({ 
        error: 'Category name is required' 
      }, { status: 400 })
    }

    // Создаем slug из названия
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Проверяем что slug уникальный
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      return NextResponse.json({
        error: 'Category with this name already exists'
      }, { status: 400 })
    }

    // Создаем категорию
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || '',
        parentId: parentId || null,
        isActive: true,
        sortOrder: 0
      }
    })

    return NextResponse.json({
      success: true,
      category,
      message: 'Category created successfully'
    })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create category',
      details: error.message
    }, { status: 500 })
  }
}