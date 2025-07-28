'use client'

import { useEffect } from 'react'

export function CriticalCSS() {
  useEffect(() => {
    // Load non-critical CSS after page load
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/css/globals.css'
    link.media = 'all'
    document.head.appendChild(link)
  }, [])

  return null
}