import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    console.log(`📁 Downloading file ${fileId} from Telegram`)
    
    // Получаем информацию о файле от Telegram
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    )
    
    if (!fileInfoResponse.ok) {
      console.error('Failed to get file info from Telegram:', await fileInfoResponse.text())
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    const fileInfo = await fileInfoResponse.json()
    
    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error('Invalid file info response:', fileInfo)
      return NextResponse.json({ error: 'File not available' }, { status: 404 })
    }
    
    const filePath = fileInfo.result.file_path
    console.log(`📁 File path: ${filePath}`)
    
    // Скачиваем файл от Telegram
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
    const fileResponse = await fetch(fileUrl)
    
    if (!fileResponse.ok) {
      console.error('Failed to download file from Telegram:', fileResponse.status)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }
    
    // Определяем MIME type и имя файла
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream'
    const fileExtension = filePath.split('.').pop() || 'bin'
    const fileName = `digital_file_${Date.now()}.${fileExtension}`
    
    console.log(`✅ File downloaded successfully: ${fileName} (${contentType})`)
    
    // Возвращаем файл клиенту
    const fileBuffer = await fileResponse.arrayBuffer()
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600', // Кешируем на 1 час
      },
    })
    
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}