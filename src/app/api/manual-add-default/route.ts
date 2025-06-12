import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Добавляем дефолтное видео, которое сейчас показывается на сайте
    const defaultVideoUrl = "/assets/videos/hero2.mp4"
    
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
        count: existingVideos.length,
        videos: existingVideos.map(v => ({ id: v.key, url: v.value }))
      })
    }
    
    // Создаем новое видео в формате галереи с дефолтным видео
    const addedVideo = await prisma.setting.create({
      data: {
        key: `home_video_${Date.now()}`,
        value: defaultVideoUrl
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Default video added to gallery',
      video: {
        id: addedVideo.key,
        url: addedVideo.value
      }
    })
    
  } catch (error) {
    console.error('Error adding default video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add default video',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}