import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoUrl } = await request.json()
    const resolvedParams = await params
    const productId = resolvedParams.id

    // Обновляем URL видео для товара
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { 
        videoUrl: videoUrl,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Video URL updated successfully'
    })

  } catch (error) {
    console.error('Error updating product video:', error)
    return NextResponse.json(
      { error: 'Failed to update product video' },
      { status: 500 }
    )
  }
}