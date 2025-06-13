import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Capture 100% of transactions for performance monitoring
  tracesSampleRate: 1.0,
  
  // Capture 100% of errors
  replaysOnErrorSampleRate: 1.0,
  
  // Capture 10% of the replays of normal sessions  
  replaysSessionSampleRate: 0.1,
  
  // Enable automatic instrumentation
  integrations: [
    // Replay removed as it's not available in this Sentry version
  ],

  // Ignore specific errors
  beforeSend(event) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError' || 
          error?.value?.includes('Loading chunk') ||
          error?.value?.includes('Script error')) {
        return null; // Don't send these errors
      }
    }
    return event;
  },

  // Custom tags
  initialScope: {
    tags: {
      component: 'vobvorot-store',
      platform: 'nextjs',
    },
  },
});