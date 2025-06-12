import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Простая миграция без авторизации - добавляем известное видео
    const videoUrl = "https://res.cloudinary.com/dqi4iuyo1/video/upload/v1749734336/vobvorot-videos/gt7zywzugu9dq5kq8giw.mp4"
    
    // Проверяем, есть ли уже видео в галерее
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
        message: 'Videos already exist in gallery',
        count: existingVideos.length
      })
    }
    
    // Создаем новое видео в формате галереи
    const migratedVideo = await prisma.setting.create({
      data: {
        key: `home_video_${Date.now()}`,
        value: videoUrl
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Video migrated to gallery successfully',
      video: {
        id: migratedVideo.key,
        url: migratedVideo.value
      }
    })
    
  } catch (error) {
    console.error('Error in simple migration:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}