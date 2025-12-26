import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry() {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('  Sentry: disabled (no SENTRY_DSN)');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.ENVIRONMENT || 'local',

    // Performance monitoring - lower for batch jobs
    tracesSampleRate: 0.1,

    // Don't send in local development
    enabled: process.env.ENVIRONMENT !== 'local',

    // Add useful context
    beforeSend(event) {
      // Add pipeline context if available
      return event;
    },
  });

  initialized = true;
  console.log('  Sentry: enabled');
}

/**
 * Report an error to Sentry with context
 */
export function reportError(error: Error, context?: Record<string, unknown>) {
  console.error('Error:', error.message);

  if (initialized) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Report a pipeline step failure
 */
export function reportPipelineError(
  stepName: string,
  error: Error,
  context?: Record<string, unknown>
) {
  if (initialized) {
    Sentry.captureException(error, {
      tags: {
        pipeline_step: stepName,
      },
      extra: {
        ...context,
        step: stepName,
      },
    });
  }
}

/**
 * Flush pending events before process exit
 */
export async function flushSentry() {
  if (initialized) {
    await Sentry.close(2000);
  }
}

// Re-export Sentry for advanced usage
export { Sentry };
