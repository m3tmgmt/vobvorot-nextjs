'use client'

import { useEffect, useRef } from 'react'

interface SoundCloudPlayerProps {
  trackUrl: string
  isPlaying: boolean
  onEnded: () => void
  onTimeUpdate: (progress: number) => void
}

export function SoundCloudPlayer({ trackUrl, isPlaying, onEnded, onTimeUpdate }: SoundCloudPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    // Load SoundCloud Widget API
    const script = document.createElement('script')
    script.src = 'https://w.soundcloud.com/player/api.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (!iframeRef.current || !window.SC) return

      const widget = window.SC.Widget(iframeRef.current)
      widgetRef.current = widget

      // Set up event listeners
      widget.bind(window.SC.Widget.Events.READY, () => {
        // Auto play if needed
        if (isPlaying) {
          widget.play()
        }

        // Hide visual elements
        widget.setVolume(50)
      })

      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (e: any) => {
        const progress = (e.currentPosition / e.duration) * 100
        onTimeUpdate(progress)
      })

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        onEnded()
      })
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [trackUrl])

  useEffect(() => {
    if (!widgetRef.current) return

    if (isPlaying) {
      widgetRef.current.play()
    } else {
      widgetRef.current.pause()
    }
  }, [isPlaying])

  return (
    <iframe
      ref={iframeRef}
      width="100%"
      height="166"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
      style={{ display: 'none' }}
    />
  )
}

// Extend window type for SoundCloud
declare global {
  interface Window {
    SC: any
  }
}