'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CloudinaryUpload from './CloudinaryUpload';
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

interface CloudinaryImageManagerProps {
  folder?: string;
  onImageSelect?: (image: CloudinaryImage) => void;
  selectedImages?: string[];
  multiSelect?: boolean;
  showUpload?: boolean;
  className?: string;
}

export default function CloudinaryImageManager({
  folder = 'vobvorot-store',
  onImageSelect,
  selectedImages = [],
  multiSelect = false,
  showUpload = true,
  className = '',
}: CloudinaryImageManagerProps) {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'filename' | 'size'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>(selectedImages);

  // Загрузка изображений
  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cloudinary/images?folder=${encodeURIComponent(folder)}&max_results=100`);
      const result = await response.json();

      if (result.success) {
        setImages(result.data.images || []);
      } else {
        setError(result.error || 'Ошибка загрузки изображений');
      }
    } catch (err: any) {
      console.error('Ошибка загрузки изображений:', err);
      setError(err.message || 'Произошла ошибка при загрузке изображений');
    } finally {
      setLoading(false);
    }
  }, [folder]);

  // Загружаем изображения при монтировании
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Обработка успешной загрузки нового изображения
  const handleUploadComplete = (newImage: CloudinaryImage) => {
    setImages(prev => [newImage, ...prev]);
  };

  // Обработка ошибки загрузки
  const handleUploadError = (error: string) => {
    setError(error);
  };

  // Удаление изображения
  const deleteImage = async (publicId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это изображение?')) {
      return;
    }

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
        setImages(prev => prev.filter(img => img.public_id !== publicId));
        setSelectedImageIds(prev => prev.filter(id => id !== publicId));
      } else {
        setError(result.error || 'Ошибка при удалении изображения');
      }
    } catch (err: any) {
      console.error('Ошибка удаления:', err);
      setError(err.message || 'Произошла ошибка при удалении');
    }
  };

  // Массовое удаление
  const deleteSelectedImages = async () => {
    if (selectedImageIds.length === 0) return;

    if (!confirm(`Вы уверены, что хотите удалить ${selectedImageIds.length} изображений?`)) {
      return;
    }

    try {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_ids: selectedImageIds }),
      });

      const result = await response.json();

      if (result.success) {
        setImages(prev => prev.filter(img => !selectedImageIds.includes(img.public_id)));
        setSelectedImageIds([]);
      } else {
        setError(result.error || 'Ошибка при массовом удалении');
      }
    } catch (err: any) {
      console.error('Ошибка массового удаления:', err);
      setError(err.message || 'Произошла ошибка при массовом удалении');
    }
  };

  // Выбор изображения
  const handleImageSelect = (image: CloudinaryImage) => {
    if (multiSelect) {
      setSelectedImageIds(prev => {
        const isSelected = prev.includes(image.public_id);
        const newSelection = isSelected
          ? prev.filter(id => id !== image.public_id)
          : [...prev, image.public_id];
        return newSelection;
      });
    } else {
      setSelectedImageIds([image.public_id]);
    }
    
    onImageSelect?.(image);
  };

  // Фильтрация и сортировка изображений
  const filteredAndSortedImages = images
    .filter(image => {
      if (!searchTerm) return true;
      return (
        image.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'filename':
          aValue = a.original_filename.toLowerCase();
          bValue = b.original_filename.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Копирование URL в буфер обмена
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Здесь можно добавить уведомление об успешном копировании
  };

  return (
    <div className={`cloudinary-image-manager ${className}`}>
      {/* Загрузка новых изображений */}
      {showUpload && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Загрузить новые изображения</h3>
          <CloudinaryUpload
            folder={folder}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            multiple={true}
            maxFiles={10}
          />
        </div>
      )}

      {/* Панель управления */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Поиск */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Поиск по имени, ID или тегам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Сортировка */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at-desc">Новые первые</option>
            <option value="created_at-asc">Старые первые</option>
            <option value="filename-asc">По имени А-Я</option>
            <option value="filename-desc">По имени Я-А</option>
            <option value="size-desc">Большие первые</option>
            <option value="size-asc">Маленькие первые</option>
          </select>

          {/* Режим просмотра */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Сетка
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Список
            </button>
          </div>
        </div>

        {/* Действия с выбранными изображениями */}
        {selectedImageIds.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <span className="text-blue-800">
              Выбрано: {selectedImageIds.length} изображений
            </span>
            <button
              onClick={deleteSelectedImages}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Удалить выбранные
            </button>
            <button
              onClick={() => setSelectedImageIds([])}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Отменить выбор
            </button>
          </div>
        )}
      </div>

      {/* Ошибки */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Загрузка */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка изображений...</p>
        </div>
      )}

      {/* Список изображений */}
      {!loading && (
        <>
          {filteredAndSortedImages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'Изображения не найдены' : 'Нет изображений в этой папке'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 'space-y-4'}>
              {filteredAndSortedImages.map((image) => {
                const isSelected = selectedImageIds.includes(image.public_id);
                
                return viewMode === 'grid' ? (
                  // Сетка
                  <div
                    key={image.public_id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleImageSelect(image)}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={image.urls.small}
                        alt={image.original_filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Оверлей с действиями */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(image.url);
                        }}
                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        title="Копировать URL"
                      >
                        📋
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image.public_id);
                        }}
                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Чекбокс для выбора */}
                    {multiSelect && (
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleImageSelect(image)}
                          className="w-4 h-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* Информация */}
                    <div className="p-2 bg-white">
                      <p className="text-xs truncate font-medium">{image.original_filename}</p>
                      <p className="text-xs text-gray-500">
                        {(image.size / 1024).toFixed(1)} KB • {image.width}×{image.height}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Список
                  <div
                    key={image.public_id}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleImageSelect(image)}
                  >
                    {/* Чекбокс */}
                    {multiSelect && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleImageSelect(image)}
                        className="w-4 h-4 mr-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    {/* Превью */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={image.urls.thumbnail}
                        alt={image.original_filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Информация */}
                    <div className="flex-1 ml-4">
                      <h4 className="font-medium text-gray-900">{image.original_filename}</h4>
                      <p className="text-sm text-gray-500">
                        {image.width} × {image.height} • {(image.size / 1024).toFixed(1)} KB • {image.format.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(image.created_at).toLocaleDateString('ru-RU')}
                      </p>
                      {image.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {image.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Действия */}
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(image.url);
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Копировать URL"
                      >
                        📋
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image.public_id);
                        }}
                        className="p-2 text-red-500 hover:text-red-700"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Статистика */}
      {!loading && images.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Показано: {filteredAndSortedImages.length} из {images.length} изображений
          </p>
        </div>
      )}
    </div>
  );
}