import { cloudinaryService } from './cloudinary';
import path from 'path';
import fs from 'fs/promises';

// Типы для конфигурации fallback
export interface FallbackConfig {
  localStoragePath: string;
  publicPath: string;
  enableCaching: boolean;
  cacheMaxAge: number; // в секундах
  fallbackImages: {
    [key: string]: string; // placeholder изображения
  };
  retryAttempts: number;
  retryDelay: number; // в миллисекундах
}

// Конфигурация по умолчанию
const defaultConfig: FallbackConfig = {
  localStoragePath: './public/uploads/images',
  publicPath: '/uploads/images',
  enableCaching: true,
  cacheMaxAge: 3600, // 1 час
  fallbackImages: {
    product: '/assets/images/product-placeholder.jpg',
    avatar: '/assets/images/avatar-placeholder.jpg',
    gallery: '/assets/images/gallery-placeholder.jpg',
    blog: '/assets/images/blog-placeholder.jpg',
    general: '/assets/images/placeholder.jpg',
  },
  retryAttempts: 3,
  retryDelay: 1000,
};

// Статус доступности Cloudinary
interface CloudinaryStatus {
  isAvailable: boolean;
  lastCheck: number;
  failCount: number;
  nextRetry: number;
}

export class ImageFallbackManager {
  private static instance: ImageFallbackManager;
  private config: FallbackConfig;
  private cloudinaryStatus: CloudinaryStatus;
  private cache: Map<string, { url: string; timestamp: number }>;

  private constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.cloudinaryStatus = {
      isAvailable: true,
      lastCheck: 0,
      failCount: 0,
      nextRetry: 0,
    };
    this.cache = new Map();
  }

  public static getInstance(config?: Partial<FallbackConfig>): ImageFallbackManager {
    if (!ImageFallbackManager.instance) {
      ImageFallbackManager.instance = new ImageFallbackManager(config);
    }
    return ImageFallbackManager.instance;
  }

  // Проверка доступности Cloudinary
  async checkCloudinaryAvailability(): Promise<boolean> {
    const now = Date.now();

    // Если недавно проверяли и сервис недоступен, ждем до следующей попытки
    if (!this.cloudinaryStatus.isAvailable && now < this.cloudinaryStatus.nextRetry) {
      return false;
    }

    // Если недавно проверяли и сервис доступен, возвращаем кешированный результат
    if (this.cloudinaryStatus.isAvailable && (now - this.cloudinaryStatus.lastCheck) < 30000) {
      return true;
    }

    try {
      // Проверяем конфигурацию
      if (!cloudinaryService.isConfigured()) {
        this.updateCloudinaryStatus(false);
        return false;
      }

      // Пробуем получить информацию об изображении или сделать простой запрос
      await cloudinaryService.listImages('test', 1);
      
      this.updateCloudinaryStatus(true);
      return true;
    } catch (error) {
      console.warn('Cloudinary недоступен:', error);
      this.updateCloudinaryStatus(false);
      return false;
    }
  }

  // Обновление статуса Cloudinary
  private updateCloudinaryStatus(isAvailable: boolean): void {
    const now = Date.now();
    this.cloudinaryStatus.lastCheck = now;

    if (isAvailable) {
      this.cloudinaryStatus.isAvailable = true;
      this.cloudinaryStatus.failCount = 0;
      this.cloudinaryStatus.nextRetry = 0;
    } else {
      this.cloudinaryStatus.isAvailable = false;
      this.cloudinaryStatus.failCount++;
      
      // Экспоненциальный backoff для повторных попыток
      const backoffDelay = Math.min(
        this.config.retryDelay * Math.pow(2, this.cloudinaryStatus.failCount - 1),
        300000 // максимум 5 минут
      );
      this.cloudinaryStatus.nextRetry = now + backoffDelay;
    }
  }

  // Получение URL изображения с fallback
  async getImageUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
      fallbackType?: keyof FallbackConfig['fallbackImages'];
      useCache?: boolean;
    } = {}
  ): Promise<string> {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      fallbackType = 'general',
      useCache = true,
    } = options;

    // Создаем ключ для кеша
    const cacheKey = `${src}_${width}_${height}_${crop}_${quality}_${format}`;

    // Проверяем кеш
    if (useCache && this.config.enableCaching) {
      const cached = this.getCachedUrl(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Проверяем доступность Cloudinary
      const isCloudinaryAvailable = await this.checkCloudinaryAvailability();

      if (isCloudinaryAvailable) {
        // Пробуем получить URL от Cloudinary
        const cloudinaryUrl = await this.getCloudinaryUrl(src, options);
        
        // Проверяем доступность URL
        const isUrlAccessible = await this.checkUrlAccessibility(cloudinaryUrl);
        
        if (isUrlAccessible) {
          if (useCache) {
            this.setCachedUrl(cacheKey, cloudinaryUrl);
          }
          return cloudinaryUrl;
        }
      }

      // Если Cloudinary недоступен, пробуем локальную копию
      const localUrl = await this.getLocalImageUrl(src, options);
      if (localUrl) {
        if (useCache) {
          this.setCachedUrl(cacheKey, localUrl);
        }
        return localUrl;
      }

      // Если ничего не найдено, возвращаем placeholder
      const placeholderUrl = this.getPlaceholderUrl(fallbackType, options);
      return placeholderUrl;

    } catch (error) {
      console.warn('Ошибка получения изображения:', error);
      return this.getPlaceholderUrl(fallbackType, options);
    }
  }

  // Получение URL от Cloudinary
  private async getCloudinaryUrl(
    src: string,
    options: any
  ): Promise<string> {
    const { width, height, crop, quality, format } = options;
    
    // Извлекаем public_id из URL или используем src как public_id
    const publicId = src.includes('cloudinary.com') 
      ? this.extractPublicIdFromUrl(src)
      : src;

    if (!publicId) {
      throw new Error('Не удалось извлечь public_id');
    }

    return cloudinaryService.generateOptimizedUrl(publicId, {
      width,
      height,
      crop,
      quality,
      format,
    });
  }

  // Получение локального URL изображения
  private async getLocalImageUrl(
    src: string,
    options: any
  ): Promise<string | null> {
    try {
      // Генерируем имя файла на основе src и параметров
      const fileName = this.generateLocalFileName(src, options);
      const localPath = path.join(this.config.localStoragePath, fileName);
      
      // Проверяем существование файла
      try {
        await fs.access(localPath);
        return path.join(this.config.publicPath, fileName).replace(/\\/g, '/');
      } catch {
        return null;
      }
    } catch (error) {
      console.warn('Ошибка проверки локального файла:', error);
      return null;
    }
  }

  // Получение URL placeholder'а
  private getPlaceholderUrl(
    fallbackType: keyof FallbackConfig['fallbackImages'],
    options: any
  ): string {
    const placeholderPath = this.config.fallbackImages[fallbackType] || this.config.fallbackImages.general;
    
    // Если есть размеры, можем сгенерировать SVG placeholder
    if (options.width && options.height) {
      return this.generateSvgPlaceholder(Number(options.width), Number(options.height), String(fallbackType));
    }
    
    return placeholderPath;
  }

  // Генерация SVG placeholder'а
  private generateSvgPlaceholder(width: number, height: number, type: string): string {
    const colors = {
      product: '#f3f4f6',
      avatar: '#e5e7eb',
      gallery: '#f9fafb',
      blog: '#f3f4f6',
      general: '#f3f4f6',
    };

    const color = colors[type as keyof typeof colors] || colors.general;
    const textColor = '#9ca3af';

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" text-anchor="middle" dy=".3em">
          ${width} × ${height}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  // Проверка доступности URL
  private async checkUrlAccessibility(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 секунд timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Извлечение public_id из Cloudinary URL
  private extractPublicIdFromUrl(url: string): string | null {
    const match = url.match(/\/v\d+\/([^.]+)/);
    return match ? match[1] : null;
  }

  // Генерация имени локального файла
  private generateLocalFileName(src: string, options: any): string {
    const { width, height, crop, quality, format } = options;
    
    // Создаем хеш на основе параметров
    const publicId = src.includes('cloudinary.com') 
      ? this.extractPublicIdFromUrl(src) 
      : src;
    
    const params = `${width || 'auto'}_${height || 'auto'}_${crop || 'fill'}_${quality || 'auto'}_${format || 'auto'}`;
    const hash = Buffer.from(`${publicId}_${params}`).toString('base64').replace(/[/+=]/g, '');
    
    const extension = format && format !== 'auto' ? format : 'jpg';
    return `${hash}.${extension}`;
  }

  // Кеширование URL
  private setCachedUrl(key: string, url: string): void {
    if (!this.config.enableCaching) return;
    
    this.cache.set(key, {
      url,
      timestamp: Date.now(),
    });

    // Очищаем старые записи из кеша
    this.cleanupCache();
  }

  // Получение URL из кеша
  private getCachedUrl(key: string): string | null {
    if (!this.config.enableCaching) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;

    const maxAge = this.config.cacheMaxAge * 1000;
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.url;
  }

  // Очистка старых записей из кеша
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = this.config.cacheMaxAge * 1000;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  // Предварительная загрузка изображения в локальное хранилище
  async preloadImageToLocal(
    src: string,
    options: any = {}
  ): Promise<string | null> {
    try {
      const cloudinaryUrl = await this.getCloudinaryUrl(src, options);
      const fileName = this.generateLocalFileName(src, options);
      const localPath = path.join(this.config.localStoragePath, fileName);

      // Создаем директорию если не существует
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      // Загружаем изображение
      const response = await fetch(cloudinaryUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      await fs.writeFile(localPath, Buffer.from(buffer));

      return path.join(this.config.publicPath, fileName).replace(/\\/g, '/');
    } catch (error) {
      console.warn('Ошибка предварительной загрузки:', error);
      return null;
    }
  }

  // Пакетная предварительная загрузка
  async batchPreloadToLocal(
    images: Array<{ src: string; options?: any }>,
    concurrency: number = 3
  ): Promise<Array<{ src: string; localUrl: string | null; error?: string }>> {
    const results: Array<{ src: string; localUrl: string | null; error?: string }> = [];

    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async ({ src, options = {} }) => {
        try {
          const localUrl = await this.preloadImageToLocal(src, options);
          return { src, localUrl };
        } catch (error: any) {
          return { src, localUrl: null, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Очистка локального кеша
  async clearLocalCache(olderThanDays: number = 7): Promise<{ deleted: number; errors: string[] }> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    let deleted = 0;
    const errors: string[] = [];

    try {
      const files = await fs.readdir(this.config.localStoragePath);
      
      for (const file of files) {
        try {
          const filePath = path.join(this.config.localStoragePath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            deleted++;
          }
        } catch (error: any) {
          errors.push(`Ошибка обработки файла ${file}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Ошибка чтения директории: ${error.message}`);
    }

    return { deleted, errors };
  }

  // Получение статистики fallback системы
  getStats(): {
    cloudinaryStatus: CloudinaryStatus;
    cacheSize: number;
    config: FallbackConfig;
  } {
    return {
      cloudinaryStatus: { ...this.cloudinaryStatus },
      cacheSize: this.cache.size,
      config: { ...this.config },
    };
  }

  // Сброс статуса Cloudinary (для принудительной проверки)
  resetCloudinaryStatus(): void {
    this.cloudinaryStatus = {
      isAvailable: true,
      lastCheck: 0,
      failCount: 0,
      nextRetry: 0,
    };
  }

  // Очистка кеша URL
  clearUrlCache(): void {
    this.cache.clear();
  }
}

// Хук для использования в React компонентах
export function useImageFallback() {
  const fallbackManager = ImageFallbackManager.getInstance();

  const getImageUrl = async (
    src: string,
    options: Parameters<typeof fallbackManager.getImageUrl>[1] = {}
  ) => {
    return fallbackManager.getImageUrl(src, options);
  };

  const checkStatus = async () => {
    return fallbackManager.checkCloudinaryAvailability();
  };

  const getStats = () => {
    return fallbackManager.getStats();
  };

  return {
    getImageUrl,
    checkStatus,
    getStats,
    preloadToLocal: fallbackManager.preloadImageToLocal.bind(fallbackManager),
    clearCache: fallbackManager.clearUrlCache.bind(fallbackManager),
  };
}

// Экспорт экземпляра по умолчанию
export const imageFallbackManager = ImageFallbackManager.getInstance();

export default imageFallbackManager;