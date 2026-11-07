import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests-ai', testMatch: '**/*.spec.ts', workers: 1,
  use: { baseURL: 'http://localhost:5173', browserName: 'chromium', headless: true },
  webServer: { command: 'npm run dev -- --host localhost --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: false },
});
