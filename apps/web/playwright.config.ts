import { defineConfig, devices } from '@playwright/test';

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
          command: 'pnpm --filter @react-template/web dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          cwd: '../..',
        },
      ],
});
