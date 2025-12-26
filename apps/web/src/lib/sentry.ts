import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize in production or staging
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_ENVIRONMENT || 'production',

      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Only send errors, not all events
      beforeSend(event) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          return null;
        }
        return event;
      },

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          // Only capture replays on errors
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Session replay - only on errors
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0, // 100% of errors get replay
    });
  }
}

// Re-export Sentry for use in error boundaries
export { Sentry };
