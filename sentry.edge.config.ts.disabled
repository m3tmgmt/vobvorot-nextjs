import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Capture 100% of transactions for performance monitoring
  tracesSampleRate: 1.0,
  
  // Edge runtime specific tags
  initialScope: {
    tags: {
      component: 'vobvorot-store',
      platform: 'nextjs-edge',
    },
  },
});