import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test file patterns - only use tests/ directory
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '__tests__/**'],

    // Environment
    environment: 'node',

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Global setup (for Day 4 integration tests)
    // globalSetup: './tests/setup.ts',

    // Coverage (optional, enable when needed)
    // coverage: {
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    //   include: ['src/**/*.ts'],
    // },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
