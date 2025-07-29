// Модуль управления видео для AI ассистента
import { Bot } from 'grammy'
import cloudinary from 'cloudinary'

// Инициализация Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI'
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.INTERNAL_API_KEY || 'fallback-key'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vobvorot.com'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  publicId?: string
}

export interface VideoInfo {
  id: string
  url: string
  title?: string
  createdAt?: Date
  type?: 'home' | 'sign' | 'product'
}

// Загрузить видео из Telegram в Cloudinary
export async function uploadVideoFromTelegram(
  fileId: string, 
  folder: string = 'vobvorot-videos'
): Promise<UploadResult> {
  try {
    // Создаем временный бот для получения файла
    const bot = new Bot(BOT_TOKEN)
    
    // Получаем файл из Telegram
    const file = await bot.api.getFile(fileId)
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
    
    // Загружаем в Cloudinary
    const result = await cloudinary.v2.uploader.upload(fileUrl, {
      resource_type: 'video',
      folder: folder,
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    })
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    }
  } catch (error: any) {
    console.error('Video upload error:', error)
    return {
      success: false,
      error: error.message || 'Ошибка загрузки видео'
    }
  }
}

// Обновить видео на главной странице
export async function updateHomeVideo(videoUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/site/home-video`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoUrl })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Home video update error:', error)
    return { 
      success: false, 
      error: error.message || 'Ошибка обновления видео' 
    }
  }
}

// Получить текущее видео главной страницы
export async function getHomeVideo(): Promise<VideoInfo | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/site/home-video`)
    const data = await response.json()
    
    if (data.videoUrl) {
      return {
        id: 'home-video',
        url: data.videoUrl,
        type: 'home',
        createdAt: new Date(data.updatedAt)
      }
    }
    
    return null
  } catch (error) {
    console.error('Get home video error:', error)
    return null
  }
}

// Получить все видео для страницы подписей
export async function getSignVideos(): Promise<VideoInfo[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/site/sign-videos`)
    const data = await response.json()
    
    if (data.videos && Array.isArray(data.videos)) {
      return data.videos.map((video: any) => ({
        id: video.id,
        url: video.url,
        type: 'sign',
        createdAt: video.createdAt ? new Date(video.createdAt) : undefined
      }))
    }
    
    return []
  } catch (error) {
    console.error('Get sign videos error:', error)
    return []
  }
}

// Добавить видео на страницу подписей
export async function addSignVideo(videoUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/site/sign-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoUrl })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Add sign video error:', error)
    return { 
      success: false, 
      error: error.message || 'Ошибка добавления видео' 
    }
  }
}

// Удалить видео со страницы подписей
export async function deleteSignVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/site/sign-videos`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      },
      body: JSON.stringify({ videoId })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete sign video error:', error)
    return { 
      success: false, 
      error: error.message || 'Ошибка удаления видео' 
    }
  }
}

// Удалить видео из Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: 'video'
    })
    return result.result === 'ok'
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return false
  }
}

// Форматировать список видео для отображения
export function formatVideoList(videos: VideoInfo[]): string {
  if (videos.length === 0) {
    return '📹 Видео не найдено'
  }
  
  return videos.map((video, index) => {
    const date = video.createdAt ? video.createdAt.toLocaleDateString('ru') : 'Неизвестно'
    return `${index + 1}\\\\\\\\. [Видео ${index + 1}](${video.url})\\n   📅 Добавлено: ${date}\\n   🆔 ID: \\\\\\\\` + `${video.id}` + '\\\\\\\\`'
  }).join('\\n\\n')
}