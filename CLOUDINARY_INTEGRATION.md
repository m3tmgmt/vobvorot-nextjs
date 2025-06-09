# Интеграция с Cloudinary

Полная интеграция с Cloudinary для управления изображениями в магазине EXVICPMOUR Store.

## 🚀 Возможности

- **Автоматическая загрузка** изображений в Cloudinary
- **Оптимизация изображений** на лету с различными размерами и качеством
- **Адаптивные изображения** для различных устройств
- **Telegram бот интеграция** для загрузки фото товаров
- **Fallback система** на локальные файлы при недоступности Cloudinary
- **Админ панель** для управления изображениями
- **Галереи изображений** с модальными окнами
- **Автоматическое кеширование** и оптимизация

## 📋 Установленные зависимости

```bash
npm install cloudinary multer @types/multer
```

## ⚙️ Конфигурация

### 1. Переменные окружения (.env.local)

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cloudinary Upload Settings
CLOUDINARY_UPLOAD_FOLDER=vobvorot-store
CLOUDINARY_MAX_FILE_SIZE=10485760
CLOUDINARY_ALLOWED_FORMATS=jpg,jpeg,png,webp,gif
```

### 2. Получение ключей Cloudinary

1. Зарегистрируйтесь на [cloudinary.com](https://cloudinary.com)
2. Перейдите в Dashboard
3. Скопируйте Cloud Name, API Key и API Secret
4. Вставьте в файл `.env.local`

## 🛠️ API Endpoints

### Загрузка изображений
- `POST /api/cloudinary/upload` - Загрузка файлов
- `PUT /api/cloudinary/upload` - Загрузка по URL

### Управление изображениями
- `GET /api/cloudinary/images` - Получение списка изображений
- `DELETE /api/cloudinary/delete` - Удаление изображений
- `POST /api/cloudinary/delete` - Массовое удаление

### Изображения товаров
- `POST /api/admin/products/[id]/images` - Добавление изображения к товару
- `GET /api/admin/products/[id]/images` - Получение изображений товара
- `PUT /api/admin/products/[id]/images` - Обновление изображений
- `DELETE /api/admin/products/[id]/images` - Удаление изображения

### Fallback система
- `GET /api/admin/image-fallback` - Статистика и проверка
- `POST /api/admin/image-fallback` - Управление fallback

## 🔧 Компоненты

### CloudinaryImage
Оптимизированный компонент для отображения изображений:

```tsx
import CloudinaryImage from '@/components/CloudinaryImage';

<CloudinaryImage
  src="product_image_id"
  alt="Product"
  width={300}
  height={300}
  crop="fill"
  quality="auto"
  responsive={true}
  enableFallback={true}
  fallbackType="product"
/>
```

### CloudinaryUpload
Компонент для загрузки изображений:

```tsx
import CloudinaryUpload from '@/components/CloudinaryUpload';

<CloudinaryUpload
  folder="products"
  tags={['product', 'new']}
  maxFiles={5}
  multiple={true}
  onUploadComplete={(image) => console.log('Uploaded:', image)}
/>
```

### CloudinaryGallery
Галерея изображений с модальными окнами:

```tsx
import CloudinaryGallery from '@/components/CloudinaryGallery';

<CloudinaryGallery
  images={[
    { src: 'image1', alt: 'Image 1', title: 'Title 1' },
    { src: 'image2', alt: 'Image 2', title: 'Title 2' },
  ]}
  columns={3}
  showModal={true}
  enableZoom={true}
/>
```

### CloudinaryImageManager
Полноценный менеджер изображений для админки:

```tsx
import CloudinaryImageManager from '@/components/CloudinaryImageManager';

<CloudinaryImageManager
  folder="products"
  multiSelect={true}
  showUpload={true}
  onImageSelect={(image) => console.log('Selected:', image)}
/>
```

## 🤖 Telegram Bot интеграция

Бот поддерживает:

- **Быструю загрузку** изображений (просто отправьте фото)
- **Загрузку фото товаров** при создании продукта
- **Массовую загрузку** изображений
- **Статистику** по загруженным изображениям
- **Управление папками** Cloudinary

### Команды бота:

- `/cloudinary` - Проверка статуса Cloudinary
- `/stats` - Статистика изображений
- Отправка фото - Автоматическая загрузка в Cloudinary

### Использование в боте:

```typescript
// В процессе создания товара
const bestPhoto = telegramPhotoHelpers.getBestQualityPhoto(photos);
const result = await cloudinaryIntegration.uploadProductPhoto(
  bestPhoto,
  productId,
  { isMain: true, tags: ['product'] }
);
```

## 📊 Автоматическая оптимизация

Система автоматически создает оптимизированные версии:

### Предустановки оптимизации:

- **product**: Для товаров (thumbnail, small, medium, large, hero)
- **avatar**: Для аватаров (small, medium, large)
- **gallery**: Для галерей (thumbnail, medium, large, watermarked)
- **blog**: Для блога (thumbnail, content, hero)
- **social**: Для соцсетей (facebook, instagram, twitter)

### Использование оптимизации:

```typescript
import { imageOptimizer } from '@/lib/image-optimization';

// Генерация оптимизированных версий
const optimized = await imageOptimizer.generateOptimizedVersions(
  publicId,
  'product'
);

// Оптимизация для контекста
const result = await imageOptimizer.optimizeForContext(publicId, {
  type: 'product',
  device: 'mobile',
  connection: 'slow'
});
```

## 🔄 Fallback система

Автоматический fallback на локальные изображения:

### Возможности:
- **Автоматическое переключение** при недоступности Cloudinary
- **Кеширование URL** для быстрого доступа
- **Предварительная загрузка** в локальное хранилище
- **Placeholder изображения** для разных типов контента
- **Автоматическая очистка** старых файлов

### Настройка:

```typescript
import { imageFallbackManager } from '@/lib/image-fallback';

// Получение URL с fallback
const url = await imageFallbackManager.getImageUrl(src, {
  width: 300,
  height: 200,
  fallbackType: 'product'
});

// Предварительная загрузка
await imageFallbackManager.preloadImageToLocal(src, options);
```

## 🎨 Демо компонент

Для тестирования всех возможностей используйте:

```tsx
import CloudinaryDemo from '@/components/CloudinaryDemo';

<CloudinaryDemo />
```

Демо включает:
- Примеры всех размеров и качества
- Различные типы обрезки
- Тестирование fallback системы
- Ленивая загрузка
- Управление изображениями

## 🔧 Расширенные настройки

### Кастомные трансформации:

```typescript
// Кастомная трансформация
const customUrl = cloudinaryService.generateOptimizedUrl(publicId, {
  width: 500,
  height: 300,
  crop: 'fill',
  quality: 'auto',
  effects: ['sharpen:100', 'saturation:20'],
});

// Адаптивные изображения
const responsiveUrls = imageOptimizer.generateResponsiveVersions(publicId);
```

### Интеллектуальная обрезка:

```typescript
// Автоматическое определение оптимальных параметров
const quality = imageOptimizer.getOptimalQuality(width, height);
const crop = imageOptimizer.getSmartCrop(targetW, targetH, sourceW, sourceH);
```

## 🚨 Обработка ошибок

Система включает comprehensive error handling:

- **Graceful degradation** при недоступности Cloudinary
- **Автоматические retry** с exponential backoff
- **Подробное логирование** ошибок
- **Fallback на placeholder** изображения

## 📈 Мониторинг и статистика

### Доступная статистика:
- Количество загруженных изображений
- Использование Cloudinary квоты
- Статус доступности сервиса
- Размер локального кеша
- Частота использования fallback

### Мониторинг в админке:
- Real-time статус Cloudinary
- Управление кешем
- Очистка старых файлов
- Тестирование fallback системы

## 🔒 Безопасность

- **Валидация файлов** по типу и размеру
- **Ограничение загрузок** для предотвращения злоупотреблений
- **Secure URLs** для доступа к изображениям
- **Автоматическая очистка** временных файлов

## 🚀 Производительность

- **Lazy loading** для изображений
- **Адаптивные размеры** для различных устройств
- **WebP/AVIF** автоматическое преобразование
- **CDN доставка** через Cloudinary
- **Intelligent caching** стратегии

## 📱 Мобильная оптимизация

- **Responsive images** с srcSet
- **Размеры для мобильных** устройств
- **Оптимизация для медленного интернета**
- **Touch-friendly** интерфейсы

## 🔧 Техническое обслуживание

### Регулярные задачи:
1. Очистка старых временных файлов
2. Мониторинг квоты Cloudinary
3. Обновление оптимизированных версий
4. Проверка integrity изображений

### Резервное копирование:
- Автоматическое кеширование в локальное хранилище
- Экспорт метаданных изображений
- Backup стратегии для critical изображений

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте переменные окружения
2. Убедитесь в доступности Cloudinary
3. Проверьте логи в консоли браузера
4. Используйте компонент демо для тестирования

Полная интеграция готова к продакшену! 🎉