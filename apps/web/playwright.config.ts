import { defineConfig, devices } from '@playwright/test';

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
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI
    ? {
        command: 'npx serve@latest dist -l 3000 --single',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 60000,
      }
    : undefined,
});
