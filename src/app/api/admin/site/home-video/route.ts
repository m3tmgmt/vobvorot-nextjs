import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

export async function PUT(request: NextRequest) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoUrl } = await request.json()

    // Сохраняем URL видео в конфигурационный файл
    const configPath = join(process.cwd(), 'public', 'config', 'home-video.json')
    
    // Создаем директорию если не существует
    const configDir = join(process.cwd(), 'public', 'config')
    try {
      const fs = require('fs')
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }
    } catch (dirError) {
      console.log('Directory creation handled')
    }

    const config = {
      videoUrl: videoUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: 'telegram-bot'
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2))

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
    const configPath = join(process.cwd(), 'public', 'config', 'home-video.json')
    
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      return NextResponse.json(config)
    } catch (readError) {
      // Файл не существует или поврежден
      return NextResponse.json({
        videoUrl: null,
        message: 'No home video configured'
      })
    }

  } catch (error) {
    console.error('Error reading home video config:', error)
    return NextResponse.json(
      { error: 'Failed to read home video config' },
      { status: 500 }
    )
  }
}