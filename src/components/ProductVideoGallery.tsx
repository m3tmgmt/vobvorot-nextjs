'use client'

import { useState, useEffect } from 'react'

interface ProductVideo {
  id: string
  url: string
  order: number
  createdAt: string
}

interface ProductVideoGalleryProps {
  productId: string
  className?: string
  autoplay?: boolean
  controls?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
}

export default function ProductVideoGallery({
  productId,
  className = '',
  autoplay = true,
  controls = true,
  muted = true,
  loop = true,
  playsInline = true
}: ProductVideoGalleryProps) {
  const [videos, setVideos] = useState<ProductVideo[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка галереи видео товара
  const loadProductVideos = async () => {
    if (!productId) return

    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading videos for product:', productId)
      
      const response = await fetch(`/api/admin/products/${productId}/videos`)
      const data = await response.json()
      
      console.log('Product videos API response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load videos')
      }
      
      if (data.videos && data.videos.length > 0) {
        // Предзагружаем первое видео
        if (data.videos[0]) {
          const firstVideo = document.createElement('video')
          firstVideo.preload = 'auto'
          firstVideo.src = data.videos[0].url
          firstVideo.load()
          console.log('Preloading first product video:', data.videos[0].url)
        }
        
        setVideos(data.videos)
        setCurrentVideoIndex(0)
        console.log('Product videos loaded:', data.videos.length)
      } else {
        setVideos([])
        console.log('No videos found for product')
      }
    } catch (err) {
      console.error('Error loading product videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load videos')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  // Загружаем видео при монтировании и изменении productId
  useEffect(() => {
    loadProductVideos()
  }, [productId])

  // Автоматическое переключение видео каждые 10 секунд (если больше одного видео)
  useEffect(() => {
    if (videos.length <= 1) return

    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
    }, 10000) // 10 секунд

    return () => clearInterval(interval)
  }, [videos.length])

  // Обработчик ошибки видео
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget
    console.error('Video error:', e, 'Video src:', video.src)
  }

  // Обработчик успешной загрузки видео
  const handleVideoLoad = (videoUrl: string) => {
    console.log('Video loaded successfully:', videoUrl)
  }

  // Если загрузка или ошибка
  if (loading) {
    return (
      <div className={`product-video-gallery ${className}`}>
        <div className="video-placeholder loading">
          <div className="loading-spinner"></div>
          <p>Загрузка видео...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`product-video-gallery ${className}`}>
        <div className="video-placeholder error">
          <p>Ошибка загрузки видео: {error}</p>
        </div>
      </div>
    )
  }

  // Если нет видео
  if (videos.length === 0) {
    return null // Не показываем ничего, если нет видео
  }

  return (
    <div className={`product-video-gallery ${className}`}>
      {/* Основной контейнер видео */}
      <div className="video-container">
        {videos.map((video, index) => (
          <video
            key={`${video.id}-${index}`}
            className={`product-video ${index === currentVideoIndex ? 'active' : ''}`}
            src={video.url}
            autoPlay={autoplay && index === currentVideoIndex}
            muted={muted}
            loop={loop}
            controls={controls}
            playsInline={playsInline}
            preload={index === 0 ? "auto" : "metadata"}
            onError={handleVideoError}
            onLoadStart={() => console.log('Video load started:', video.url)}
            onLoadedData={() => handleVideoLoad(video.url)}
            onCanPlay={() => {
              console.log('Video can play:', video.url)
              if (index === 0) {
                console.log('First product video ready for immediate playback')
              }
            }}
            style={{
              display: index === currentVideoIndex ? 'block' : 'none',
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          >
            <source src={video.url} type="video/mp4" />
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
        ))}
      </div>

      {/* Навигация по видео (если больше одного) */}
      {videos.length > 1 && (
        <div className="video-navigation">
          <div className="video-dots">
            {videos.map((_, index) => (
              <button
                key={index}
                className={`video-dot ${index === currentVideoIndex ? 'active' : ''}`}
                onClick={() => setCurrentVideoIndex(index)}
                aria-label={`Переключить на видео ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Стрелки навигации */}
          <button
            className="video-nav prev"
            onClick={() => setCurrentVideoIndex((prev) => 
              prev === 0 ? videos.length - 1 : prev - 1
            )}
            aria-label="Предыдущее видео"
          >
            ←
          </button>
          
          <button
            className="video-nav next"
            onClick={() => setCurrentVideoIndex((prev) => 
              (prev + 1) % videos.length
            )}
            aria-label="Следующее видео"
          >
            →
          </button>
        </div>
      )}

      {/* Информация о видео */}
      {videos.length > 0 && (
        <div className="video-info">
          <span className="video-counter">
            {currentVideoIndex + 1} из {videos.length}
          </span>
        </div>
      )}

      <style jsx>{`
        .product-video-gallery {
          position: relative;
          width: 100%;
          height: 400px;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }

        .video-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .product-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease;
        }

        .video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          color: #fff;
        }

        .video-placeholder.loading {
          background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
        }

        .video-placeholder.error {
          background: linear-gradient(45deg, #1a1a1a, #3a1a1a);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top: 3px solid var(--cyan-accent, #00ffff);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .video-navigation {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 10;
        }

        .video-dots {
          display: flex;
          gap: 8px;
        }

        .video-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.6);
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .video-dot:hover {
          border-color: rgba(255, 255, 255, 0.8);
        }

        .video-dot.active {
          background: var(--cyan-accent, #00ffff);
          border-color: var(--cyan-accent, #00ffff);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .video-nav {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.6);
          background: rgba(0, 0, 0, 0.5);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.3s ease;
        }

        .video-nav:hover {
          border-color: var(--cyan-accent, #00ffff);
          background: rgba(0, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .video-nav.prev {
          margin-right: 20px;
        }

        .video-nav.next {
          margin-left: 20px;
        }

        .video-info {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 14px;
          z-index: 10;
        }

        /* Адаптивность */
        @media (max-width: 768px) {
          .product-video-gallery {
            height: 250px;
          }

          .video-navigation {
            bottom: 10px;
          }

          .video-nav {
            width: 35px;
            height: 35px;
            font-size: 16px;
          }

          .video-nav.prev {
            margin-right: 15px;
          }

          .video-nav.next {
            margin-left: 15px;
          }

          .video-info {
            top: 10px;
            right: 10px;
            font-size: 12px;
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  )
}