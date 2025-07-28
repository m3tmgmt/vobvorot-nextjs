import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryService, cloudinaryHelpers } from '@/lib/cloudinary';

export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { public_id, url } = body;

    let publicIdToDelete = public_id;

    // Если передан URL вместо public_id, извлекаем public_id
    if (!publicIdToDelete && url) {
      publicIdToDelete = cloudinaryHelpers.extractPublicId(url);
    }

    if (!publicIdToDelete) {
      return NextResponse.json(
        { success: false, error: 'public_id или URL не указан' },
        { status: 400 }
      );
    }

    // Удаляем изображение
    const result = await cloudinaryService.deleteImage(publicIdToDelete);

    return NextResponse.json({
      success: true,
      data: {
        public_id: publicIdToDelete,
        result: result.result,
        message: result.result === 'ok' ? 'Изображение успешно удалено' : 'Изображение не найдено',
      },
    });

  } catch (error: any) {
    console.error('Ошибка удаления из Cloudinary:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при удалении файла' 
      },
      { status: 500 }
    );
  }
}

// Массовое удаление
export async function POST(request: NextRequest) {
  try {
    if (!cloudinaryService.isConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cloudinary не сконфигурирован. Проверьте переменные окружения.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { public_ids, urls } = body;

    let publicIdsToDelete = public_ids || [];

    // Если переданы URL вместо public_ids, извлекаем public_ids
    if (urls && Array.isArray(urls)) {
      const extractedIds = urls
        .map(url => cloudinaryHelpers.extractPublicId(url))
        .filter(Boolean);
      publicIdsToDelete = [...publicIdsToDelete, ...extractedIds];
    }

    if (!publicIdsToDelete.length) {
      return NextResponse.json(
        { success: false, error: 'Не указаны public_ids или URLs для удаления' },
        { status: 400 }
      );
    }

    // Удаляем изображения
    const result = await cloudinaryService.bulkDelete(publicIdsToDelete);

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.deleted || {},
        deleted_counts: result.deleted_counts || {},
        not_found: result.not_found || [],
        message: `Обработано ${publicIdsToDelete.length} изображений`,
      },
    });

  } catch (error: any) {
    console.error('Ошибка массового удаления из Cloudinary:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при массовом удалении файлов' 
      },
      { status: 500 }
    );
  }
}