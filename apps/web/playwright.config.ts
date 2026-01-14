import { defineConfig, devices } from '@playwright/test';

// Use environment variable for base URL, fallback to localhost
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isLiveEnvironment = baseURL.includes('https://');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  // Use list reporter for real-time progress + github for annotations
  reporter: process.env.CI ? [['list'], ['github']] : 'html',
  timeout: 30000,

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only start local web server when not testing against live environment
  webServer:
    process.env.CI && !isLiveEnvironment
      ? {
          command: 'npx serve@latest dist -l 3000 --single',
          url: 'http://localhost:3000',
          reuseExistingServer: false,
          timeout: 60000,
        }
      : undefined,
});
