import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Ищем последнее успешно загруженное видео в логах
    const successLogs = await prisma.setting.findMany({
      where: {
        key: {
          contains: 'debug_log_update_home_video_success'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    let lastValidVideoUrl = null
    
    for (const log of successLogs) {
      try {
        const logData = JSON.parse(log.value)
        if (logData.videoUrl && logData.videoUrl.trim() !== '' && logData.videoUrl.startsWith('https://')) {
          lastValidVideoUrl = logData.videoUrl
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!lastValidVideoUrl) {
      return NextResponse.json({
        success: false,
        message: 'No valid video URL found in logs'
      })
    }
    
    // Проверяем, нет ли уже видео в новом формате галереи
    const existingVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      }
    })
    
    if (existingVideos.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Gallery already has videos',
        existing_videos: existingVideos.length
      })
    }
    
    // Создаем новое видео в формате галереи
    const recoveredVideo = await prisma.setting.create({
      data: {
        key: `home_video_${Date.now()}`,
        value: lastValidVideoUrl
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Video recovered to gallery',
      recovered_video: {
        id: recoveredVideo.key,
        url: recoveredVideo.value
      }
    })
    
  } catch (error) {
    console.error('Error recovering video:', error)
    return NextResponse.json(
      { error: 'Failed to recover video' },
      { status: 500 }
    )
  }
}