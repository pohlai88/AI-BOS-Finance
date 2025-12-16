/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import path from 'path';

/**
 * @aibos/bioskin - Vitest Browser Mode Configuration
 * 
 * Unified testing: Unit + Component + E2E-style in ONE runner.
 * Uses real browser (Chromium via Playwright) instead of jsdom.
 */
export default defineConfig({
  test: {
    name: 'bioskin',
    globals: true,

    // Browser Mode - real browser testing
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true, // Set to false to see browser during tests
      instances: [
        { browser: 'chromium' },
      ],
    },

    // Test file patterns
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],

    // Setup files
    setupFiles: ['./__tests__/setup.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/foundation/**', '**/*.d.ts'],
    },

    // Path aliases
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
