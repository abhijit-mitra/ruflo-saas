import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'cd src/backend && npx ts-node src/server.ts',
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd src/frontend && npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
