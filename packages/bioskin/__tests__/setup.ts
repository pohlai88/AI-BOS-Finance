/**
 * @aibos/bioskin - Test Setup
 * 
 * Configures Vitest Browser Mode with Playwright.
 * Provides custom matchers and global utilities.
 */

import '@testing-library/jest-dom/vitest';

// Global test utilities
declare global {
  // Add any global test helpers here
}

// Reset any global state between tests
beforeEach(() => {
  // Clean up any test state
});

afterEach(() => {
  // Clean up after each test
});

console.log('[bioskin] Test environment initialized - Browser Mode with Playwright');
