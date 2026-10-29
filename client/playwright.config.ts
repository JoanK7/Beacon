import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against an already running stack (API + client):
//   npm run build && npm start         (client on :3000, API on :4000)
//   npm run test:e2e
// Set PW_CHANNEL=msedge or chrome to use an installed browser instead of
// downloading Playwright's Chromium.
//
// Compatibility matrix: set E2E_ALL_BROWSERS=1 to also run every journey on
// Firefox, WebKit (Safari's engine), an iPhone, an iPad and a small Android
// phone (first run: npx playwright install firefox webkit). CI runs the two
// Chromium projects only, to stay fast.
const channel = process.env.PW_CHANNEL || undefined;

const compatibility = [
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit-safari', use: { ...devices['Desktop Safari'] } },
  { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
  { name: 'ipad', use: { ...devices['iPad (gen 7)'] } },
  { name: 'small-android', use: { ...devices['Galaxy S8'], channel } },
];

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  // The HTML report (playwright-report/index.html) is the saved evidence of each run.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    ...(process.env.E2E_ALL_BROWSERS ? compatibility : []),
  ],
});
