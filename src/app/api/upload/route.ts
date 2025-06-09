import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Проверка API ключа
function verifyApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const apiKey = process.env.ADMIN_API_KEY || 'ADMIN_vobvorot_api_key_2024_ultra_secure_access_token_abc123xyz'
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  return token === apiKey
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'image' or 'video'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Генерируем уникальное имя файла
    const ext = path.extname(file.name).toLowerCase()
    const hash = crypto.randomBytes(16).toString('hex')
    const filename = `${hash}${ext}`
    
    // Определяем папку для сохранения
    const uploadDir = type === 'video' ? 'videos' : 'images'
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', uploadDir)
    
    // Создаем директорию если не существует
    await mkdir(uploadPath, { recursive: true })
    
    // Сохраняем файл
    const filePath = path.join(uploadPath, filename)
    await writeFile(filePath, buffer)
    
    // Возвращаем URL для доступа к файлу
    const fileUrl = `/uploads/${uploadDir}/${filename}`
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: filename,
      type: type
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}