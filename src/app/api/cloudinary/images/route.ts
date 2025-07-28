import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryService } from '@/lib/cloudinary';

// Получение списка изображений
export async function GET(request: NextRequest) {
  try {
    // Проверяем конфигурацию Cloudinary
    if (!cloudinaryService.isConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cloudinary не сконфигурирован. Проверьте переменные окружения.' 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || process.env.CLOUDINARY_UPLOAD_FOLDER || 'vobvorot-store';
    const maxResults = parseInt(searchParams.get('max_results') || '30');
    const publicId = searchParams.get('public_id');

    // Если запрашивается конкретное изображение
    if (publicId) {
      try {
        const imageInfo = await cloudinaryService.getImageInfo(publicId);
        
        // Генерируем различные размеры
        const urls = {
          original: imageInfo.secure_url,
          thumbnail: cloudinaryService.generateOptimizedUrl(publicId, {
            width: 150,
            height: 150,
            crop: 'fill',
            quality: 'auto',
          }),
          small: cloudinaryService.generateOptimizedUrl(publicId, {
            width: 300,
            height: 300,
            crop: 'fill',
            quality: 'auto',
          }),
          medium: cloudinaryService.generateOptimizedUrl(publicId, {
            width: 600,
            height: 600,
            crop: 'fill',
            quality: 'auto',
          }),
          large: cloudinaryService.generateOptimizedUrl(publicId, {
            width: 1200,
            height: 1200,
            crop: 'fill',
            quality: 'auto',
          }),
        };

        return NextResponse.json({
          success: true,
          data: {
            ...imageInfo,
            urls,
          },
        });
      } catch (error: any) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Изображение с public_id "${publicId}" не найдено` 
          },
          { status: 404 }
        );
      }
    }

    // Получаем список изображений в папке
    const result = await cloudinaryService.listImages(folder, maxResults);
    
    // Добавляем оптимизированные URL для каждого изображения
    const imagesWithUrls = result.resources.map((image: any) => ({
      ...image,
      urls: {
        original: image.secure_url,
        thumbnail: cloudinaryService.generateOptimizedUrl(image.public_id, {
          width: 150,
          height: 150,
          crop: 'fill',
          quality: 'auto',
        }),
        small: cloudinaryService.generateOptimizedUrl(image.public_id, {
          width: 300,
          height: 300,
          crop: 'fill',
          quality: 'auto',
        }),
        medium: cloudinaryService.generateOptimizedUrl(image.public_id, {
          width: 600,
          height: 600,
          crop: 'fill',
          quality: 'auto',
        }),
        large: cloudinaryService.generateOptimizedUrl(image.public_id, {
          width: 1200,
          height: 1200,
          crop: 'fill',
          quality: 'auto',
        }),
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        images: imagesWithUrls,
        total_count: result.total_count,
        rate_limit_allowed: result.rate_limit_allowed,
        rate_limit_reset_at: result.rate_limit_reset_at,
        rate_limit_remaining: result.rate_limit_remaining,
      },
    });

  } catch (error: any) {
    console.error('Ошибка получения изображений из Cloudinary:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при получении списка изображений' 
      },
      { status: 500 }
    );
  }
}