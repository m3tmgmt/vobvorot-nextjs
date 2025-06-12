import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'

export async function GET() {
  try {
    console.log('Testing simple video upload to Cloudinary...')
    
    // Тест с маленьким видео URL (около 1MB)
    const testVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4'
    
    console.log('Uploading test video from:', testVideoUrl)
    
    const result = await cloudinary.uploader.upload(testVideoUrl, {
      resource_type: 'video',
      folder: 'test-videos',
      chunk_size: 6000000, // 6MB chunks
      eager: [
        { format: 'mp4', video_codec: 'h264' }
      ]
    })
    
    console.log('Video upload successful:', result.secure_url)
    
    return NextResponse.json({
      success: true,
      message: 'Video upload test successful',
      video_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      duration: result.duration || 'N/A',
      size: result.bytes
    })
    
  } catch (error) {
    console.error('Simple video test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Simple video test failed',
      details: error instanceof Error ? error.message : String(error),
      error_obj: error
    }, { status: 500 })
  }
}