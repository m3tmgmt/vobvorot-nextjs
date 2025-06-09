'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cloudinaryHelpers } from '@/lib/cloudinary';

interface CloudinaryImage {
  public_id: string;
  url: string;
  urls: {
    original: string;
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  };
  width: number;
  height: number;
  format: string;
  size: number;
  created_at: string;
  tags: string[];
  original_filename: string;
}

interface CloudinaryUploadProps {
  onUploadComplete?: (image: CloudinaryImage) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  tags?: string[];
  maxFiles?: number;
  acceptedFormats?: string[];
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  multiple?: boolean;
}

export default function CloudinaryUpload({
  onUploadComplete,
  onUploadError,
  folder = 'vobvorot-store',
  tags = [],
  maxFiles = 5,
  acceptedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  className = '',
  disabled = false,
  showPreview = true,
  multiple = false,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadedImages, setUploadedImages] = useState<CloudinaryImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверка файла
  const validateFile = (file: File): string | null => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      return `Неподдерживаемый формат файла. Разрешены: ${acceptedFormats.join(', ')}`;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'Размер файла превышает 10MB';
    }

    return null;
  };

  // Загрузка файла
  const uploadFile = async (file: File): Promise<CloudinaryImage> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  };

  // Обработка выбора файлов
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || uploading) return;

    const fileArray = Array.from(files);
    
    // Проверяем количество файлов
    if (uploadedImages.length + fileArray.length > maxFiles) {
      const error = `Можно загрузить максимум ${maxFiles} файлов`;
      onUploadError?.(error);
      return;
    }

    // Валидируем файлы
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation) {
        onUploadError?.(validation);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const fileId = `${file.name}-${Date.now()}-${index}`;
        
        try {
          setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
          
          // Симуляция прогресса загрузки
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
            }));
          }, 200);

          const uploadedImage = await uploadFile(file);
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 1000);

          return uploadedImage;
        } catch (error: any) {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      
      setUploadedImages(prev => [...prev, ...results]);
      
      // Уведомляем о каждой успешной загрузке
      results.forEach(image => {
        onUploadComplete?.(image);
      });

    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      onUploadError?.(error.message || 'Произошла ошибка при загрузке');
    } finally {
      setUploading(false);
    }
  }, [disabled, uploading, uploadedImages.length, maxFiles, onUploadComplete, onUploadError, folder, tags]);

  // Обработка drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Обработка клика по кнопке загрузки
  const handleUploadClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  // Обработка выбора файлов через input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Очищаем input для возможности повторной загрузки того же файла
    e.target.value = '';
  };

  // Удаление изображения
  const removeImage = async (publicId: string) => {
    try {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id: publicId }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImages(prev => prev.filter(img => img.public_id !== publicId));
      } else {
        onUploadError?.(result.error || 'Ошибка при удалении изображения');
      }
    } catch (error: any) {
      console.error('Ошибка удаления:', error);
      onUploadError?.(error.message || 'Произошла ошибка при удалении');
    }
  };

  const progressEntries = Object.entries(uploadProgress);

  return (
    <div className={`cloudinary-upload ${className}`}>
      {/* Область загрузки */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploading ? 'pointer-events-none' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFormats.map(format => `.${format}`).join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className="text-4xl text-gray-400">
            📁
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploading ? 'Загружаем файлы...' : 'Перетащите файлы сюда или нажмите для выбора'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Поддерживаемые форматы: {acceptedFormats.join(', ')}
            </p>
            <p className="text-sm text-gray-500">
              Максимум {maxFiles} файлов, до 10MB каждый
            </p>
          </div>
        </div>
      </div>

      {/* Прогресс загрузки */}
      {progressEntries.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900">Загрузка файлов:</h4>
          {progressEntries.map(([fileId, progress]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{fileId.split('-')[0]}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Превью загруженных изображений */}
      {showPreview && uploadedImages.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Загруженные изображения:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.public_id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.urls.small}
                    alt={image.original_filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Информация об изображении */}
                <div className="mt-2 text-xs text-gray-500">
                  <p className="truncate">{image.original_filename}</p>
                  <p>{(image.size / 1024).toFixed(1)} KB</p>
                  <p>{image.width} × {image.height}</p>
                </div>

                {/* Кнопка удаления */}
                <button
                  onClick={() => removeImage(image.public_id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Удалить изображение"
                >
                  ×
                </button>

                {/* Кнопка копирования URL */}
                <button
                  onClick={() => navigator.clipboard.writeText(image.url)}
                  className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Копировать URL"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статистика */}
      {uploadedImages.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Загружено: {uploadedImages.length} из {maxFiles} возможных
          </p>
        </div>
      )}
    </div>
  );
}