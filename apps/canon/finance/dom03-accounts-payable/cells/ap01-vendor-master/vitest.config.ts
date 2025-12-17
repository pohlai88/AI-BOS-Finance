/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration for AP-01 Vendor Master Cell
 * 
 * Supports:
 * - Browser mode for DOM testing
 * - Node mode for unit tests
 * - Integration tests with real database
 */

export default defineConfig({
  test: {
    // Test file patterns
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**', // E2E tests use Playwright
    ],

    // Browser mode for DOM/component tests
    // Uncomment to enable browser mode (requires @vitest/browser-playwright)
    // browser: {
    //   enabled: true,
    //   name: 'chromium',
    //   provider: 'playwright',
    //   headless: true,
    // },

    // Environment for non-browser tests
    environment: 'node',

    // Global setup
    globals: true,
    setupFiles: [path.resolve(__dirname, './__tests__/setup.ts')],

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        '*.ts',
        '!*.test.ts',
        '!*.spec.ts',
        '!errors.ts',
        '!index.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/dist/**',
      ],
    },

    // Test reporters
    reporters: ['verbose', 'json'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@aibos/kernel-core': path.resolve(__dirname, '../../../../../../packages/kernel-core/src'),
      '@aibos/canon-governance': path.resolve(__dirname, '../../../../../../packages/canon/A-Governance'),
    },
  },
});
