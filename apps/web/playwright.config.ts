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

  webServer: {
    // In CI, serve the pre-built static files; locally, use dev server
    command: process.env.CI ? 'npx serve@latest dist -l 3000' : 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60000 : 180000, // 1 minute in CI, 3 minutes locally for slower dev server startups
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
