import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Получить все видео для конкретного товара
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params

    // Проверяем, что товар существует
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, videoUrl: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Получаем все видео для этого товара из Settings таблицы
    const videoSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: `product_video_${productId}_`
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Если есть старое видео в поле videoUrl, но нет новых видео, мигрируем его
    if (product.videoUrl && product.videoUrl.trim() !== '' && videoSettings.length === 0) {
      console.log('Migrating old product video to new gallery format:', product.videoUrl)
      
      // Создаем новое видео в формате галереи
      const migratedVideo = await prisma.setting.create({
        data: {
          key: `product_video_${productId}_${Date.now()}`,
          value: product.videoUrl
        }
      })
      
      // Очищаем старое поле videoUrl
      await prisma.product.update({
        where: { id: productId },
        data: { videoUrl: null }
      })
      
      // Добавляем мигрированное видео к результатам
      videoSettings.push(migratedVideo)
    }

    const videos = videoSettings
      .filter(setting => setting.value && setting.value.trim() !== '')
      .map((setting, index) => ({
        id: setting.key,
        url: setting.value,
        order: index,
        createdAt: setting.createdAt
      }))

    return NextResponse.json({
      productId,
      productName: product.name,
      videos,
      count: videos.length,
      message: videos.length > 0 ? `Found ${videos.length} videos for product` : 'No videos configured for this product'
    })
  } catch (error) {
    console.error('Error reading product videos:', error)
    return NextResponse.json(
      { error: 'Failed to read product videos' },
      { status: 500 }
    )
  }
}

// Добавить новое видео к товару
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = params
    const { videoUrl } = await request.json()

    if (!videoUrl || videoUrl.trim() === '') {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    // Проверяем, что товар существует
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Создаем уникальный ключ для нового видео
    const timestamp = Date.now()
    const videoKey = `product_video_${productId}_${timestamp}`

    // Добавляем новое видео
    await prisma.setting.create({
      data: {
        key: videoKey,
        value: videoUrl.trim()
      }
    })
    
    console.log('New product video added:', videoKey, videoUrl)

    // Получаем обновленный список всех видео для товара
    const allVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: `product_video_${productId}_`
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const videos = allVideos
      .filter(setting => setting.value && setting.value.trim() !== '')
      .map((setting, index) => ({
        id: setting.key,
        url: setting.value,
        order: index,
        createdAt: setting.createdAt
      }))

    return NextResponse.json({
      success: true,
      productId,
      productName: product.name,
      addedVideo: {
        id: videoKey,
        url: videoUrl,
        order: videos.length - 1
      },
      videos,
      count: videos.length,
      message: 'Video added to product gallery successfully'
    })

  } catch (error) {
    console.error('Error adding product video:', error)
    return NextResponse.json(
      { error: 'Failed to add product video' },
      { status: 500 }
    )
  }
}

// Удалить видео товара по ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = params
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Проверяем, что товар существует
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Проверяем, что видео принадлежит этому товару
    if (!videoId.startsWith(`product_video_${productId}_`)) {
      return NextResponse.json(
        { error: 'Video does not belong to this product' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли видео
    const existingVideo = await prisma.setting.findUnique({
      where: { key: videoId }
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Удаляем видео
    await prisma.setting.delete({
      where: { key: videoId }
    })
    
    console.log('Product video deleted:', videoId)

    // Получаем обновленный список всех видео для товара
    const allVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: `product_video_${productId}_`
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const videos = allVideos
      .filter(setting => setting.value && setting.value.trim() !== '')
      .map((setting, index) => ({
        id: setting.key,
        url: setting.value,
        order: index,
        createdAt: setting.createdAt
      }))

    return NextResponse.json({
      success: true,
      productId,
      productName: product.name,
      deletedVideoId: videoId,
      videos,
      count: videos.length,
      message: 'Video deleted from product gallery successfully'
    })

  } catch (error) {
    console.error('Error deleting product video:', error)
    return NextResponse.json(
      { error: 'Failed to delete product video' },
      { status: 500 }
    )
  }
}