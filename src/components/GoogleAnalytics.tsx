'use client'

import Script from 'next/script'

interface GoogleAnalyticsProps {
  measurementId?: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  // Временная заглушка - не загружаем Google Analytics пока нет настоящего ID
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    // В development режиме показываем заглушку в консоли
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Google Analytics заглушка активна. Для активации получите реальный Measurement ID.')
    }
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
              'custom_parameter': 'vobvorot_store'
            }
          });
          console.log('📊 Google Analytics инициализирован: ${measurementId}');
        `}
      </Script>
    </>
  )
}

// Helper function to track events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Helper function to track page views
export function trackPageView(url: string, title?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_title: title,
      page_location: url,
    })
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}