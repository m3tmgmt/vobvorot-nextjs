'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cloudinaryService, cloudinaryHelpers } from '@/lib/cloudinary';
import { imageFallbackManager } from '@/lib/image-fallback';

interface CloudinaryImageProps {
  src: string; // URL или public_id
  alt: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'pad' | 'limit' | 'mfit' | 'mpad';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'gif' | 'svg';
  className?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
  effects?: string[];
  transformations?: any[];
  fallbackSrc?: string;
  fallbackType?: 'product' | 'avatar' | 'gallery' | 'blog' | 'general';
  placeholder?: 'blur' | 'empty' | string;
  enableFallback?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
  responsive?: boolean;
  breakpoints?: {
    [key: string]: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
    };
  };
}

export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  crop = 'fill',
  quality = 'auto',
  format = 'auto',
  className = '',
  loading = 'lazy',
  sizes,
  priority = false,
  effects = [],
  transformations = [],
  fallbackSrc,
  fallbackType = 'general',
  placeholder = 'blur',
  enableFallback = true,
  onLoad,
  onError,
  onClick,
  style,
  responsive = false,
  breakpoints,
}: CloudinaryImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Проверяем, является ли src URL от Cloudinary или public_id
  const isCloudinaryUrl = cloudinaryHelpers.isCloudinaryUrl(src);
  const publicId = isCloudinaryUrl ? cloudinaryHelpers.extractPublicId(src) : src;

  // Генерация оптимизированного URL
  const generateImageUrl = (
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
      effects?: string[];
      responsive?: boolean;
    } = {}
  ): string => {
    // Если Cloudinary не настроен, возвращаем исходный URL или fallback
    if (!cloudinaryService.isConfigured()) {
      return isCloudinaryUrl ? src : (fallbackSrc || src);
    }

    // Если это уже готовый URL, возвращаем его
    if (isCloudinaryUrl && !options.width && !options.height && !options.effects?.length) {
      return src;
    }

    try {
      return cloudinaryService.generateOptimizedUrl(publicId, options);
    } catch (error) {
      console.warn('Ошибка генерации Cloudinary URL:', error);
      return fallbackSrc || src;
    }
  };

  // Генерация responsive srcSet
  const generateSrcSet = (): string => {
    if (!cloudinaryService.isConfigured() || !responsive || !publicId) {
      return '';
    }

    const standardBreakpoints = breakpoints || {
      '320w': { width: 320 },
      '640w': { width: 640 },
      '768w': { width: 768 },
      '1024w': { width: 1024 },
      '1280w': { width: 1280 },
      '1536w': { width: 1536 },
    };

    const srcSetParts = Object.entries(standardBreakpoints).map(([descriptor, options]) => {
      const url = generateImageUrl(publicId, {
        ...options,
        crop,
        quality,
        format,
        effects,
      });
      return `${url} ${descriptor}`;
    });

    return srcSetParts.join(', ');
  };

  // Генерация placeholder
  const generatePlaceholder = (): string => {
    if (placeholder === 'empty') {
      return '';
    }

    if (typeof placeholder === 'string' && placeholder !== 'blur') {
      return placeholder;
    }

    if (placeholder === 'blur' && cloudinaryService.isConfigured() && publicId) {
      // Генерируем размытую версию изображения для placeholder
      return cloudinaryService.generateOptimizedUrl(publicId, {
        width: 40,
        height: 30,
        crop: 'fill',
        quality: 1,
        effects: ['blur:1000'],
      });
    }

    // Fallback placeholder
    return cloudinaryHelpers.generatePlaceholder(width || 400, height || 300);
  };

  // Intersection Observer для lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) {
      setIsIntersecting(true);
      return;
    }

    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, priority]);

  // Генерация URL при изменении параметров
  useEffect(() => {
    if (!isIntersecting && !priority) {
      return;
    }

    if (!publicId) {
      setHasError(true);
      onError?.(new Error('Не указан publicId или src изображения'));
      return;
    }

    const getOptimalImageUrl = async () => {
      try {
        let url: string;

        if (enableFallback) {
          // Используем fallback систему
          url = await imageFallbackManager.getImageUrl(src, {
            width,
            height,
            crop,
            quality,
            format,
            fallbackType,
          });
        } else {
          // Используем только Cloudinary
          url = generateImageUrl(publicId, {
            width,
            height,
            crop,
            quality,
            format,
            effects,
          });
        }

        setImageUrl(url);
      } catch (error: any) {
        console.error('Ошибка генерации URL изображения:', error);
        setHasError(true);
        onError?.(error);
      }
    };

    getOptimalImageUrl();
  }, [
    isIntersecting,
    priority,
    publicId,
    src,
    width,
    height,
    crop,
    quality,
    format,
    effects,
    transformations,
    enableFallback,
    fallbackType,
  ]);

  // Обработка загрузки изображения
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Обработка ошибки загрузки
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Пробуем fallback
    if (fallbackSrc && imageUrl !== fallbackSrc) {
      setImageUrl(fallbackSrc);
      setHasError(false);
    } else {
      onError?.(new Error('Ошибка загрузки изображения'));
    }
  };

  // Стили для placeholder
  const placeholderStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    ...style,
  };

  // Если изображение еще не пересекло viewport и не priority
  if (!isIntersecting && !priority) {
    return (
      <div
        ref={imgRef}
        className={className}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          ...placeholderStyle,
        }}
      >
        {placeholder !== 'empty' && 'Загрузка...'}
      </div>
    );
  }

  // Если произошла ошибка и нет fallback
  if (hasError && (!fallbackSrc || imageUrl === fallbackSrc)) {
    return (
      <div
        className={className}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          ...placeholderStyle,
        }}
        onClick={onClick}
      >
        Изображение недоступно
      </div>
    );
  }

  // Основное изображение
  return (
    <div className={`relative ${className}`} style={style} onClick={onClick}>
      {/* Placeholder во время загрузки */}
      {isLoading && placeholder !== 'empty' && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            ...placeholderStyle,
            backgroundImage: placeholder === 'blur' ? `url(${generatePlaceholder()})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {placeholder !== 'blur' && 'Загрузка...'}
        </div>
      )}

      {/* Основное изображение */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        srcSet={responsive ? generateSrcSet() : undefined}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          objectFit: crop === 'fill' ? 'cover' : 'contain',
        }}
      />
    </div>
  );
}

// Хук для работы с Cloudinary изображениями
export function useCloudinaryImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
    effects?: string[];
  } = {}
) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) {
      setError(new Error('Не указан src изображения'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const isCloudinaryUrl = cloudinaryHelpers.isCloudinaryUrl(src);
      const publicId = isCloudinaryUrl ? cloudinaryHelpers.extractPublicId(src) : src;

      if (!publicId) {
        throw new Error('Не удалось извлечь public_id из URL');
      }

      if (!cloudinaryService.isConfigured()) {
        setImageUrl(src);
        setIsLoading(false);
        return;
      }

      const url = cloudinaryService.generateOptimizedUrl(publicId, options);
      setImageUrl(url);
      setIsLoading(false);
    } catch (err: any) {
      setError(err);
      setImageUrl(src); // Fallback к исходному URL
      setIsLoading(false);
    }
  }, [src, JSON.stringify(options)]);

  return { imageUrl, isLoading, error };
}