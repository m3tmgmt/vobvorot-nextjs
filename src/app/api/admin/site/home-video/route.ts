import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    // Временно отключаем авторизацию для тестирования
    // const authHeader = request.headers.get('authorization')
    // const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    // if (authHeader !== expectedToken) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { videoUrl } = await request.json()

    // Сохраняем в базу данных используя upsert
    await prisma.setting.upsert({
      where: { key: 'home_video_url' },
      update: { value: videoUrl || '' },
      create: { 
        key: 'home_video_url',
        value: videoUrl || ''
      }
    })
    
    console.log('Home video updated in database:', videoUrl)

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      message: videoUrl ? 'Home video updated successfully' : 'Home video removed successfully'
    })

  } catch (error) {
    console.error('Error updating home video:', error)
    return NextResponse.json(
      { error: 'Failed to update home video' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Получаем видео из базы данных
    const setting = await prisma.setting.findUnique({
      where: { key: 'home_video_url' }
    })
    
    const videoUrl = setting?.value || null
    const hasVideo = videoUrl && videoUrl.trim() !== ''
    
    return NextResponse.json({
      videoUrl: hasVideo ? videoUrl : null,
      updatedAt: new Date().toISOString(),
      message: hasVideo ? 'Home video configured' : 'No home video configured'
    })
  } catch (error) {
    console.error('Error reading home video config:', error)
    return NextResponse.json(
      { error: 'Failed to read home video config' },
      { status: 500 }
    )
  }
}