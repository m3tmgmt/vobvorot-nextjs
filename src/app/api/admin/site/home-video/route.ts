import { NextRequest, NextResponse } from 'next/server'

// Используем переменную окружения для хранения URL видео
let homeVideoUrl: string | null = null

export async function PUT(request: NextRequest) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoUrl } = await request.json()

    // Сохраняем URL видео в память (для простоты в продакшн среде)
    homeVideoUrl = videoUrl
    
    // В будущем можно сохранять в базу данных
    console.log('Home video updated:', videoUrl)

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
    return NextResponse.json({
      videoUrl: homeVideoUrl,
      updatedAt: new Date().toISOString(),
      message: homeVideoUrl ? 'Home video configured' : 'No home video configured'
    })
  } catch (error) {
    console.error('Error reading home video config:', error)
    return NextResponse.json(
      { error: 'Failed to read home video config' },
      { status: 500 }
    )
  }
}