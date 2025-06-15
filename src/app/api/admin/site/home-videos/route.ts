import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache for video URLs (5 minutes)
let videoCache: { videos: any[], timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Получить все домашние видео
export async function GET() {
  try {
    // Check cache first
    if (videoCache && (Date.now() - videoCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached home videos')
      return NextResponse.json({
        videos: videoCache.videos,
        count: videoCache.videos.length,
        message: videoCache.videos.length > 0 ? `Found ${videoCache.videos.length} videos (cached)` : 'No videos configured',
        cached: true
      })
    }

    // Получаем все видео из настроек для галереи (новый формат)
    const newVideoSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    // Проверяем старый формат видео для миграции
    const oldVideoSetting = await prisma.setting.findUnique({
      where: { key: 'home_video_url' }
    })
    
    // Если есть старое видео, но нет новых видео, мигрируем его
    if (oldVideoSetting && oldVideoSetting.value && oldVideoSetting.value.trim() !== '' && newVideoSettings.length === 0) {
      console.log('Migrating old video to new gallery format:', oldVideoSetting.value)
      
      // Создаем новое видео в формате галереи
      const migratedVideo = await prisma.setting.create({
        data: {
          key: `home_video_${Date.now()}`,
          value: oldVideoSetting.value
        }
      })
      
      // Добавляем мигрированное видео к результатам
      newVideoSettings.push(migratedVideo)
    }
    
    const videos = newVideoSettings
      .filter(setting => setting.value && setting.value.trim() !== '')
      .map((setting, index) => ({
        id: setting.key,
        url: setting.value,
        order: index,
        createdAt: setting.createdAt
      }))
    
    // Update cache
    videoCache = {
      videos,
      timestamp: Date.now()
    }
    
    return NextResponse.json({
      videos,
      count: videos.length,
      message: videos.length > 0 ? `Found ${videos.length} videos` : 'No videos configured'
    })
  } catch (error) {
    console.error('Error reading home videos:', error)
    return NextResponse.json(
      { error: 'Failed to read home videos' },
      { status: 500 }
    )
  }
}

// Добавить новое видео в галерею
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoUrl } = await request.json()

    if (!videoUrl || videoUrl.trim() === '') {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    // Создаем уникальный ключ для нового видео
    const timestamp = Date.now()
    const videoKey = `home_video_${timestamp}`

    // Добавляем новое видео
    await prisma.setting.create({
      data: {
        key: videoKey,
        value: videoUrl.trim()
      }
    })
    
    // Clear cache after adding video
    videoCache = null
    
    console.log('New home video added:', videoKey, videoUrl)

    // Получаем обновленный список всех видео
    const allVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
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
      addedVideo: {
        id: videoKey,
        url: videoUrl,
        order: videos.length - 1
      },
      videos,
      count: videos.length,
      message: 'Video added to gallery successfully'
    })

  } catch (error) {
    console.error('Error adding home video:', error)
    return NextResponse.json(
      { error: 'Failed to add home video' },
      { status: 500 }
    )
  }
}

// Удалить видео из галереи по ID
export async function DELETE(request: NextRequest) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
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
    
    // Clear cache after deleting video
    videoCache = null
    
    console.log('Home video deleted:', videoId)

    // Получаем обновленный список всех видео
    const allVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
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
      deletedVideoId: videoId,
      videos,
      count: videos.length,
      message: 'Video deleted from gallery successfully'
    })

  } catch (error) {
    console.error('Error deleting home video:', error)
    return NextResponse.json(
      { error: 'Failed to delete home video' },
      { status: 500 }
    )
  }
}