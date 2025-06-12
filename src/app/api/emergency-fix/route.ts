import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Проверяем текущее состояние галереи
    const allVideoSettings = await prisma.setting.findMany({
      where: {
        key: {
          contains: 'home_video'
        }
      }
    })
    
    // Удаляем все пустые записи
    const deleteResult = await prisma.setting.deleteMany({
      where: {
        OR: [
          {
            key: {
              startsWith: 'home_video'
            },
            value: ''
          },
          {
            key: {
              startsWith: 'home_video'
            },
            value: null
          }
        ]
      }
    })
    
    // Проверяем, есть ли видео после очистки
    const remainingVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      }
    })
    
    let addedVideo = null
    
    if (remainingVideos.length === 0) {
      // Добавляем дефолтное видео
      addedVideo = await prisma.setting.create({
        data: {
          key: `home_video_${Date.now()}`,
          value: '/assets/videos/hero2.mp4'
        }
      })
    }
    
    // Получаем финальное состояние
    const finalVideos = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'home_video_'
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Emergency fix applied',
      before: allVideoSettings,
      deleted_count: deleteResult.count,
      added_video: addedVideo,
      final_videos: finalVideos
    })
    
  } catch (error) {
    console.error('Emergency fix error:', error)
    return NextResponse.json(
      { 
        error: 'Emergency fix failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}