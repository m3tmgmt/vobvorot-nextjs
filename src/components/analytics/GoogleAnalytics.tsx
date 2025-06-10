'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', measurementId, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [measurementId]);

  if (!measurementId || process.env.NODE_ENV !== 'production') {
    return null;
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
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

// Analytics tracking functions
export const analytics = {
  // Page view tracking
  pageView: (url: string, title?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        page_location: url,
        page_title: title || document.title,
      });
    }
  },

  // Event tracking
  event: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'engagement',
        event_label: parameters?.label,
        value: parameters?.value,
        ...parameters,
      });
    }
  },

  // E-commerce tracking
  purchase: (transactionId: string, value: number, currency: string = 'USD', items: any[] = []) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
        items: items.map(item => ({
          item_id: item.sku,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        }))
      });
    }
  },

  // Add to cart tracking
  addToCart: (currency: string, value: number, items: any[]) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: currency,
        value: value,
        items: items.map(item => ({
          item_id: item.sku,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        }))
      });
    }
  },

  // Begin checkout tracking
  beginCheckout: (currency: string, value: number, items: any[]) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: currency,
        value: value,
        items: items.map(item => ({
          item_id: item.sku,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        }))
      });
    }
  },

  // View item tracking
  viewItem: (currency: string, value: number, items: any[]) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: currency,
        value: value,
        items: items.map(item => ({
          item_id: item.sku,
          item_name: item.name,
          category: item.category,
          price: item.price,
        }))
      });
    }
  },

  // Search tracking
  search: (searchTerm: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
      });
    }
  },

  // Newsletter signup tracking
  newsletterSignup: (method: string = 'email') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up', {
        method: method,
      });
    }
  },

  // Contact form tracking
  contactForm: (formName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        form_name: formName,
      });
    }
  }
};