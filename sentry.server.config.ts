import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Capture 100% of transactions for performance monitoring
  tracesSampleRate: 1.0,
  
  // Enable automatic instrumentation for server-side
  integrations: [],

  // Custom error filtering for server-side
  beforeSend(event) {
    // Filter out database connection timeouts (common in serverless)
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('connection timeout') ||
          error?.value?.includes('ECONNRESET')) {
        return null;
      }
    }
    return event;
  },

  // Server-specific tags
  initialScope: {
    tags: {
      component: 'vobvorot-store',
      platform: 'nextjs-server',
    },
  },
});