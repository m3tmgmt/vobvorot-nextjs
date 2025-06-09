import { v2 as cloudinary } from 'cloudinary';

// Конфигурация Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Типы для опций загрузки
export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: Array<{
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  }>;
  tags?: string[];
  overwrite?: boolean;
  unique_filename?: boolean;
  use_filename?: boolean;
  filename_override?: string;
}

// Типы для результата загрузки
export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
}

// Класс для работы с Cloudinary
export class CloudinaryService {
  private static instance: CloudinaryService;

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  // Проверка конфигурации
  public isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  // Загрузка изображения из буфера
  public async uploadFromBuffer(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован. Проверьте переменные окружения.');
    }

    const defaultOptions = {
      folder: 'vobvorot-store',
      resource_type: 'image' as const,
      unique_filename: true,
      overwrite: false,
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    };

    const uploadOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(new Error('Неизвестная ошибка при загрузке в Cloudinary'));
          }
        }
      ).end(buffer);
    });
  }

  // Загрузка изображения по URL
  public async uploadFromUrl(
    url: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован. Проверьте переменные окружения.');
    }

    const defaultOptions = {
      folder: 'vobvorot-store',
      unique_filename: true,
      overwrite: false,
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    };

    const uploadOptions = { ...defaultOptions, ...options };

    try {
      const result = await cloudinary.uploader.upload(url, uploadOptions);
      return result as CloudinaryUploadResult;
    } catch (error) {
      throw new Error(`Ошибка загрузки из URL: ${error}`);
    }
  }

  // Удаление изображения
  public async deleteImage(publicId: string): Promise<{ result: string }> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован. Проверьте переменные окружения.');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Ошибка удаления изображения: ${error}`);
    }
  }

  // Генерация оптимизированного URL
  public generateOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
      effects?: string[];
    } = {}
  ): string {
    if (!this.isConfigured()) {
      return ''; // Возвращаем пустую строку если Cloudinary не настроен
    }

    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      effects = [],
    } = options;

    const transformation: any = {
      quality,
      fetch_format: format,
    };

    if (width) transformation.width = width;
    if (height) transformation.height = height;
    if (width || height) transformation.crop = crop;

    // Добавляем эффекты
    if (effects.length > 0) {
      transformation.effect = effects.join(',');
    }

    return cloudinary.url(publicId, {
      transformation: [transformation],
      secure: true,
    });
  }

  // Получение информации об изображении
  public async getImageInfo(publicId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован. Проверьте переменные окружения.');
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      throw new Error(`Ошибка получения информации об изображении: ${error}`);
    }
  }

  // Список изображений в папке
  public async listImages(
    folder: string = 'vobvorot-store',
    maxResults: number = 30
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован. Проверьте переменные окружения.');
    }

    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: maxResults,
        resource_type: 'image',
      });
      return result;
    } catch (error) {
      throw new Error(`Ошибка получения списка изображений: ${error}`);
    }
  }

  // Массовое удаление изображений
  public async bulkDelete(publicIds: string[]): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован. Проверьте переменные окружения.');
    }

    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new Error(`Ошибка массового удаления: ${error}`);
    }
  }

  // Создание архива изображений
  public async createArchive(
    publicIds: string[],
    options: {
      type?: string;
      mode?: string;
      target_format?: string;
    } = {}
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован. Проверьте переменные окружения.');
    }

    const defaultOptions = {
      type: 'upload',
      mode: 'create',
      target_format: 'zip',
    };

    const archiveOptions = { ...defaultOptions, ...options };

    try {
      // Note: archive_url might not be available in current Cloudinary version
      // TODO: Implement alternative archive functionality
      throw new Error('Archive functionality not implemented');
    } catch (error) {
      throw new Error(`Ошибка создания архива: ${error}`);
    }
  }
}

// Экспорт экземпляра сервиса
export const cloudinaryService = CloudinaryService.getInstance();

// Экспорт основного объекта cloudinary для прямого использования
export { cloudinary };

// Хелперы для работы с URL
export const cloudinaryHelpers = {
  // Извлечение public_id из Cloudinary URL
  extractPublicId: (url: string): string | null => {
    const match = url.match(/\/v\d+\/([^.]+)/);
    return match ? match[1] : null;
  },

  // Проверка, является ли URL от Cloudinary
  isCloudinaryUrl: (url: string): boolean => {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  },

  // Генерация плейсхолдера для изображения
  generatePlaceholder: (width: number = 400, height: number = 300): string => {
    if (!cloudinaryService.isConfigured()) {
      return `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
            Изображение недоступно
          </text>
        </svg>
      `).toString('base64')}`;
    }

    return cloudinary.url('placeholder', {
      transformation: [
        {
          width,
          height,
          crop: 'fill',
          background: 'auto',
          color: '#f3f4f6',
        },
      ],
      secure: true,
    });
  },
};