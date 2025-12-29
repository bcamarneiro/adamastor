import { afterEach, mock } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register happy-dom globals synchronously before anything else
GlobalRegistrator.register();

// Mock external dependencies that cause issues in tests
mock.module('@sentry/react', () => ({
  init: mock(() => {}),
  captureException: mock(() => {}),
  browserTracingIntegration: mock(() => ({})),
  replayIntegration: mock(() => ({})),
}));

// Clean up the DOM after each test to prevent test pollution
afterEach(() => {
  // Manually clean up document.body
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = '';
  }
});
