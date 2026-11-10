import { defineConfig, devices } from '@playwright/test';

const webDev = [
  // @feature-bff-start
  'pnpm --filter @react-template/bff build',
  // @feature-bff-end
  'pnpm --filter @react-template/web dev',
].join(' && ');

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    ...devices['Desktop Chrome'],
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        // @feature-bff-start
        {
          command: 'pnpm --filter @react-template/bff dev',
          url: 'http://localhost:3001/api/health',
          reuseExistingServer: true,
          cwd: '../..',
        },
        // @feature-bff-end
        {
          command: webDev,
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          cwd: '../..',
        },
      ],
});
