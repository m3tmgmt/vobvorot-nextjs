'use client'

import Image from 'next/image'
import { useState, useCallback, memo } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  loading?: 'lazy' | 'eager'
  className?: string
  style?: React.CSSProperties
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  fallbackSrc?: string
  onLoad?: () => void
  onError?: (error: Event) => void
}

/**
 * Optimized image component with fallbacks, error handling, and performance optimizations
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  loading = 'lazy',
  className,
  style,
  sizes,
  quality = 75,
  placeholder = 'blur',
  fallbackSrc,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Generate blur placeholder
  const blurDataURL = generateBlurDataURL(width, height)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback((event: any) => {
    console.warn(`Failed to load image: ${src}`)
    setImageError(true)
    setIsLoading(false)
    onError?.(event)
  }, [src, onError])

  // If image failed and we have a fallback, use it
  if (imageError && fallbackSrc) {
    return (
      <OptimizedImage
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={loading}
        className={className}
        style={style}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        onLoad={handleLoad}
        onError={() => {
          // If fallback also fails, show error state
          setImageError(true)
        }}
      />
    )
  }

  // If no image or fallback failed, show error state
  if (imageError) {
    return (
      <div
        className={className}
        style={{
          ...style,
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px'
        }}
      >
        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.8rem'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷</div>
          <div>Image unavailable</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={loading}
        className={className}
        style={style}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
    </div>
  )
})

/**
 * Product image component with specific optimizations for product display
 */
export const ProductImage = memo(function ProductImage({
  src,
  alt,
  priority = false,
  className
}: {
  src: string
  alt: string
  priority?: boolean
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={280}
      height={280}
      priority={priority}
      sizes="(max-width: 480px) 200px, (max-width: 768px) 250px, 280px"
      quality={80}
      className={className}
      style={{ objectFit: 'cover' }}
      fallbackSrc="/images/product-placeholder.jpg"
    />
  )
})

/**
 * Hero image component with responsive sizing
 */
export const HeroImage = memo(function HeroImage({
  src,
  alt,
  className
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      priority={true}
      sizes="100vw"
      quality={85}
      className={className}
      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
    />
  )
})

/**
 * Avatar image component
 */
export const AvatarImage = memo(function AvatarImage({
  src,
  alt,
  size = 40,
  className
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={70}
      className={className}
      style={{ 
        objectFit: 'cover', 
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}
      fallbackSrc="/images/avatar-placeholder.jpg"
    />
  )
})

/**
 * Generate a simple blur data URL for placeholder
 */
function generateBlurDataURL(width: number, height: number): string {
  // Create a simple gradient blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(30,30,30);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(60,60,60);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `
  
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Image preloader utility
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Hook for preloading multiple images
 */
export function useImagePreloader(sources: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const preloadImages = useCallback(async () => {
    setIsLoading(true)
    const promises = sources.map(async (src) => {
      try {
        await preloadImage(src)
        setLoadedImages(prev => new Set([...prev, src]))
      } catch (error) {
        console.warn(`Failed to preload image: ${src}`)
      }
    })

    await Promise.allSettled(promises)
    setIsLoading(false)
  }, [sources])

  return {
    preloadImages,
    loadedImages,
    isLoading,
    isImageLoaded: (src: string) => loadedImages.has(src)
  }
}