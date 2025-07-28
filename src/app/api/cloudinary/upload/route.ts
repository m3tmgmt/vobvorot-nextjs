import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryService } from '@/lib/cloudinary';

// Максимальный размер файла (10MB)
const MAX_FILE_SIZE = parseInt(process.env.CLOUDINARY_MAX_FILE_SIZE || '10485760');

// Разрешенные форматы файлов
const ALLOWED_FORMATS = (process.env.CLOUDINARY_ALLOWED_FORMATS || 'jpg,jpeg,png,webp,gif')
  .split(',')
  .map(format => format.trim().toLowerCase());

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверка размера файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Размер файла превышает максимально допустимый (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` 
        },
        { status: 400 }
      );
    }

    // Проверка типа файла
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_FORMATS.includes(fileExtension)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Неподдерживаемый формат файла. Разрешены: ${ALLOWED_FORMATS.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Получаем дополнительные параметры
    const folder = formData.get('folder') as string || process.env.CLOUDINARY_UPLOAD_FOLDER || 'vobvorot-store';
    const tags = formData.get('tags') as string;
    const transformation = formData.get('transformation') as string;

    // Конвертируем файл в буфер
    const buffer = Buffer.from(await file.arrayBuffer());

    // Подготавливаем опции загрузки
    const uploadOptions: any = {
      folder,
      original_filename: file.name,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    // Добавляем теги если указаны
    if (tags) {
      uploadOptions.tags = tags.split(',').map((tag: string) => tag.trim());
    }

    // Добавляем трансформации если указаны
    if (transformation) {
      try {
        uploadOptions.transformation = JSON.parse(transformation);
      } catch (e) {
        console.warn('Неверный формат трансформации:', transformation);
      }
    }

    // Загружаем файл в Cloudinary
    const result = await cloudinaryService.uploadFromBuffer(buffer, uploadOptions);

    // Генерируем различные размеры изображения
    const urls = {
      original: result.secure_url,
      thumbnail: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 150,
        height: 150,
        crop: 'fill',
        quality: 'auto',
      }),
      small: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto',
      }),
      medium: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 600,
        height: 600,
        crop: 'fill',
        quality: 'auto',
      }),
      large: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 1200,
        height: 1200,
        crop: 'fill',
        quality: 'auto',
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        public_id: result.public_id,
        url: result.secure_url,
        urls,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        created_at: result.created_at,
        tags: result.tags,
        original_filename: result.original_filename,
      },
    });

  } catch (error: any) {
    console.error('Ошибка загрузки в Cloudinary:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при загрузке файла' 
      },
      { status: 500 }
    );
  }
}

// Загрузка по URL
export async function PUT(request: NextRequest) {
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
    const { url, folder, tags, transformation } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL не указан' },
        { status: 400 }
      );
    }

    // Подготавливаем опции загрузки
    const uploadOptions: any = {
      folder: folder || process.env.CLOUDINARY_UPLOAD_FOLDER || 'vobvorot-store',
      unique_filename: true,
      overwrite: false,
    };

    if (tags) {
      uploadOptions.tags = Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim());
    }

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    // Загружаем файл из URL
    const result = await cloudinaryService.uploadFromUrl(url, uploadOptions);

    // Генерируем различные размеры изображения
    const urls = {
      original: result.secure_url,
      thumbnail: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 150,
        height: 150,
        crop: 'fill',
        quality: 'auto',
      }),
      small: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto',
      }),
      medium: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 600,
        height: 600,
        crop: 'fill',
        quality: 'auto',
      }),
      large: cloudinaryService.generateOptimizedUrl(result.public_id, {
        width: 1200,
        height: 1200,
        crop: 'fill',
        quality: 'auto',
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        public_id: result.public_id,
        url: result.secure_url,
        urls,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        created_at: result.created_at,
        tags: result.tags,
        original_filename: result.original_filename,
      },
    });

  } catch (error: any) {
    console.error('Ошибка загрузки по URL в Cloudinary:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при загрузке файла по URL' 
      },
      { status: 500 }
    );
  }
}