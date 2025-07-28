'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView, trackEvent } from '@/components/GoogleAnalytics'

export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      trackPageView(window.location.href, document.title)
    }
  }, [pathname])

  const trackPurchase = (transactionId: string, value: number, currency: string = 'USD', items: any[] = []) => {
    trackEvent('purchase', 'ecommerce', transactionId, value)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
        items: items
      })
    }
  }

  const trackAddToCart = (itemId: string, itemName: string, price: number, category?: string) => {
    trackEvent('add_to_cart', 'ecommerce', itemName, price)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: price,
        items: [{
          item_id: itemId,
          item_name: itemName,
          item_category: category,
          price: price,
          quantity: 1
        }]
      })
    }
  }

  const trackViewItem = (itemId: string, itemName: string, price: number, category?: string) => {
    trackEvent('view_item', 'ecommerce', itemName, price)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: price,
        items: [{
          item_id: itemId,
          item_name: itemName,
          item_category: category,
          price: price
        }]
      })
    }
  }

  const trackBeginCheckout = (value: number, items: any[] = []) => {
    trackEvent('begin_checkout', 'ecommerce', 'checkout_started', value)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: value,
        items: items
      })
    }
  }

  const trackSearch = (searchTerm: string) => {
    trackEvent('search', 'engagement', searchTerm)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm
      })
    }
  }

  const trackSignUp = (method: string = 'email') => {
    trackEvent('sign_up', 'engagement', method)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up', {
        method: method
      })
    }
  }

  const trackLogin = (method: string = 'email') => {
    trackEvent('login', 'engagement', method)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'login', {
        method: method
      })
    }
  }

  return {
    trackPurchase,
    trackAddToCart,
    trackViewItem,
    trackBeginCheckout,
    trackSearch,
    trackSignUp,
    trackLogin
  }
}