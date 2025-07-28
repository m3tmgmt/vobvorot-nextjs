import { cloudinaryService } from './cloudinary';

// Типы для настроек оптимизации
export interface OptimizationPreset {
  name: string;
  description: string;
  transformations: {
    [key: string]: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
      effects?: string[];
    };
  };
}

// Предустановки оптимизации для разных типов контента
export const optimizationPresets: { [key: string]: OptimizationPreset } = {
  product: {
    name: 'Product Images',
    description: 'Оптимизация для изображений товаров',
    transformations: {
      thumbnail: {
        width: 150,
        height: 150,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      small: {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      medium: {
        width: 600,
        height: 600,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      large: {
        width: 1200,
        height: 1200,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      hero: {
        width: 1920,
        height: 1080,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
    },
  },
  avatar: {
    name: 'Avatar Images',
    description: 'Оптимизация для аватаров пользователей',
    transformations: {
      small: {
        width: 32,
        height: 32,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
        effects: ['sharpen'],
      },
      medium: {
        width: 64,
        height: 64,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
        effects: ['sharpen'],
      },
      large: {
        width: 128,
        height: 128,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
        effects: ['sharpen'],
      },
    },
  },
  gallery: {
    name: 'Gallery Images',
    description: 'Оптимизация для галереи изображений',
    transformations: {
      thumbnail: {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      medium: {
        width: 800,
        height: 600,
        crop: 'fit',
        quality: 'auto',
        format: 'auto',
      },
      large: {
        width: 1600,
        height: 1200,
        crop: 'fit',
        quality: 'auto',
        format: 'auto',
      },
      watermarked: {
        width: 1600,
        height: 1200,
        crop: 'fit',
        quality: 'auto',
        format: 'auto',
        effects: ['overlay:watermark_transparent:50'],
      },
    },
  },
  blog: {
    name: 'Blog Images',
    description: 'Оптимизация для изображений блога',
    transformations: {
      thumbnail: {
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      content: {
        width: 800,
        height: 600,
        crop: 'fit',
        quality: 'auto',
        format: 'auto',
      },
      hero: {
        width: 1200,
        height: 630,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
    },
  },
  social: {
    name: 'Social Media',
    description: 'Оптимизация для социальных сетей',
    transformations: {
      facebook_post: {
        width: 1200,
        height: 630,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      instagram_post: {
        width: 1080,
        height: 1080,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      instagram_story: {
        width: 1080,
        height: 1920,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
      twitter_post: {
        width: 1200,
        height: 675,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
    },
  },
};

// Класс для автоматической оптимизации изображений
export class ImageOptimizer {
  private static instance: ImageOptimizer;

  public static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Генерация оптимизированных версий изображения
  async generateOptimizedVersions(
    publicId: string,
    preset: string = 'product',
    customTransformations?: { [key: string]: any }
  ): Promise<{ [key: string]: string }> {
    if (!cloudinaryService.isConfigured()) {
      throw new Error('Cloudinary не сконфигурирован');
    }

    const presetConfig = optimizationPresets[preset];
    if (!presetConfig) {
      throw new Error(`Неизвестная предустановка: ${preset}`);
    }

    const transformations = customTransformations || presetConfig.transformations;
    const optimizedUrls: { [key: string]: string } = {};

    for (const [sizeName, transformation] of Object.entries(transformations)) {
      try {
        optimizedUrls[sizeName] = cloudinaryService.generateOptimizedUrl(
          publicId,
          transformation
        );
      } catch (error) {
        console.warn(`Ошибка генерации URL для размера ${sizeName}:`, error);
        optimizedUrls[sizeName] = '';
      }
    }

    return optimizedUrls;
  }

  // Автоматическое определение оптимального формата
  getOptimalFormat(originalFormat: string, useWebP: boolean = true): string {
    const format = originalFormat.toLowerCase();
    
    // Для прозрачных изображений сохраняем PNG
    if (format === 'png' && !useWebP) {
      return 'png';
    }
    
    // Для анимированных изображений сохраняем GIF
    if (format === 'gif') {
      return 'gif';
    }
    
    // Для всех остальных используем auto (Cloudinary выберет оптимальный)
    return 'auto';
  }

  // Автоматическое определение оптимального качества
  getOptimalQuality(width: number, height: number): string | number {
    const area = width * height;
    
    // Для маленьких изображений используем высокое качество
    if (area < 100000) { // меньше 316x316
      return 'auto:best';
    }
    
    // Для средних изображений используем автоматическое качество
    if (area < 1000000) { // меньше 1000x1000
      return 'auto:good';
    }
    
    // Для больших изображений используем экономичное качество
    return 'auto:eco';
  }

  // Интеллектуальная обрезка для разных соотношений сторон
  getSmartCrop(targetWidth: number, targetHeight: number, sourceWidth: number, sourceHeight: number): string {
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = sourceWidth / sourceHeight;
    
    // Если соотношения сторон близки, используем обычную обрезку
    if (Math.abs(targetRatio - sourceRatio) < 0.1) {
      return 'fill';
    }
    
    // Если целевое изображение более квадратное
    if (targetRatio > sourceRatio) {
      return 'lfill'; // Заполнить с фокусом на важные объекты
    }
    
    // Если исходное изображение более квадратное
    return 'fill';
  }

  // Применение эффектов в зависимости от типа изображения
  getAppropriateEffects(preset: string, sizeName: string): string[] {
    const effects: string[] = [];
    
    switch (preset) {
      case 'product':
        if (sizeName === 'thumbnail') {
          effects.push('sharpen:100');
        }
        break;
        
      case 'avatar':
        effects.push('sharpen:80');
        if (sizeName === 'small') {
          effects.push('contrast:10');
        }
        break;
        
      case 'gallery':
        if (sizeName === 'thumbnail') {
          effects.push('sharpen:50');
        }
        break;
        
      case 'blog':
        if (sizeName === 'hero') {
          effects.push('saturation:10');
        }
        break;
    }
    
    return effects;
  }

  // Создание адаптивных изображений для различных устройств
  generateResponsiveVersions(
    publicId: string,
    baseWidth: number = 800,
    aspectRatio: number = 16/9
  ): { [key: string]: string } {
    const breakpoints = [320, 640, 768, 1024, 1280, 1536, 1920];
    const responsiveUrls: { [key: string]: string } = {};

    for (const width of breakpoints) {
      if (width <= baseWidth * 2) { // Генерируем только разумные размеры
        const height = Math.round(width / aspectRatio);
        const key = `w${width}`;
        
        responsiveUrls[key] = cloudinaryService.generateOptimizedUrl(publicId, {
          width,
          height,
          crop: 'fill',
          quality: this.getOptimalQuality(width, height),
          format: 'auto',
        });
      }
    }

    return responsiveUrls;
  }

  // Генерация плейсхолдеров для ленивой загрузки
  generatePlaceholders(publicId: string): {
    blur: string;
    lowQuality: string;
    dominant: string;
  } {
    return {
      // Размытый плейсхолдер
      blur: cloudinaryService.generateOptimizedUrl(publicId, {
        width: 40,
        height: 30,
        crop: 'fill',
        quality: 1,
        effects: ['blur:1000'],
        format: 'jpg',
      }),
      
      // Низкокачественный плейсхолдер
      lowQuality: cloudinaryService.generateOptimizedUrl(publicId, {
        width: 100,
        height: 75,
        crop: 'fill',
        quality: 10,
        format: 'jpg',
      }),
      
      // Доминантный цвет (1x1 пиксель)
      dominant: cloudinaryService.generateOptimizedUrl(publicId, {
        width: 1,
        height: 1,
        crop: 'fill',
        quality: 1,
        format: 'jpg',
      }),
    };
  }

  // Оптимизация изображения с учетом контекста использования
  async optimizeForContext(
    publicId: string,
    context: {
      type: 'product' | 'avatar' | 'gallery' | 'blog' | 'social';
      device?: 'mobile' | 'tablet' | 'desktop';
      connection?: 'slow' | 'fast';
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<{
    optimized: { [key: string]: string };
    responsive: { [key: string]: string };
    placeholders: { [key: string]: string };
  }> {
    const { type, device = 'desktop', connection = 'fast', priority = 'normal' } = context;

    // Выбираем базовые трансформации
    let transformations = optimizationPresets[type]?.transformations || optimizationPresets.product.transformations;

    // Адаптируем под устройство
    if (device === 'mobile') {
      // Для мобильных устройств генерируем меньшие размеры
      transformations = Object.fromEntries(
        Object.entries(transformations).map(([key, transform]) => [
          key,
          {
            ...transform,
            width: Math.round((transform.width || 600) * 0.7),
            height: Math.round((transform.height || 600) * 0.7),
          }
        ])
      );
    }

    // Адаптируем под скорость соединения
    if (connection === 'slow') {
      transformations = Object.fromEntries(
        Object.entries(transformations).map(([key, transform]) => [
          key,
          {
            ...transform,
            quality: 'auto:eco',
            format: 'auto',
          }
        ])
      );
    }

    // Генерируем оптимизированные версии
    const optimized = await this.generateOptimizedVersions(publicId, type, transformations);

    // Генерируем адаптивные версии
    const baseWidth = transformations.medium?.width || 800;
    const responsive = this.generateResponsiveVersions(publicId, baseWidth);

    // Генерируем плейсхолдеры
    const placeholders = this.generatePlaceholders(publicId);

    return {
      optimized,
      responsive,
      placeholders,
    };
  }

  // Анализ и рекомендации по оптимизации
  analyzeImageOptimization(
    originalSize: number,
    originalWidth: number,
    originalHeight: number,
    originalFormat: string
  ): {
    recommendations: string[];
    estimatedSavings: number;
    optimalFormats: string[];
  } {
    const recommendations: string[] = [];
    let estimatedSavings = 0;
    const optimalFormats: string[] = [];

    // Анализ размера
    if (originalSize > 2 * 1024 * 1024) { // Больше 2MB
      recommendations.push('Изображение слишком большое, рекомендуется сжатие');
      estimatedSavings += 50;
    }

    // Анализ разрешения
    if (originalWidth > 2000 || originalHeight > 2000) {
      recommendations.push('Разрешение избыточно для веб-использования');
      estimatedSavings += 30;
    }

    // Анализ формата
    if (originalFormat.toLowerCase() === 'png' && originalSize > 500 * 1024) {
      recommendations.push('PNG можно заменить на JPEG для экономии размера');
      optimalFormats.push('jpg', 'webp');
      estimatedSavings += 40;
    } else if (originalFormat.toLowerCase() === 'jpg') {
      optimalFormats.push('webp', 'avif');
      estimatedSavings += 25;
    }

    // Общие рекомендации
    if (estimatedSavings === 0) {
      recommendations.push('Изображение уже хорошо оптимизировано');
    }

    return {
      recommendations,
      estimatedSavings: Math.min(estimatedSavings, 80), // Максимум 80% экономии
      optimalFormats,
    };
  }

  // Пакетная оптимизация изображений
  async batchOptimize(
    publicIds: string[],
    preset: string = 'product',
    options: {
      maxConcurrent?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<Array<{ publicId: string; optimized: any; error?: string }>> {
    const { maxConcurrent = 5, onProgress } = options;
    const results: Array<{ publicId: string; optimized: any; error?: string }> = [];

    // Обрабатываем изображения пакетами
    for (let i = 0; i < publicIds.length; i += maxConcurrent) {
      const batch = publicIds.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (publicId) => {
        try {
          const optimized = await this.generateOptimizedVersions(publicId, preset);
          return { publicId, optimized };
        } catch (error: any) {
          return { publicId, optimized: null, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Уведомляем о прогрессе
      onProgress?.(results.length, publicIds.length);
    }

    return results;
  }
}

// Экспорт экземпляра оптимизатора
export const imageOptimizer = ImageOptimizer.getInstance();

// Утилиты для работы с srcSet
export const srcSetUtils = {
  // Генерация srcSet строки
  generateSrcSet: (responsiveUrls: { [key: string]: string }): string => {
    return Object.entries(responsiveUrls)
      .map(([key, url]) => {
        const width = key.replace('w', '');
        return `${url} ${width}w`;
      })
      .join(', ');
  },

  // Генерация sizes атрибута
  generateSizes: (breakpoints: { [key: string]: string }): string => {
    return Object.entries(breakpoints)
      .map(([mediaQuery, size]) => `${mediaQuery} ${size}`)
      .join(', ');
  },

  // Стандартные sizes для различных layout
  commonSizes: {
    fullWidth: '100vw',
    halfWidth: '50vw',
    thirdWidth: '33vw',
    quarterWidth: '25vw',
    heroImage: '(max-width: 768px) 100vw, 80vw',
    productImage: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
    thumbnailGrid: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw',
  },
};

export default imageOptimizer;