import { defineConfig } from 'vitest/config';

const coverageThreshold = 45;

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',
        'src/client.ts',
        'src/logger.ts',
        'src/dependencies.ts',
        'src/clients/generated/**',
      ],
      thresholds: {
        lines: coverageThreshold,
        functions: coverageThreshold,
        statements: coverageThreshold,
        branches: 35,
      },
    },
  },
});
