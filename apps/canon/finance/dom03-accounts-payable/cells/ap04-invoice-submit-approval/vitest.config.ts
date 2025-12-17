import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@aibos/kernel-core': path.resolve(__dirname, '../../../../../packages/kernel-core/src'),
      '@aibos/kernel-adapters': path.resolve(__dirname, '../../../../../packages/kernel-adapters/src'),
      '@aibos/canon-governance': path.resolve(__dirname, '../../../../../packages/canon-governance/src'),
    },
  },
});
