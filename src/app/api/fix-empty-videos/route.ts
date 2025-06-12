import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Находим и удаляем пустые видео записи
    const emptyVideos = await prisma.setting.findMany({
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
    
    console.log('Found empty videos:', emptyVideos)
    
    // Удаляем пустые записи
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
    
    // Добавляем дефолтное видео
    const defaultVideo = await prisma.setting.create({
      data: {
        key: `home_video_${Date.now()}`,
        value: '/assets/videos/hero2.mp4'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Fixed empty videos and added default',
      deleted_count: deleteResult.count,
      deleted_videos: emptyVideos,
      added_video: {
        id: defaultVideo.key,
        url: defaultVideo.value
      }
    })
    
  } catch (error) {
    console.error('Error fixing empty videos:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix empty videos',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}