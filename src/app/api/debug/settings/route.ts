import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Получаем все настройки для отладки
    const allSettings = await prisma.setting.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Фильтруем настройки, связанные с видео
    const videoRelatedSettings = allSettings.filter(setting => 
      setting.key.includes('video') || setting.key.includes('home')
    )
    
    return NextResponse.json({
      total_settings: allSettings.length,
      video_related_settings: videoRelatedSettings.length,
      all_settings: allSettings.map(s => ({
        key: s.key,
        value: s.value?.substring(0, 100) + (s.value && s.value.length > 100 ? '...' : ''),
        created: s.createdAt
      })),
      video_settings: videoRelatedSettings
    })
  } catch (error) {
    console.error('Error reading settings:', error)
    return NextResponse.json(
      { error: 'Failed to read settings' },
      { status: 500 }
    )
  }
}