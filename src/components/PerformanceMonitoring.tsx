'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect } from 'react';

// Performance monitoring component
export function PerformanceMonitoring() {
  useEffect(() => {
    // Custom performance monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Monitor Core Web Vitals
        if (entry.entryType === 'measure') {
          console.log(`Performance measure: ${entry.name} - ${entry.duration}ms`);
        }
        
        // Monitor largest contentful paint
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`LCP: ${entry.startTime}ms`);
          
          // Track LCP in Google Analytics
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'web_vitals', {
              name: 'LCP',
              value: Math.round(entry.startTime),
              event_category: 'Web Vitals',
            });
          }
        }
        
        // Monitor first contentful paint
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          console.log(`FCP: ${entry.startTime}ms`);
          
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'web_vitals', {
              name: 'FCP',
              value: Math.round(entry.startTime),
              event_category: 'Web Vitals',
            });
          }
        }
      });
    });

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'largest-contentful-paint', 'paint'] });
    } catch (e) {
      // Browser doesn't support all entry types
      console.log('Performance observer not fully supported');
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationEntry) {
          const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
          console.log(`Page load time: ${loadTime}ms`);
          
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'page_load_time', {
              value: Math.round(loadTime),
              event_category: 'Performance',
            });
          }
        }
      }, 0);
    });

    // Monitor cumulative layout shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.log('Layout shift observer not supported');
    }

    // Send CLS when page is hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'web_vitals', {
            name: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
            event_category: 'Web Vitals',
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

// Performance utilities
export const performance_utils = {
  // Mark performance events
  mark: (name: string) => {
    if (typeof window !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  // Measure between marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof window !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        console.log(`Could not measure ${name}`);
      }
    }
  },

  // Monitor API response times
  trackApiCall: async (url: string, requestInit?: RequestInit) => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, requestInit);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Track in Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'api_response_time', {
          api_endpoint: url,
          response_time: Math.round(duration),
          status_code: response.status,
          event_category: 'API Performance',
        });
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Track failed API calls
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'api_error', {
          api_endpoint: url,
          response_time: Math.round(duration),
          event_category: 'API Performance',
        });
      }
      
      throw error;
    }
  },

  // Track custom performance metrics
  trackCustomMetric: (name: string, value: number, unit: string = 'ms') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'custom_performance', {
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
        event_category: 'Custom Performance',
      });
    }
  }
};