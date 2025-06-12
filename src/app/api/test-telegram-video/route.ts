import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM'

export async function POST(request: NextRequest) {
  try {
    const { file_id } = await request.json()
    
    if (!file_id) {
      return NextResponse.json({
        success: false,
        error: 'file_id is required'
      }, { status: 400 })
    }
    
    console.log('Testing Telegram video file_id:', file_id)
    
    // Получаем информацию о файле от Telegram
    const fileResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${file_id}`)
    const fileData = await fileResponse.json()
    
    console.log('Telegram getFile response:', JSON.stringify(fileData, null, 2))
    
    if (!fileData.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get file from Telegram',
        details: fileData
      }, { status: 500 })
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`
    
    return NextResponse.json({
      success: true,
      telegram_response: fileData.result,
      file_url: fileUrl,
      file_size: fileData.result.file_size,
      file_path: fileData.result.file_path
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST a JSON body with { "file_id": "telegram_file_id" } to test file access'
  })
}