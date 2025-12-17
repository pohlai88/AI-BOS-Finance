import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: ['__tests__/**/*.browser.test.ts', '__tests__/integration/**'],
    setupFiles: ['./__tests__/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@aibos/kernel-core': path.resolve(__dirname, '../../../../../packages/kernel-core/src'),
      '@aibos/kernel-adapters': path.resolve(__dirname, '../../../../../packages/kernel-adapters/src'),
      '@aibos/canon-governance': path.resolve(__dirname, '../../../../../packages/canon-governance/src'),
    },
  },
});
