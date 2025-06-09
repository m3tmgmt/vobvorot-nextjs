'use client';

import React, { useState, useEffect } from 'react';
import { imageFallbackManager } from '@/lib/image-fallback';

interface FallbackStats {
  cloudinaryStatus: {
    isAvailable: boolean;
    lastCheck: number;
    failCount: number;
    nextRetry: number;
  };
  cacheSize: number;
  config: any;
}

export default function ImageFallbackManager() {
  const [stats, setStats] = useState<FallbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Загрузка статистики
  const loadStats = async () => {
    try {
      const currentStats = imageFallbackManager.getStats();
      setStats(currentStats);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Ошибка загрузки статистики: ${error.message}` });
    }
  };

  // Проверка статуса Cloudinary
  const checkCloudinaryStatus = async () => {
    setIsLoading(true);
    try {
      const isAvailable = await imageFallbackManager.checkCloudinaryAvailability();
      setMessage({
        type: isAvailable ? 'success' : 'error',
        text: isAvailable ? 'Cloudinary доступен' : 'Cloudinary недоступен'
      });
      await loadStats();
    } catch (error: any) {
      setMessage({ type: 'error', text: `Ошибка проверки Cloudinary: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Очистка кеша URL
  const clearUrlCache = () => {
    imageFallbackManager.clearUrlCache();
    setMessage({ type: 'success', text: 'Кеш URL очищен' });
    loadStats();
  };

  // Сброс статуса Cloudinary
  const resetCloudinaryStatus = () => {
    imageFallbackManager.resetCloudinaryStatus();
    setMessage({ type: 'info', text: 'Статус Cloudinary сброшен' });
    loadStats();
  };

  // Очистка локального кеша
  const clearLocalCache = async () => {
    setIsLoading(true);
    try {
      const result = await imageFallbackManager.clearLocalCache(7);
      setMessage({
        type: 'success',
        text: `Удалено ${result.deleted} файлов. ${result.errors.length > 0 ? `Ошибок: ${result.errors.length}` : ''}`
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Ошибка очистки кеша: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка статистики при монтировании
  useEffect(() => {
    loadStats();
  }, []);

  // Автоматическое скрытие сообщений
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const formatDate = (timestamp: number) => {
    return timestamp ? new Date(timestamp).toLocaleString('ru-RU') : 'Никогда';
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return 'Немедленно';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
    if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
    return `${seconds}с`;
  };

  if (!stats) {
    return (
      <div className="image-fallback-manager p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-fallback-manager p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Управление Fallback системой изображений</h2>

      {/* Сообщения */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Статус Cloudinary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Статус Cloudinary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                stats.cloudinaryStatus.isAvailable ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {stats.cloudinaryStatus.isAvailable ? 'Доступен' : 'Недоступен'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Последняя проверка: {formatDate(stats.cloudinaryStatus.lastCheck)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-1">Ошибки подряд</h4>
            <p className="text-2xl font-bold text-red-600">{stats.cloudinaryStatus.failCount}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-1">Следующая попытка</h4>
            <p className="text-sm text-gray-600">
              {stats.cloudinaryStatus.nextRetry > Date.now() 
                ? formatDuration(stats.cloudinaryStatus.nextRetry - Date.now())
                : 'Доступна сейчас'
              }
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-1">Кеш URL</h4>
            <p className="text-2xl font-bold text-blue-600">{stats.cacheSize}</p>
            <p className="text-sm text-gray-600">записей</p>
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={checkCloudinaryStatus}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Проверяю...' : 'Проверить Cloudinary'}
          </button>

          <button
            onClick={resetCloudinaryStatus}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Сбросить статус
          </button>

          <button
            onClick={clearUrlCache}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Очистить кеш URL
          </button>

          <button
            onClick={clearLocalCache}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Очищаю...' : 'Очистить локальный кеш'}
          </button>
        </div>
      </div>

      {/* Конфигурация */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Конфигурация</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Пути</h4>
              <p><strong>Локальное хранилище:</strong> {stats.config.localStoragePath}</p>
              <p><strong>Публичный путь:</strong> {stats.config.publicPath}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Настройки кеша</h4>
              <p><strong>Кеширование:</strong> {stats.config.enableCaching ? 'Включено' : 'Отключено'}</p>
              <p><strong>Время жизни:</strong> {stats.config.cacheMaxAge} сек</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Повторные попытки</h4>
              <p><strong>Количество попыток:</strong> {stats.config.retryAttempts}</p>
              <p><strong>Задержка:</strong> {stats.config.retryDelay} мс</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Placeholder изображения</h4>
              <ul className="space-y-1">
                {Object.entries(stats.config.fallbackImages).map(([type, url]) => (
                  <li key={type}>
                    <strong>{type}:</strong> {url as string}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Тестирование */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Тестирование Fallback</h3>
        <ImageFallbackTest />
      </div>
    </div>
  );
}

// Компонент для тестирования fallback системы
function ImageFallbackTest() {
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testFallback = async () => {
    if (!testUrl.trim()) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      const resultUrl = await imageFallbackManager.getImageUrl(testUrl, {
        width: 300,
        height: 200,
        fallbackType: 'product',
      });

      setTestResult(resultUrl);
    } catch (error: any) {
      setTestResult(`Ошибка: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-3">Тест получения изображения</h4>
      
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Введите public_id или URL изображения"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={testFallback}
          disabled={isLoading || !testUrl.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Тестирую...' : 'Тест'}
        </button>
      </div>

      {testResult && (
        <div className="mt-3">
          <h5 className="font-medium mb-2">Результат:</h5>
          {testResult.startsWith('Ошибка:') ? (
            <p className="text-red-600 text-sm">{testResult}</p>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-2 break-all">{testResult}</p>
              <img 
                src={testResult} 
                alt="Test result" 
                className="max-w-xs rounded border"
                onError={() => setTestResult('Ошибка: Изображение не загружается')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}