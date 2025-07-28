'use client';

import React, { useState, useEffect, useRef } from 'react';
import CloudinaryImage from './CloudinaryImage';

interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

interface CloudinaryGalleryProps {
  images: GalleryImage[];
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: number;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
  showModal?: boolean;
  enableZoom?: boolean;
  lazy?: boolean;
  quality?: 'auto' | number;
  onImageClick?: (image: GalleryImage, index: number) => void;
}

export default function CloudinaryGallery({
  images,
  className = '',
  columns = 3,
  gap = 4,
  aspectRatio = 'square',
  showModal = true,
  enableZoom = true,
  lazy = true,
  quality = 'auto',
  onImageClick,
}: CloudinaryGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<{
    image: GalleryImage;
    index: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Определение размеров изображений в зависимости от колонок
  const getImageSize = () => {
    const baseWidth = 300;
    const baseHeight = aspectRatio === 'square' ? 300 : 
                     aspectRatio === 'portrait' ? 400 : 
                     aspectRatio === 'landscape' ? 200 : undefined;

    switch (columns) {
      case 1:
        return { width: baseWidth * 2, height: baseHeight ? baseHeight * 2 : undefined };
      case 2:
        return { width: baseWidth * 1.5, height: baseHeight ? baseHeight * 1.5 : undefined };
      case 3:
        return { width: baseWidth, height: baseHeight };
      case 4:
        return { width: Math.round(baseWidth * 0.8), height: baseHeight ? Math.round(baseHeight * 0.8) : undefined };
      case 5:
        return { width: Math.round(baseWidth * 0.6), height: baseHeight ? Math.round(baseHeight * 0.6) : undefined };
      case 6:
        return { width: Math.round(baseWidth * 0.5), height: baseHeight ? Math.round(baseHeight * 0.5) : undefined };
      default:
        return { width: baseWidth, height: baseHeight };
    }
  };

  const { width: imageWidth, height: imageHeight } = getImageSize();

  // Обработка клика на изображение
  const handleImageClick = (image: GalleryImage, index: number) => {
    onImageClick?.(image, index);
    
    if (showModal) {
      setSelectedImage({ image, index });
      setIsModalOpen(true);
    }
  };

  // Закрытие модального окна
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  // Навигация в модальном окне
  const navigateModal = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;

    const currentIndex = selectedImage.index;
    let newIndex;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    } else {
      newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    }

    setSelectedImage({
      image: images[newIndex],
      index: newIndex,
    });
  };

  // Обработка клавиш в модальном окне
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          navigateModal('prev');
          break;
        case 'ArrowRight':
          navigateModal('next');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedImage]);

  // Закрытие модального окна при клике вне изображения
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // CSS классы для сетки
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
  };

  const gapClasses: Record<number, string> = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <>
      {/* Галерея */}
      <div className={`cloudinary-gallery ${className}`}>
        <div className={`grid ${gridClasses[columns]} ${gapClasses[gap] || 'gap-4'}`}>
          {images.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105"
              onClick={() => handleImageClick(image, index)}
            >
              <CloudinaryImage
                src={image.src}
                alt={image.alt}
                width={imageWidth}
                height={imageHeight}
                quality={quality}
                loading={lazy ? 'lazy' : 'eager'}
                responsive={true}
                className="w-full h-full object-cover"
                placeholder="blur"
              />

              {/* Оверлей с информацией */}
              {(image.title || image.description) && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-end">
                  <div className="p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    {image.title && (
                      <h3 className="font-semibold text-lg mb-1">{image.title}</h3>
                    )}
                    {image.description && (
                      <p className="text-sm opacity-90">{image.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Иконка увеличения */}
              {enableZoom && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно */}
      {isModalOpen && selectedImage && showModal && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleModalClick}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Навигация */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigateModal('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => navigateModal('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Изображение */}
          <div className="max-w-full max-h-full flex flex-col items-center">
            <CloudinaryImage
              src={selectedImage.image.src}
              alt={selectedImage.image.alt}
              width={1200}
              height={800}
              crop="fit"
              quality="auto"
              loading="eager"
              className="max-w-full max-h-[80vh] object-contain"
            />

            {/* Информация под изображением */}
            {(selectedImage.image.title || selectedImage.image.description) && (
              <div className="mt-4 text-center text-white max-w-2xl">
                {selectedImage.image.title && (
                  <h2 className="text-2xl font-bold mb-2">{selectedImage.image.title}</h2>
                )}
                {selectedImage.image.description && (
                  <p className="text-gray-300">{selectedImage.image.description}</p>
                )}
              </div>
            )}

            {/* Счетчик изображений */}
            {images.length > 1 && (
              <div className="mt-4 text-white text-sm opacity-70">
                {selectedImage.index + 1} из {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Компонент для автоматической загрузки изображений из Cloudinary папки
interface CloudinaryFolderGalleryProps extends Omit<CloudinaryGalleryProps, 'images'> {
  folder: string;
  tags?: string[];
  maxImages?: number;
  sortBy?: 'created_at' | 'public_id' | 'uploaded_at';
  sortOrder?: 'asc' | 'desc';
}

export function CloudinaryFolderGallery({
  folder,
  tags = [],
  maxImages = 50,
  sortBy = 'created_at',
  sortOrder = 'desc',
  ...galleryProps
}: CloudinaryFolderGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          folder,
          max_results: maxImages.toString(),
        });

        if (tags.length > 0) {
          queryParams.append('tags', tags.join(','));
        }

        const response = await fetch(`/api/cloudinary/images?${queryParams}`);
        const result = await response.json();

        if (result.success) {
          const galleryImages: GalleryImage[] = result.data.images.map((img: any) => ({
            src: img.public_id,
            alt: img.original_filename || img.public_id,
            title: img.original_filename,
            description: img.tags.length > 0 ? `Теги: ${img.tags.join(', ')}` : undefined,
          }));

          // Сортировка
          galleryImages.sort((a, b) => {
            // Простая сортировка по имени файла как fallback
            const aValue = a.title || a.alt;
            const bValue = b.title || b.alt;
            
            if (sortOrder === 'asc') {
              return aValue.localeCompare(bValue);
            } else {
              return bValue.localeCompare(aValue);
            }
          });

          setImages(galleryImages);
        } else {
          setError(result.error || 'Ошибка загрузки изображений');
        }
      } catch (err: any) {
        console.error('Ошибка загрузки галереи:', err);
        setError(err.message || 'Произошла ошибка при загрузке галереи');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [folder, tags, maxImages, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Загрузка галереи...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Ошибка загрузки галереи: {error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">В папке "{folder}" нет изображений</p>
      </div>
    );
  }

  return <CloudinaryGallery images={images} {...galleryProps} />;
}