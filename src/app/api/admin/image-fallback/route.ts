import { NextRequest, NextResponse } from 'next/server';
import { imageFallbackManager } from '@/lib/image-fallback';

// Получение статистики fallback системы
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = imageFallbackManager.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });

      case 'check':
        const isAvailable = await imageFallbackManager.checkCloudinaryAvailability();
        return NextResponse.json({
          success: true,
          data: {
            isAvailable,
            message: isAvailable ? 'Cloudinary доступен' : 'Cloudinary недоступен',
          },
        });

      case 'test':
        const testSrc = searchParams.get('src');
        const width = parseInt(searchParams.get('width') || '300');
        const height = parseInt(searchParams.get('height') || '200');
        const fallbackType = searchParams.get('fallbackType') || 'general';

        if (!testSrc) {
          return NextResponse.json(
            { success: false, error: 'Не указан src для тестирования' },
            { status: 400 }
          );
        }

        const testUrl = await imageFallbackManager.getImageUrl(testSrc, {
          width,
          height,
          fallbackType: fallbackType as any,
        });

        return NextResponse.json({
          success: true,
          data: {
            originalSrc: testSrc,
            resultUrl: testUrl,
            options: { width, height, fallbackType },
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Неизвестное действие' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Ошибка в API fallback системы:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при работе с fallback системой' 
      },
      { status: 500 }
    );
  }
}

// Управление fallback системой
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'clearUrlCache':
        imageFallbackManager.clearUrlCache();
        return NextResponse.json({
          success: true,
          message: 'Кеш URL очищен',
        });

      case 'resetStatus':
        imageFallbackManager.resetCloudinaryStatus();
        return NextResponse.json({
          success: true,
          message: 'Статус Cloudinary сброшен',
        });

      case 'clearLocalCache':
        const days = params.days || 7;
        const result = await imageFallbackManager.clearLocalCache(days);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Удалено ${result.deleted} файлов${result.errors.length > 0 ? `, ошибок: ${result.errors.length}` : ''}`,
        });

      case 'preloadImage':
        const { src, options = {} } = params;
        if (!src) {
          return NextResponse.json(
            { success: false, error: 'Не указан src изображения' },
            { status: 400 }
          );
        }

        const localUrl = await imageFallbackManager.preloadImageToLocal(src, options);
        return NextResponse.json({
          success: true,
          data: {
            src,
            localUrl,
            cached: !!localUrl,
          },
          message: localUrl 
            ? 'Изображение успешно предварительно загружено' 
            : 'Не удалось предварительно загрузить изображение',
        });

      case 'batchPreload':
        const { images, concurrency = 3 } = params;
        if (!Array.isArray(images)) {
          return NextResponse.json(
            { success: false, error: 'Некорректный список изображений' },
            { status: 400 }
          );
        }

        const batchResult = await imageFallbackManager.batchPreloadToLocal(images, concurrency);
        const successful = batchResult.filter(r => r.localUrl).length;
        const failed = batchResult.filter(r => !r.localUrl).length;

        return NextResponse.json({
          success: true,
          data: {
            results: batchResult,
            summary: {
              total: batchResult.length,
              successful,
              failed,
            },
          },
          message: `Обработано ${batchResult.length} изображений: ${successful} успешно, ${failed} ошибок`,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Неизвестное действие' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Ошибка в POST API fallback системы:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при выполнении операции' 
      },
      { status: 500 }
    );
  }
}