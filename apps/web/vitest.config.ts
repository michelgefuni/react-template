import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    env: {
      VITE_API_BASE_PATH: '/api',
      VITE_QUERY_STALE_TIME_MS: '30000',
    },
    coverage: {
      provider: 'v8',
      include: ['src/shared/lib/cn.ts', 'src/config/env.ts', 'src/features/**/*.tsx'],
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 50,
      },
    },
  },
});
