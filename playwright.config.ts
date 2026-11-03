import { defineConfig, devices } from '@playwright/test';

const port = 4201;
const inCi = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  forbidOnly: inCi,
  // The tests read live content from Storyblok, so allow for a passing network problem on CI
  retries: inCi ? 1 : 0,
  reporter: inCi ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // The production build with server rendering, without the dev server's live reload
    command: `npx ng serve --configuration production --port ${port} --hmr=false --live-reload=false`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !inCi,
    timeout: 180_000,
  },
});
