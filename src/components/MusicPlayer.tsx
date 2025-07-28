'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePuzzle } from '@/contexts/PuzzleContext'

export function MusicPlayer() {
  const [mounted, setMounted] = useState(false)
  const { findPiece } = usePuzzle()
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setMounted(true)
    
    // Restore music player state from localStorage
    try {
      const savedState = localStorage.getItem('vobvorot-music-player')
      const shouldContinue = localStorage.getItem('vobvorot-music-continue')
      
      if (savedState) {
        const { isPlaying: savedPlaying, volume: savedVolume, currentTrackIndex } = JSON.parse(savedState)
        if (typeof savedVolume === 'number') setVolume(savedVolume)
        if (typeof currentTrackIndex === 'number') setCurrentShuffledIndex(currentTrackIndex)
        
        // Continue playing if it was playing before navigation
        if (shouldContinue === 'true' && savedPlaying) {
          setIsPlaying(true)
        }
      }
    } catch (error) {
      console.log('Failed to restore music player state:', error)
    }
  }, [])

  // Ambient music playlist - используем только надежные SoundHelix треки
  const tracks = [
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", title: "Ambient Track 1" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", title: "Ambient Track 2" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", title: "Ambient Track 3" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", title: "Ambient Track 4" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", title: "Ambient Track 5" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", title: "Ambient Track 6" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", title: "Ambient Track 7" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", title: "Ambient Track 8" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", title: "Ambient Track 9" },
    { audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", title: "Ambient Track 10" }
  ]

  // Создаем случайную последовательность треков при инициализации
  const [shuffledTracks] = useState(() => {
    const shuffled = [...tracks]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  })
  
  // Индекс текущего трека в перемешанном массиве  
  const [currentShuffledIndex, setCurrentShuffledIndex] = useState(0)

  // Save state to localStorage whenever key values change
  useEffect(() => {
    if (!mounted) return
    
    try {
      const state = {
        isPlaying,
        volume,
        currentTrackIndex: currentShuffledIndex
      }
      localStorage.setItem('vobvorot-music-player', JSON.stringify(state))
    } catch (error) {
      console.log('Failed to save music player state:', error)
    }
  }, [mounted, isPlaying, volume, currentShuffledIndex])

  // Получить текущий трек из перемешанного массива
  const getCurrentTrack = () => shuffledTracks[currentShuffledIndex]

  useEffect(() => {
    if (!mounted || !audioRef.current) return

    const audio = audioRef.current
    audio.volume = volume
    
    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handleEnded = () => {
      // Переходим к следующему треку в перемешанном массиве
      setCurrentShuffledIndex((prev) => (prev + 1) % shuffledTracks.length)
      setProgress(0)
    }

    const handleError = () => {
      console.log('Audio error occurred')
      setIsLoading(false)
      
      // Не переключаем трек во время навигации, просто приостанавливаем
      if (isNavigating) {
        setIsPlaying(false)
        return
      }
      
      // При ошибке переходим к следующему треку только если не навигируем
      console.log('Audio error, skipping to next track')
      setIsPlaying(false)
      setCurrentShuffledIndex((prev) => (prev + 1) % shuffledTracks.length)
      setProgress(0)
    }

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [mounted, currentShuffledIndex, volume, shuffledTracks, isPlaying])

  // Handle navigation events to prevent track switching during navigation
  useEffect(() => {
    if (!mounted) return

    // Listen for beforeunload to save state on page refresh/close
    const handleBeforeUnload = () => {
      if (audioRef.current && isPlaying) {
        try {
          localStorage.setItem('vobvorot-music-continue', 'true')
          localStorage.setItem('vobvorot-music-time', audioRef.current.currentTime.toString())
        } catch (error) {
          console.log('Failed to save music position:', error)
        }
      }
    }

    // Navigation state handlers - use a more specific approach
    const handleNavigationStart = () => {
      setIsNavigating(true)
      console.log('Navigation started - preventing track switching')
    }

    const handleNavigationComplete = () => {
      setTimeout(() => {
        setIsNavigating(false)
        console.log('Navigation completed - allowing track switching')
      }, 1000) // Wait 1 second after navigation to ensure audio is stable
    }

    // Use popstate for back/forward navigation
    const handlePopState = () => {
      handleNavigationStart()
      setTimeout(handleNavigationComplete, 1500)
    }

    // For link clicks, we'll detect them on the window level
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && link.href !== window.location.href) {
        handleNavigationStart()
        setTimeout(handleNavigationComplete, 2000)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('click', handleClick, true)
    }
  }, [mounted, isPlaying])

  // Auto-play when track changes if already playing
  useEffect(() => {
    if (!mounted || !audioRef.current) return
    
    const audio = audioRef.current
    const currentTrack = getCurrentTrack()
    
    if (currentTrack && audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl
    }
    
    // Check if we should continue playing from previous session
    const shouldContinue = localStorage.getItem('vobvorot-music-continue')
    const savedTime = localStorage.getItem('vobvorot-music-time')
    
    if (isPlaying && currentTrack) {
      const playAudio = async () => {
        try {
          // Небольшая задержка для загрузки
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Restore previous position if available
          if (shouldContinue === 'true' && savedTime) {
            audio.currentTime = parseFloat(savedTime)
            localStorage.removeItem('vobvorot-music-continue')
            localStorage.removeItem('vobvorot-music-time')
          }
          
          await audio.play()
        } catch (error) {
          console.log('Playback failed:', error)
          // При ошибке пробуем следующий трек
          setCurrentShuffledIndex((prev) => (prev + 1) % shuffledTracks.length)
          setIsPlaying(false)
        }
      }
      
      playAudio()
    }
  }, [currentShuffledIndex, mounted, isPlaying, shuffledTracks])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Trigger puzzle piece when first playing music
      findPiece('music-lover')
      setIsPlaying(true)
    }
  }

  const nextTrack = () => {
    setCurrentShuffledIndex((prev) => (prev + 1) % shuffledTracks.length)
    setProgress(0)
  }

  const prevTrack = () => {
    setCurrentShuffledIndex((prev) => (prev - 1 + shuffledTracks.length) % shuffledTracks.length)
    setProgress(0)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  if (!mounted) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: isExpanded ? '280px' : '60px',
      height: isExpanded ? 'auto' : '60px',
      background: 'rgba(0,0,0,0.9)',
      border: '2px solid var(--green-neon)',
      borderRadius: '15px',
      padding: isExpanded ? '0' : '0',
      zIndex: 1000,
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(20px)',
      boxShadow: isExpanded ? '0 0 30px rgba(57,255,20,0.3)' : '0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.3)'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: isExpanded ? 'absolute' : 'static',
          top: isExpanded ? '10px' : '0',
          right: isExpanded ? '10px' : '0',
          transform: isExpanded ? 'none' : 'none',
          width: isExpanded ? '40px' : '60px',
          height: isExpanded ? '40px' : '60px',
          background: 'transparent',
          border: 'none',
          borderRadius: isExpanded ? '50%' : '15px',
          color: 'white',
          fontSize: isExpanded ? '1.2rem' : '1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: 'none',
          animation: isExpanded ? 'none' : 'pulse 2s infinite'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isExpanded ? 'scale(1.1)' : 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 0 20px var(--green-neon)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isExpanded ? 'scale(1)' : 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isExpanded ? '40px' : '40px',
          height: isExpanded ? '40px' : '40px',
          background: 'linear-gradient(45deg, var(--green-neon), #32cd32)',
          borderRadius: '50%',
          fontSize: isExpanded ? '1.2rem' : '1.5rem',
          boxShadow: isExpanded ? 'none' : '0 0 15px rgba(57,255,20,0.6)'
        }}>
          🎵
        </span>
      </button>

      {isExpanded && (
        <div style={{ padding: '1rem' }}>
          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={prevTrack}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                color: 'var(--cyan-accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--cyan-accent)'
                e.currentTarget.style.color = 'black'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = 'var(--cyan-accent)'
              }}
            >
              ⏮
            </button>

            <button
              onClick={togglePlay}
              style={{
                background: 'linear-gradient(45deg, var(--green-neon), #32cd32)',
                border: 'none',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 0 20px var(--green-neon)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isLoading ? '⏳' : (isPlaying ? '⏸' : '▶')}
            </button>

            <button
              onClick={nextTrack}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                color: 'var(--cyan-accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--cyan-accent)'
                e.currentTarget.style.color = 'black'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = 'var(--cyan-accent)'
              }}
            >
              ⏭
            </button>
          </div>

          {/* Volume Control */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--cyan-accent)' }}>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                flex: 1,
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <span style={{ 
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.7rem',
              width: '30px',
              textAlign: 'right'
            }}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Visual Indicator */}
          <div style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.25rem'
          }}>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: isPlaying ? `${Math.random() * 20 + 10}px` : '4px',
                  background: isPlaying 
                    ? `linear-gradient(to top, var(--green-neon), transparent)`
                    : 'rgba(255,255,255,0.2)',
                  borderRadius: '2px',
                  transition: 'height 0.3s ease',
                  animation: isPlaying ? `pulse ${0.5 + Math.random() * 0.5}s infinite` : 'none'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={getCurrentTrack()?.audioUrl || ''}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </div>
  )
}