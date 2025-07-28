import { NextRequest, NextResponse } from 'next/server'
import { cloudinaryService } from '@/lib/cloudinary'

export async function GET() {
  try {
    // Проверяем конфигурацию Cloudinary
    const isConfigured = cloudinaryService.isConfigured()
    
    const config = {
      isConfigured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
    }
    
    console.log('Cloudinary configuration check:', config)
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Cloudinary not configured',
        config
      }, { status: 500 })
    }
    
    // Тестируем простую загрузку
    try {
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      const result = await cloudinaryService.uploadFromUrl(testUrl, {
        folder: 'vobvorot-test',
        resource_type: 'image'
      })
      
      return NextResponse.json({
        success: true,
        message: 'Cloudinary working correctly',
        config,
        testUpload: {
          url: result.secure_url,
          publicId: result.public_id
        }
      })
    } catch (uploadError) {
      console.error('Cloudinary upload test failed:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Upload test failed',
        config,
        uploadError: uploadError instanceof Error ? uploadError.message : String(uploadError)
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Cloudinary test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}