import { NextRequest, NextResponse } from 'next/server'
import { cloudinaryService } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json()
    
    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: 'videoUrl is required'
      }, { status: 400 })
    }
    
    console.log('Testing video upload from URL:', videoUrl)
    
    // Тестируем загрузку видео с упрощенными настройками
    const result = await cloudinaryService.uploadFromUrl(videoUrl, {
      folder: 'vobvorot-test-videos',
      resource_type: 'video',
      overwrite: true,
      unique_filename: true
    })
    
    console.log('Video upload test successful:', result.secure_url)
    
    return NextResponse.json({
      success: true,
      message: 'Video upload test successful',
      result: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        duration: (result as any).duration || 'N/A',
        size: result.bytes
      }
    })
    
  } catch (error) {
    console.error('Video upload test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Video upload test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST a JSON body with { "videoUrl": "https://example.com/video.mp4" } to test video upload'
  })
}