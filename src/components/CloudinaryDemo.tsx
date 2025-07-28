'use client';

import React, { useState } from 'react';
import CloudinaryImage from './CloudinaryImage';
import CloudinaryUpload from './CloudinaryUpload';
import CloudinaryImageManager from './CloudinaryImageManager';
import CloudinaryGallery, { CloudinaryFolderGallery } from './CloudinaryGallery';
import ImageFallbackManager from './ImageFallbackManager';

interface CloudinaryDemoProps {
  className?: string;
}

export default function CloudinaryDemo({ className = '' }: CloudinaryDemoProps) {
  const [activeTab, setActiveTab] = useState<string>('showcase');
  const [demoImages] = useState([
    {
      src: 'sample', // Cloudinary sample image
      alt: 'Sample Image 1',
      title: 'Образец изображения 1',
      description: 'Демонстрация оптимизированного отображения',
    },
    {
      src: 'samples/ecommerce/accessories-bag',
      alt: 'Sample Bag',
      title: 'Сумка',
      description: 'Пример товара из каталога',
    },
    {
      src: 'samples/ecommerce/shoes',
      alt: 'Sample Shoes', 
      title: 'Обувь',
      description: 'Еще один пример товара',
    },
  ]);

  const tabs = [
    { id: 'showcase', label: 'Демонстрация' },
    { id: 'upload', label: 'Загрузка' },
    { id: 'manager', label: 'Менеджер' },
    { id: 'gallery', label: 'Галерея' },
    { id: 'fallback', label: 'Fallback' },
  ];

  return (
    <div className={`cloudinary-demo ${className}`}>
      {/* Табы */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Содержимое табов */}
      <div className="tab-content">
        {activeTab === 'showcase' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Демонстрация возможностей Cloudinary</h2>
            
            {/* Адаптивные изображения */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Адаптивные изображения</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Thumbnail (150x150)</h4>
                  <CloudinaryImage
                    src="sample"
                    alt="Thumbnail"
                    width={150}
                    height={150}
                    crop="fill"
                    quality="auto"
                    className="rounded border"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Medium (300x300)</h4>
                  <CloudinaryImage
                    src="sample"
                    alt="Medium"
                    width={300}
                    height={300}
                    crop="fill"
                    quality="auto"
                    className="rounded border"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Large (600x400)</h4>
                  <CloudinaryImage
                    src="sample"
                    alt="Large"
                    width={600}
                    height={400}
                    crop="fill"
                    quality="auto"
                    className="rounded border"
                  />
                </div>
              </div>
            </section>

            {/* Различные эффекты обрезки */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Различные типы обрезки</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['fill', 'fit', 'crop', 'scale'].map(crop => (
                  <div key={crop}>
                    <h4 className="font-medium mb-2 capitalize">{crop}</h4>
                    <CloudinaryImage
                      src="sample"
                      alt={`Crop: ${crop}`}
                      width={200}
                      height={150}
                      crop={crop as any}
                      className="rounded border w-full"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Качество изображений */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Различные уровни качества</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { quality: 'auto:low', label: 'Низкое (auto:low)' },
                  { quality: 'auto', label: 'Автоматическое (auto)' },
                  { quality: 'auto:best', label: 'Высокое (auto:best)' },
                ].map(({ quality, label }) => (
                  <div key={quality}>
                    <h4 className="font-medium mb-2">{label}</h4>
                    <CloudinaryImage
                      src="sample"
                      alt={`Quality: ${quality}`}
                      width={250}
                      height={180}
                      quality={quality as any}
                      className="rounded border w-full"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Fallback демонстрация */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Fallback система</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">С включенным fallback</h4>
                  <CloudinaryImage
                    src="non-existent-image"
                    alt="Non-existent with fallback"
                    width={200}
                    height={150}
                    enableFallback={true}
                    fallbackType="product"
                    className="rounded border"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Без fallback</h4>
                  <CloudinaryImage
                    src="non-existent-image"
                    alt="Non-existent without fallback"
                    width={200}
                    height={150}
                    enableFallback={false}
                    className="rounded border"
                  />
                </div>
              </div>
            </section>

            {/* Ленивая загрузка */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Ленивая загрузка</h3>
              <p className="text-gray-600 mb-4">
                Прокрутите вниз, чтобы увидеть как изображения загружаются по мере появления в области видимости:
              </p>
              <div className="space-y-8">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="h-80">
                    <h4 className="font-medium mb-2">Изображение {i + 1}</h4>
                    <CloudinaryImage
                      src="sample"
                      alt={`Lazy image ${i + 1}`}
                      width={400}
                      height={300}
                      loading="lazy"
                      placeholder="blur"
                      className="rounded border"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Загрузка изображений</h2>
            <CloudinaryUpload
              folder="demo"
              tags={['demo', 'test']}
              maxFiles={5}
              showPreview={true}
              multiple={true}
              onUploadComplete={(image) => {
                console.log('Изображение загружено:', image);
              }}
              onUploadError={(error) => {
                console.error('Ошибка загрузки:', error);
              }}
            />
          </div>
        )}

        {activeTab === 'manager' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Менеджер изображений</h2>
            <CloudinaryImageManager
              folder="demo"
              multiSelect={true}
              showUpload={true}
              onImageSelect={(image) => {
                console.log('Выбрано изображение:', image);
              }}
            />
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Галерея изображений</h2>
              <h3 className="text-lg font-semibold mb-4">Обычная галерея</h3>
              <CloudinaryGallery
                images={demoImages}
                columns={3}
                aspectRatio="square"
                showModal={true}
                enableZoom={true}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Галерея из папки Cloudinary</h3>
              <CloudinaryFolderGallery
                folder="demo"
                columns={4}
                aspectRatio="landscape"
                maxImages={20}
              />
            </div>
          </div>
        )}

        {activeTab === 'fallback' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Управление Fallback системой</h2>
            <ImageFallbackManager />
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент-виджет для быстрого доступа к статистике
export function CloudinaryQuickStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/image-fallback?action=stats');
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-200 rounded"></div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-3">Статус Cloudinary</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            stats.cloudinaryStatus.isAvailable ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm">
            {stats.cloudinaryStatus.isAvailable ? 'Доступен' : 'Недоступен'}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Кеш: {stats.cacheSize} записей
        </div>
      </div>
    </div>
  );
}