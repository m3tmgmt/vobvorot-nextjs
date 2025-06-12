import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Принудительно добавляем последнее валидное видео в галерею
    const videoUrl = "https://res.cloudinary.com/dqi4iuyo1/video/upload/v1749734336/vobvorot-videos/gt7zywzugu9dq5kq8giw.mp4"
    
    // Проверяем, нет ли уже такого видео
    const existingVideo = await prisma.setting.findFirst({
      where: {
        key: {
          startsWith: 'home_video_'
        },
        value: videoUrl
      }
    })
    
    if (existingVideo) {
      return NextResponse.json({
        success: false,
        message: 'Video already exists in gallery',
        video_id: existingVideo.key
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
      message: 'Video migrated to gallery',
      video: {
        id: migratedVideo.key,
        url: migratedVideo.value
      }
    })
    
  } catch (error) {
    console.error('Error migrating video:', error)
    return NextResponse.json(
      { error: 'Failed to migrate video' },
      { status: 500 }
    )
  }
}