import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - получить видео для страницы sign
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'sign_page_videos' }
    })

    if (!setting || !setting.value) {
      return NextResponse.json({ videos: [] })
    }

    const videos = JSON.parse(setting.value)
    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Failed to fetch sign page videos:', error)
    return NextResponse.json({ videos: [] })
  }
}

// POST - обновить видео (только для админа)
export async function POST(request: NextRequest) {
  try {
    // Проверяем админские права
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { videos } = await request.json()

    if (!Array.isArray(videos)) {
      return NextResponse.json(
        { error: 'Videos must be an array' },
        { status: 400 }
      )
    }

    // Сохраняем в базу данных
    await prisma.setting.upsert({
      where: { key: 'sign_page_videos' },
      update: {
        value: JSON.stringify(videos),
        updatedAt: new Date()
      },
      create: {
        key: 'sign_page_videos',
        value: JSON.stringify(videos)
      }
    })

    return NextResponse.json({ 
      success: true, 
      videos,
      message: 'Sign page videos updated successfully' 
    })
  } catch (error) {
    console.error('Failed to update sign page videos:', error)
    return NextResponse.json(
      { error: 'Failed to update videos' },
      { status: 500 }
    )
  }
}