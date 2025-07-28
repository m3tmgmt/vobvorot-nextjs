import { Bot, Context } from 'grammy';
import { cloudinaryService } from './cloudinary';

interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

interface TelegramPhoto extends TelegramFile {
  width: number;
  height: number;
}

export class TelegramCloudinaryIntegration {
  private bot: Bot;
  private telegramApiUrl: string;
  
  constructor(bot: Bot, botToken: string) {
    this.bot = bot;
    this.telegramApiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  // Получение информации о файле от Telegram
  async getFileInfo(fileId: string): Promise<TelegramFile> {
    const response = await fetch(`${this.telegramApiUrl}/getFile?file_id=${fileId}`);
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Ошибка получения файла: ${result.description}`);
    }
    
    return result.result;
  }

  // Скачивание файла от Telegram
  async downloadFile(filePath: string): Promise<Buffer> {
    const fileUrl = `https://api.telegram.org/file/bot${this.bot.token}/${filePath}`;
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Ошибка скачивания файла: ${response.statusText}`);
    }
    
    return Buffer.from(await response.arrayBuffer());
  }

  // Загрузка фото из Telegram в Cloudinary
  async uploadPhotoToCloudinary(
    photo: TelegramPhoto,
    options: {
      folder?: string;
      tags?: string[];
      public_id?: string;
      originalFilename?: string;
    } = {}
  ): Promise<any> {
    try {
      // Получаем информацию о файле
      const fileInfo = await this.getFileInfo(photo.file_id);
      
      if (!fileInfo.file_path) {
        throw new Error('Не удалось получить путь к файлу');
      }

      // Скачиваем файл
      const fileBuffer = await this.downloadFile(fileInfo.file_path);

      // Подготавливаем опции для загрузки
      const uploadOptions = {
        folder: options.folder || 'telegram-uploads',
        tags: [
          ...(options.tags || []),
          'telegram',
          `size_${photo.width}x${photo.height}`,
          `file_id_${photo.file_unique_id}`,
        ],
        public_id: options.public_id,
        original_filename: options.originalFilename || `telegram_${photo.file_unique_id}`,
        use_filename: true,
        unique_filename: !options.public_id,
        overwrite: false,
      };

      // Загружаем в Cloudinary
      const result = await cloudinaryService.uploadFromBuffer(fileBuffer, uploadOptions);

      console.log('✅ Фото успешно загружено в Cloudinary:', {
        public_id: result.public_id,
        url: result.secure_url,
        size: `${result.width}x${result.height}`,
        format: result.format,
        bytes: result.bytes,
      });

      return result;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки фото в Cloudinary:', error);
      throw error;
    }
  }

  // Обработка множественных фото
  async uploadMultiplePhotos(
    photos: TelegramPhoto[],
    options: {
      folder?: string;
      tags?: string[];
      basePublicId?: string;
    } = {}
  ): Promise<any[]> {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoOptions = {
        ...options,
        public_id: options.basePublicId ? `${options.basePublicId}_${i + 1}` : undefined,
        originalFilename: `photo_${i + 1}_${photo.file_unique_id}`,
      };

      try {
        const result = await this.uploadPhotoToCloudinary(photo, photoOptions);
        results.push(result);
      } catch (error: any) {
        console.error(`Ошибка загрузки фото ${i + 1}:`, error);
        results.push({ error: error.message, index: i });
      }
    }

    return results;
  }

  // Загрузка фото товара с автоматической оптимизацией
  async uploadProductPhoto(
    photo: TelegramPhoto,
    productId: string,
    options: {
      isMain?: boolean;
      tags?: string[];
    } = {}
  ): Promise<any> {
    const folder = `products/${productId}`;
    const publicId = options.isMain ? `${productId}_main` : undefined;
    
    const uploadOptions = {
      folder,
      tags: [
        ...(options.tags || []),
        'product',
        `product_${productId}`,
        options.isMain ? 'main_image' : 'gallery_image',
      ],
      public_id: publicId,
      originalFilename: `product_${productId}_${photo.file_unique_id}`,
    };

    const result = await this.uploadPhotoToCloudinary(photo, uploadOptions);

    // Генерируем оптимизированные версии для товара
    const optimizedUrls = {
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

    return {
      ...result,
      optimized_urls: optimizedUrls,
    };
  }

  // Создание превью для быстрого просмотра в Telegram
  async createTelegramPreview(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<string> {
    const previewOptions = {
      width: options.width || 400,
      height: options.height || 300,
      crop: 'fill',
      quality: options.quality || 70,
      format: 'jpg',
    };

    return cloudinaryService.generateOptimizedUrl(publicId, previewOptions);
  }

  // Получение статистики загруженных изображений
  async getUploadStats(folder: string = 'telegram-uploads'): Promise<any> {
    try {
      const result = await cloudinaryService.listImages(folder, 100);
      
      const stats = {
        total_images: result.resources.length,
        total_size: result.resources.reduce((sum: number, img: any) => sum + img.bytes, 0),
        by_format: {} as { [key: string]: number },
        by_month: {} as { [key: string]: number },
        recent_uploads: result.resources.slice(0, 10),
      };

      // Статистика по форматам
      result.resources.forEach((img: any) => {
        stats.by_format[img.format] = (stats.by_format[img.format] || 0) + 1;
        
        // Статистика по месяцам
        const month = new Date(img.created_at).toISOString().slice(0, 7);
        stats.by_month[month] = (stats.by_month[month] || 0) + 1;
      });

      return stats;
    } catch (error: any) {
      console.error('Ошибка получения статистики:', error);
      return { error: error.message };
    }
  }

  // Форматирование статистики для отправки в Telegram
  formatStatsForTelegram(stats: any): string {
    if (stats.error) {
      return `❌ Ошибка получения статистики: ${stats.error}`;
    }

    let message = `📊 *Статистика изображений*\n\n`;
    message += `📸 Всего изображений: ${stats.total_images}\n`;
    message += `💾 Общий размер: ${(stats.total_size / 1024 / 1024).toFixed(2)} MB\n\n`;

    if (Object.keys(stats.by_format).length > 0) {
      message += `📋 *По форматам:*\n`;
      Object.entries(stats.by_format).forEach(([format, count]) => {
        message += `• ${format.toUpperCase()}: ${count}\n`;
      });
      message += '\n';
    }

    if (Object.keys(stats.by_month).length > 0) {
      message += `📅 *По месяцам:*\n`;
      Object.entries(stats.by_month)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6)
        .forEach(([month, count]) => {
          const date = new Date(month + '-01');
          const monthName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
          message += `• ${monthName}: ${count}\n`;
        });
    }

    return message;
  }

  // Очистка старых временных файлов
  async cleanupOldUploads(
    folder: string = 'telegram-uploads/temp',
    olderThanDays: number = 7
  ): Promise<{ deleted: number; errors: string[] }> {
    try {
      const result = await cloudinaryService.listImages(folder, 100);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldImages = result.resources.filter((img: any) => {
        return new Date(img.created_at) < cutoffDate;
      });

      if (oldImages.length === 0) {
        return { deleted: 0, errors: [] };
      }

      const publicIds = oldImages.map((img: any) => img.public_id);
      const deleteResult = await cloudinaryService.bulkDelete(publicIds);

      return {
        deleted: Object.keys(deleteResult.deleted || {}).length,
        errors: deleteResult.not_found || [],
      };
    } catch (error: any) {
      console.error('Ошибка очистки старых файлов:', error);
      return { deleted: 0, errors: [error.message] };
    }
  }

  // Проверка доступности Cloudinary
  async checkCloudinaryStatus(): Promise<{ available: boolean; message: string }> {
    try {
      if (!cloudinaryService.isConfigured()) {
        return {
          available: false,
          message: 'Cloudinary не сконфигурирован. Проверьте переменные окружения.',
        };
      }

      // Пробуем получить список изображений для проверки подключения
      await cloudinaryService.listImages('test', 1);
      
      return {
        available: true,
        message: 'Cloudinary доступен и работает корректно.',
      };
    } catch (error: any) {
      return {
        available: false,
        message: `Ошибка подключения к Cloudinary: ${error.message}`,
      };
    }
  }
}

// Хелперы для работы с Telegram типами фото
export const telegramPhotoHelpers = {
  // Получение фото лучшего качества из массива
  getBestQualityPhoto: (photos: TelegramPhoto[]): TelegramPhoto => {
    return photos.reduce((best, current) => {
      const bestArea = best.width * best.height;
      const currentArea = current.width * current.height;
      return currentArea > bestArea ? current : best;
    });
  },

  // Получение всех фото, отсортированных по качеству
  sortPhotosByQuality: (photos: TelegramPhoto[]): TelegramPhoto[] => {
    return photos.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  },

  // Получение информации о фото
  getPhotoInfo: (photo: TelegramPhoto): string => {
    const size = photo.file_size ? ` (${(photo.file_size / 1024).toFixed(1)} KB)` : '';
    return `${photo.width}×${photo.height}${size}`;
  },

  // Проверка минимального размера фото
  isPhotoQualityGood: (photo: TelegramPhoto, minWidth: number = 300, minHeight: number = 300): boolean => {
    return photo.width >= minWidth && photo.height >= minHeight;
  },
};

export default TelegramCloudinaryIntegration;