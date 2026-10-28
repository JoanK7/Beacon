import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against an already running stack (API + client):
//   npm run build && npm start         (client on :3000, API on :4000)
//   npm run test:e2e
// Set PW_CHANNEL=msedge or chrome to use an installed browser instead of
// downloading Playwright's Chromium.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    channel: process.env.PW_CHANNEL || undefined,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL || undefined } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined } },
  ],
});
