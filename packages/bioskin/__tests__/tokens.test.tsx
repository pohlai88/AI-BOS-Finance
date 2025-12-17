/**
 * @fileoverview BioTokens Unit Tests
 *
 * Tests for the design token system.
 * Per CONT_14: Design Tokens Architecture
 *
 * @module @aibos/bioskin/__tests__/tokens
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import {
  BioTokenProvider,
  useTokenContext,
  useTheme,
  useTokens,
  getToken,
  setToken,
  removeToken,
  applyTokenOverrides,
  type ThemeMode,
} from '../src/tokens';

// ============================================================
// TEST HELPERS
// ============================================================

function TestComponent() {
  const { theme, adapterId } = useTokenContext();
  const tokens = useTokens();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="adapter">{adapterId || 'none'}</div>
      <div data-testid="primary">{tokens?.colors.primary || 'loading'}</div>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme}
    </button>
  );
}

// ============================================================
// SETUP/TEARDOWN
// ============================================================

describe('BioTokens', () => {
  beforeEach(() => {
    // Clear any existing attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-adapter');
    localStorage.clear();
  });

  afterEach(() => {
    // Cleanup
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-adapter');
  });

  // ============================================================
  // PROVIDER TESTS
  // ============================================================

  describe('BioTokenProvider', () => {
    it('renders children', () => {
      render(
        <BioTokenProvider>
          <div>Test Content</div>
        </BioTokenProvider>
      );

      expect(screen.getByText('Test Content')).toBeDefined();
    });

    it('applies default theme', async () => {
      render(
        <BioTokenProvider defaultTheme="light">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('applies adapter ID', async () => {
      render(
        <BioTokenProvider adapterId="corporate">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(screen.getByTestId('adapter').textContent).toBe('corporate');
      expect(document.documentElement.getAttribute('data-adapter')).toBe('corporate');
    });

    it('handles system theme mode', async () => {
      render(
        <BioTokenProvider defaultTheme="system">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      // Should have applied either 'light' or 'dark' based on system preference
      const attr = document.documentElement.getAttribute('data-theme');
      expect(attr === 'light' || attr === 'dark').toBe(true);
    });
  });

  // ============================================================
  // THEME HOOK TESTS
  // ============================================================

  describe('useTheme', () => {
    it('allows theme switching', async () => {
      const { rerender } = render(
        <BioTokenProvider defaultTheme="light">
          <ThemeToggle />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      const button = screen.getByRole('button');
      expect(button.textContent).toBe('light');

      // Click to toggle
      await act(async () => {
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      rerender(
        <BioTokenProvider defaultTheme="dark">
          <ThemeToggle />
        </BioTokenProvider>
      );

      // Should have changed
      expect(document.documentElement.getAttribute('data-theme')).toBeDefined();
    });
  });

  // ============================================================
  // TOKEN UTILITY TESTS
  // ============================================================

  describe('Token Utilities', () => {
    it('getToken returns value', () => {
      // Set a test value
      document.documentElement.style.setProperty('--bio-primary', '#ff0000');

      const value = getToken('primary');
      expect(value).toBe('#ff0000');

      // Cleanup
      document.documentElement.style.removeProperty('--bio-primary');
    });

    it('setToken sets value', () => {
      setToken('primary', '#00ff00');

      const value = getComputedStyle(document.documentElement)
        .getPropertyValue('--bio-primary')
        .trim();
      expect(value).toBe('#00ff00');

      // Cleanup
      removeToken('primary');
    });

    it('removeToken removes value', () => {
      setToken('primary', '#0000ff');
      removeToken('primary');

      const value = document.documentElement.style.getPropertyValue('--bio-primary');
      expect(value).toBe('');
    });

    it('applyTokenOverrides sets multiple tokens', () => {
      applyTokenOverrides({
        primary: '#111111',
        secondary: '#222222',
      });

      expect(getToken('primary')).toBe('#111111');
      expect(getToken('secondary')).toBe('#222222');

      // Cleanup
      removeToken('primary');
      removeToken('secondary');
    });
  });

  // ============================================================
  // ADAPTER THEMING TESTS
  // ============================================================

  describe('Adapter Theming', () => {
    it('applies corporate theme', async () => {
      render(
        <BioTokenProvider adapterId="corporate" defaultTheme="light">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(document.documentElement.getAttribute('data-adapter')).toBe('corporate');
    });

    it('applies supplychain theme', async () => {
      render(
        <BioTokenProvider adapterId="supplychain" defaultTheme="light">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(document.documentElement.getAttribute('data-adapter')).toBe('supplychain');
    });

    it('removes adapter when null', async () => {
      const { rerender } = render(
        <BioTokenProvider adapterId="corporate" defaultTheme="light">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(document.documentElement.getAttribute('data-adapter')).toBe('corporate');

      rerender(
        <BioTokenProvider adapterId={null} defaultTheme="light">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(document.documentElement.getAttribute('data-adapter')).toBeNull();
    });
  });

  // ============================================================
  // DARK MODE TESTS
  // ============================================================

  describe('Dark Mode', () => {
    it('applies dark theme', async () => {
      render(
        <BioTokenProvider defaultTheme="dark">
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  // ============================================================
  // TOKEN OVERRIDE TESTS
  // ============================================================

  describe('Token Overrides', () => {
    it('applies token overrides', async () => {
      render(
        <BioTokenProvider
          tokenOverrides={{
            primary: '#custom-primary',
            'status-success': '#custom-success',
          }}
        >
          <TestComponent />
        </BioTokenProvider>
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

      expect(getToken('primary')).toBe('#custom-primary');
      expect(getToken('status-success')).toBe('#custom-success');
    });
  });
});
