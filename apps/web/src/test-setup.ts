import { afterEach } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register happy-dom BEFORE any testing-library imports
GlobalRegistrator.register();

// Verify DOM is available
if (typeof document === 'undefined') {
  throw new Error('DOM not available after happy-dom registration');
}

// Clean up DOM between tests
afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});
