import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache for sign video URLs (5 minutes)
let signVideoCache: { videos: any[], timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Получить все sign видео
export async function GET() {
  try {
    // Check cache first
    if (signVideoCache && (Date.now() - signVideoCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached sign videos')
      return NextResponse.json({
        videos: signVideoCache.videos,
        count: signVideoCache.videos.length,
        message: signVideoCache.videos.length > 0 ? `Found ${signVideoCache.videos.length} sign videos (cached)` : 'No sign videos configured',
        cached: true
      })
    }

    // Получаем все видео из настроек для галереи (новый формат)
    const newVideoSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'sign_video_'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    // Проверяем старый формат видео для миграции
    const oldVideoSetting = await prisma.setting.findUnique({
      where: { key: 'sign_page_videos' }
    })
    
    // Если есть старое видео, но нет новых видео, мигрируем его
    if (oldVideoSetting && oldVideoSetting.value && oldVideoSetting.value.trim() !== '' && newVideoSettings.length === 0) {
      console.log('Migrating old sign videos to new gallery format:', oldVideoSetting.value)
      
      try {
        const oldVideos = JSON.parse(oldVideoSetting.value)
        if (Array.isArray(oldVideos)) {
          // Создаем новые видео в формате галереи
          for (let i = 0; i < oldVideos.length; i++) {
            const video = oldVideos[i]
            if (video && typeof video === 'object' && video.url) {
              const migratedVideo = await prisma.setting.create({
                data: {
                  key: `sign_video_${Date.now()}_${i}`,
                  value: video.url
                }
              })
              newVideoSettings.push(migratedVideo)
            }
          }
        }
      } catch (parseError) {
        console.error('Failed to parse old sign videos:', parseError)
      }
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
    signVideoCache = {
      videos,
      timestamp: Date.now()
    }
    
    return NextResponse.json({
      videos,
      count: videos.length,
      message: videos.length > 0 ? `Found ${videos.length} sign videos` : 'No sign videos configured'
    })
  } catch (error) {
    console.error('Error reading sign videos:', error)
    return NextResponse.json(
      { error: 'Failed to read sign videos' },
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
    const videoKey = `sign_video_${timestamp}`

    // Добавляем новое видео
    await prisma.setting.create({
      data: {
        key: videoKey,
        value: videoUrl.trim()
      }
    })
    
    // Clear cache after adding video
    signVideoCache = null
    
    console.log('New sign video added:', videoKey, videoUrl)

    // Получаем обновленный список всех видео
    const allVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'sign_video_'
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
      message: 'Video added to sign gallery successfully'
    })

  } catch (error) {
    console.error('Error adding sign video:', error)
    return NextResponse.json(
      { error: 'Failed to add sign video' },
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
    signVideoCache = null
    
    console.log('Sign video deleted:', videoId)

    // Получаем обновленный список всех видео
    const allVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'sign_video_'
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
      message: 'Video deleted from sign gallery successfully'
    })

  } catch (error) {
    console.error('Error deleting sign video:', error)
    return NextResponse.json(
      { error: 'Failed to delete sign video' },
      { status: 500 }
    )
  }
}