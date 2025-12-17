> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_14  
> **Version:** 1.0.0  
> **Certified Date:** 2025-01-XX  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS visual design and theming  
> **Authority:** Design System Team  
> **Derives From:** CONT_10 BioSkin Architecture, CONT_12 BioRegistry

---

# CONT_14: Design Tokens Architecture
## CSS Variables for Industry-Agnostic Theming

**Purpose:** Define the **Design Token** system that enables runtime theming and industry-specific visual customization WITHOUT changing component code.

---

## 1. Executive Summary

### 1.1 The Problem

Different industries may want different visual treatments:
- **Finance:** Blue for trust, red for negative amounts
- **Healthcare:** Green for health, red for critical alerts  
- **Supply Chain:** Blue for cold chain, amber for warnings
- **Agriculture:** Green for growth, brown for soil

### 1.2 The Solution: CSS Variables

Design tokens are implemented as **CSS custom properties** (variables) that:
1. Are **semantic** — named by purpose, not appearance (`--bio-primary`, not `--bio-blue`)
2. Are **hierarchical** — from global to component-specific
3. Are **runtime switchable** — change theme without rebuild
4. Are **adapter-injectable** — industry adapters can override

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TOKEN RESOLUTION FLOW                               │
│                                                                             │
│  Component uses:  var(--bio-status-danger)                                  │
│          ↓                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Resolution Order:                                                        ││
│  │ 1. Component scope (.bio-table { --bio-status-danger: #... })           ││
│  │ 2. Theme scope ([data-theme="dark"] { --bio-status-danger: #... })      ││
│  │ 3. Adapter scope ([data-adapter="healthcare"] { ... })                  ││
│  │ 4. Root scope (:root { --bio-status-danger: #ef4444 })                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│          ↓                                                                  │
│  Resolved Value: #ef4444 (or override)                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Token Categories

### 2.1 Token Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRIMITIVE TOKENS (Raw Values)                       │
│  --bio-raw-blue-500: #3b82f6;                                               │
│  --bio-raw-red-500: #ef4444;                                                │
│  --bio-raw-spacing-4: 1rem;                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEMANTIC TOKENS (Purpose-Based)                     │
│  --bio-primary: var(--bio-raw-blue-500);                                    │
│  --bio-status-danger: var(--bio-raw-red-500);                               │
│  --bio-space-md: var(--bio-raw-spacing-4);                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT TOKENS (Specific Use)                     │
│  --bio-btn-bg: var(--bio-primary);                                          │
│  --bio-table-row-danger: var(--bio-status-danger);                          │
│  --bio-form-field-gap: var(--bio-space-md);                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Token Categories

| Category | Prefix | Purpose | Examples |
|----------|--------|---------|----------|
| **Color** | `--bio-color-*` | All colors | `--bio-color-primary`, `--bio-color-bg` |
| **Status** | `--bio-status-*` | State colors | `--bio-status-success`, `--bio-status-danger` |
| **Text** | `--bio-text-*` | Typography colors | `--bio-text-primary`, `--bio-text-muted` |
| **Space** | `--bio-space-*` | Spacing values | `--bio-space-sm`, `--bio-space-lg` |
| **Font** | `--bio-font-*` | Typography | `--bio-font-family`, `--bio-font-size-lg` |
| **Radius** | `--bio-radius-*` | Border radius | `--bio-radius-sm`, `--bio-radius-full` |
| **Shadow** | `--bio-shadow-*` | Box shadows | `--bio-shadow-sm`, `--bio-shadow-lg` |
| **Z-Index** | `--bio-z-*` | Stacking | `--bio-z-modal`, `--bio-z-tooltip` |
| **Transition** | `--bio-transition-*` | Animations | `--bio-transition-fast`, `--bio-transition-spring` |

---

## 3. Token Definitions

### 3.1 Root Token Definitions

```css
/* packages/bioskin/src/tokens/tokens.css */

:root {
  /* ================================================================
     PRIMITIVE TOKENS (Raw Values) - Do NOT use directly in components
     ================================================================ */
  
  /* Color Primitives */
  --bio-raw-white: #ffffff;
  --bio-raw-black: #000000;
  
  /* Gray Scale */
  --bio-raw-gray-50: #f9fafb;
  --bio-raw-gray-100: #f3f4f6;
  --bio-raw-gray-200: #e5e7eb;
  --bio-raw-gray-300: #d1d5db;
  --bio-raw-gray-400: #9ca3af;
  --bio-raw-gray-500: #6b7280;
  --bio-raw-gray-600: #4b5563;
  --bio-raw-gray-700: #374151;
  --bio-raw-gray-800: #1f2937;
  --bio-raw-gray-900: #111827;
  --bio-raw-gray-950: #030712;
  
  /* Blue */
  --bio-raw-blue-50: #eff6ff;
  --bio-raw-blue-100: #dbeafe;
  --bio-raw-blue-500: #3b82f6;
  --bio-raw-blue-600: #2563eb;
  --bio-raw-blue-700: #1d4ed8;
  
  /* Green */
  --bio-raw-green-50: #f0fdf4;
  --bio-raw-green-500: #22c55e;
  --bio-raw-green-600: #16a34a;
  
  /* Red */
  --bio-raw-red-50: #fef2f2;
  --bio-raw-red-500: #ef4444;
  --bio-raw-red-600: #dc2626;
  
  /* Amber */
  --bio-raw-amber-50: #fffbeb;
  --bio-raw-amber-500: #f59e0b;
  --bio-raw-amber-600: #d97706;
  
  /* Spacing */
  --bio-raw-space-0: 0;
  --bio-raw-space-1: 0.25rem;
  --bio-raw-space-2: 0.5rem;
  --bio-raw-space-3: 0.75rem;
  --bio-raw-space-4: 1rem;
  --bio-raw-space-5: 1.25rem;
  --bio-raw-space-6: 1.5rem;
  --bio-raw-space-8: 2rem;
  --bio-raw-space-10: 2.5rem;
  --bio-raw-space-12: 3rem;
  --bio-raw-space-16: 4rem;
  
  /* Font Sizes */
  --bio-raw-font-xs: 0.75rem;
  --bio-raw-font-sm: 0.875rem;
  --bio-raw-font-base: 1rem;
  --bio-raw-font-lg: 1.125rem;
  --bio-raw-font-xl: 1.25rem;
  --bio-raw-font-2xl: 1.5rem;
  --bio-raw-font-3xl: 1.875rem;
  
  /* Border Radius */
  --bio-raw-radius-none: 0;
  --bio-raw-radius-sm: 0.25rem;
  --bio-raw-radius-md: 0.375rem;
  --bio-raw-radius-lg: 0.5rem;
  --bio-raw-radius-xl: 0.75rem;
  --bio-raw-radius-2xl: 1rem;
  --bio-raw-radius-full: 9999px;
  
  /* ================================================================
     SEMANTIC TOKENS (Use these in components)
     ================================================================ */
  
  /* Primary Colors */
  --bio-primary: var(--bio-raw-blue-600);
  --bio-primary-hover: var(--bio-raw-blue-700);
  --bio-primary-light: var(--bio-raw-blue-50);
  --bio-secondary: var(--bio-raw-gray-600);
  --bio-secondary-hover: var(--bio-raw-gray-700);
  
  /* Background */
  --bio-bg: var(--bio-raw-white);
  --bio-bg-subtle: var(--bio-raw-gray-50);
  --bio-bg-muted: var(--bio-raw-gray-100);
  --bio-bg-elevated: var(--bio-raw-white);
  
  /* Text */
  --bio-text-primary: var(--bio-raw-gray-900);
  --bio-text-secondary: var(--bio-raw-gray-600);
  --bio-text-muted: var(--bio-raw-gray-400);
  --bio-text-inverted: var(--bio-raw-white);
  
  /* Borders */
  --bio-border: var(--bio-raw-gray-200);
  --bio-border-subtle: var(--bio-raw-gray-100);
  --bio-border-focus: var(--bio-raw-blue-500);
  
  /* Status Colors */
  --bio-status-success: var(--bio-raw-green-500);
  --bio-status-success-bg: var(--bio-raw-green-50);
  --bio-status-warning: var(--bio-raw-amber-500);
  --bio-status-warning-bg: var(--bio-raw-amber-50);
  --bio-status-danger: var(--bio-raw-red-500);
  --bio-status-danger-bg: var(--bio-raw-red-50);
  --bio-status-info: var(--bio-raw-blue-500);
  --bio-status-info-bg: var(--bio-raw-blue-50);
  
  /* Spacing (Semantic) */
  --bio-space-xs: var(--bio-raw-space-1);
  --bio-space-sm: var(--bio-raw-space-2);
  --bio-space-md: var(--bio-raw-space-4);
  --bio-space-lg: var(--bio-raw-space-6);
  --bio-space-xl: var(--bio-raw-space-8);
  --bio-space-2xl: var(--bio-raw-space-12);
  
  /* Typography */
  --bio-font-family: ui-sans-serif, system-ui, sans-serif;
  --bio-font-mono: ui-monospace, monospace;
  --bio-font-size-xs: var(--bio-raw-font-xs);
  --bio-font-size-sm: var(--bio-raw-font-sm);
  --bio-font-size-base: var(--bio-raw-font-base);
  --bio-font-size-lg: var(--bio-raw-font-lg);
  --bio-font-size-xl: var(--bio-raw-font-xl);
  --bio-font-size-2xl: var(--bio-raw-font-2xl);
  --bio-font-size-3xl: var(--bio-raw-font-3xl);
  
  /* Border Radius */
  --bio-radius-sm: var(--bio-raw-radius-sm);
  --bio-radius-md: var(--bio-raw-radius-md);
  --bio-radius-lg: var(--bio-raw-radius-lg);
  --bio-radius-xl: var(--bio-raw-radius-xl);
  --bio-radius-full: var(--bio-raw-radius-full);
  
  /* Shadows */
  --bio-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --bio-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --bio-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --bio-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Z-Index */
  --bio-z-base: 0;
  --bio-z-dropdown: 50;
  --bio-z-sticky: 100;
  --bio-z-modal: 200;
  --bio-z-popover: 300;
  --bio-z-tooltip: 400;
  --bio-z-toast: 500;
  
  /* Transitions */
  --bio-transition-fast: 150ms ease;
  --bio-transition-normal: 200ms ease;
  --bio-transition-slow: 300ms ease;
  --bio-transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 3.2 Dark Mode Tokens

```css
/* Dark mode overrides */
[data-theme="dark"] {
  /* Background */
  --bio-bg: var(--bio-raw-gray-950);
  --bio-bg-subtle: var(--bio-raw-gray-900);
  --bio-bg-muted: var(--bio-raw-gray-800);
  --bio-bg-elevated: var(--bio-raw-gray-900);
  
  /* Text */
  --bio-text-primary: var(--bio-raw-gray-50);
  --bio-text-secondary: var(--bio-raw-gray-300);
  --bio-text-muted: var(--bio-raw-gray-500);
  --bio-text-inverted: var(--bio-raw-gray-900);
  
  /* Borders */
  --bio-border: var(--bio-raw-gray-700);
  --bio-border-subtle: var(--bio-raw-gray-800);
  
  /* Status (slightly adjusted for dark mode visibility) */
  --bio-status-success: var(--bio-raw-green-500);
  --bio-status-success-bg: color-mix(in srgb, var(--bio-raw-green-500) 20%, transparent);
  --bio-status-warning: var(--bio-raw-amber-500);
  --bio-status-warning-bg: color-mix(in srgb, var(--bio-raw-amber-500) 20%, transparent);
  --bio-status-danger: var(--bio-raw-red-500);
  --bio-status-danger-bg: color-mix(in srgb, var(--bio-raw-red-500) 20%, transparent);
  --bio-status-info: var(--bio-raw-blue-500);
  --bio-status-info-bg: color-mix(in srgb, var(--bio-raw-blue-500) 20%, transparent);
}
```

---

## 4. Industry Adapter Overrides

### 4.1 Adapter Token Injection

```css
/* Healthcare Adapter - Green primary, clinical feel */
[data-adapter="healthcare"] {
  --bio-primary: #059669;  /* Emerald for health */
  --bio-primary-hover: #047857;
  --bio-primary-light: #d1fae5;
}

/* Supply Chain Adapter - Sky blue for cold chain */
[data-adapter="supplychain"] {
  --bio-primary: #0ea5e9;  /* Sky for cold chain */
  --bio-primary-hover: #0284c7;
  --bio-primary-light: #e0f2fe;
  
  /* Temperature-specific status */
  --bio-status-cold: #0ea5e9;
  --bio-status-cold-bg: #e0f2fe;
  --bio-status-frozen: #3b82f6;
  --bio-status-frozen-bg: #dbeafe;
}

/* Agriculture Adapter - Green for growth */
[data-adapter="agriops"] {
  --bio-primary: #16a34a;  /* Green for growth */
  --bio-primary-hover: #15803d;
  --bio-primary-light: #dcfce7;
  
  /* Harvest-specific status */
  --bio-status-ready: #16a34a;
  --bio-status-growing: #84cc16;
  --bio-status-dormant: #78716c;
}

/* Corporate Adapter - Navy for trust */
[data-adapter="corporate"] {
  --bio-primary: #1e40af;  /* Navy for trust */
  --bio-primary-hover: #1e3a8a;
  --bio-primary-light: #dbeafe;
}

/* Production/Manufacturing - Slate for industrial */
[data-adapter="production"] {
  --bio-primary: #475569;  /* Slate for industrial */
  --bio-primary-hover: #334155;
  --bio-primary-light: #f1f5f9;
}
```

### 4.2 TypeScript Token Interface

```typescript
// packages/bioskin/src/tokens/types.ts

/**
 * Design token interface for TypeScript access
 */
export interface DesignTokens {
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    secondaryHover: string;
  };
  
  status: {
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    danger: string;
    dangerBg: string;
    info: string;
    infoBg: string;
  };
  
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverted: string;
  };
  
  bg: {
    default: string;
    subtle: string;
    muted: string;
    elevated: string;
  };
  
  border: {
    default: string;
    subtle: string;
    focus: string;
  };
  
  space: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  zIndex: {
    base: number;
    dropdown: number;
    sticky: number;
    modal: number;
    popover: number;
    tooltip: number;
    toast: number;
  };
}

/**
 * Get CSS variable value at runtime
 */
export function getToken(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--bio-${name}`).trim();
}

/**
 * Set CSS variable value at runtime
 */
export function setToken(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(`--bio-${name}`, value);
}
```

---

## 5. Component Usage

### 5.1 Using Tokens in Components

```tsx
// ✅ CORRECT - Use CSS variables
function StatusBadge({ status }: { status: 'success' | 'warning' | 'danger' }) {
  return (
    <span
      className="px-2 py-1 rounded-md text-sm font-medium"
      style={{
        backgroundColor: `var(--bio-status-${status}-bg)`,
        color: `var(--bio-status-${status})`,
      }}
    >
      {status}
    </span>
  );
}

// ❌ VIOLATION - Hardcoded colors
function StatusBadge({ status }: { status: 'success' | 'warning' | 'danger' }) {
  const colors = {
    success: { bg: '#dcfce7', text: '#16a34a' },  // Hardcoded!
    warning: { bg: '#fef3c7', text: '#d97706' },
    danger: { bg: '#fee2e2', text: '#dc2626' },
  };
  // ...
}
```

### 5.2 Tailwind Integration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bio: {
          primary: 'var(--bio-primary)',
          'primary-hover': 'var(--bio-primary-hover)',
          'primary-light': 'var(--bio-primary-light)',
          secondary: 'var(--bio-secondary)',
        },
        'bio-status': {
          success: 'var(--bio-status-success)',
          'success-bg': 'var(--bio-status-success-bg)',
          warning: 'var(--bio-status-warning)',
          'warning-bg': 'var(--bio-status-warning-bg)',
          danger: 'var(--bio-status-danger)',
          'danger-bg': 'var(--bio-status-danger-bg)',
        },
        'bio-text': {
          primary: 'var(--bio-text-primary)',
          secondary: 'var(--bio-text-secondary)',
          muted: 'var(--bio-text-muted)',
        },
        'bio-bg': {
          DEFAULT: 'var(--bio-bg)',
          subtle: 'var(--bio-bg-subtle)',
          muted: 'var(--bio-bg-muted)',
        },
        'bio-border': {
          DEFAULT: 'var(--bio-border)',
          subtle: 'var(--bio-border-subtle)',
        },
      },
      spacing: {
        'bio-xs': 'var(--bio-space-xs)',
        'bio-sm': 'var(--bio-space-sm)',
        'bio-md': 'var(--bio-space-md)',
        'bio-lg': 'var(--bio-space-lg)',
        'bio-xl': 'var(--bio-space-xl)',
      },
      borderRadius: {
        'bio-sm': 'var(--bio-radius-sm)',
        'bio-md': 'var(--bio-radius-md)',
        'bio-lg': 'var(--bio-radius-lg)',
      },
      boxShadow: {
        'bio-sm': 'var(--bio-shadow-sm)',
        'bio-md': 'var(--bio-shadow-md)',
        'bio-lg': 'var(--bio-shadow-lg)',
      },
    },
  },
};
```

### 5.3 Usage with Tailwind Classes

```tsx
// Now use semantic Tailwind classes
function Card({ children }) {
  return (
    <div className="bg-bio-bg border border-bio-border rounded-bio-lg shadow-bio-md p-bio-md">
      <h2 className="text-bio-text-primary text-lg font-semibold">Title</h2>
      <p className="text-bio-text-secondary">{children}</p>
    </div>
  );
}

// Button with hover states
function Button({ children }) {
  return (
    <button className="bg-bio-primary hover:bg-bio-primary-hover text-white rounded-bio-md px-bio-md py-bio-sm">
      {children}
    </button>
  );
}
```

---

## 6. Token Provider

### 6.1 React Provider

```typescript
// packages/bioskin/src/tokens/BioTokenProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { DesignTokens } from './types';

interface TokenContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  adapterId: string | null;
}

const TokenContext = createContext<TokenContextValue | null>(null);

interface BioTokenProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  adapterId?: string;
  tokenOverrides?: Partial<Record<string, string>>;
}

export function BioTokenProvider({
  children,
  defaultTheme = 'system',
  adapterId,
  tokenOverrides,
}: BioTokenProviderProps) {
  const [theme, setTheme] = React.useState(defaultTheme);
  
  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.setAttribute('data-theme', systemTheme);
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);
  
  // Apply adapter
  useEffect(() => {
    const root = document.documentElement;
    if (adapterId) {
      root.setAttribute('data-adapter', adapterId);
    } else {
      root.removeAttribute('data-adapter');
    }
  }, [adapterId]);
  
  // Apply token overrides
  useEffect(() => {
    if (!tokenOverrides) return;
    
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokenOverrides)) {
      root.style.setProperty(`--bio-${key}`, value);
    }
    
    return () => {
      for (const key of Object.keys(tokenOverrides)) {
        root.style.removeProperty(`--bio-${key}`);
      }
    };
  }, [tokenOverrides]);
  
  const value = useMemo(() => ({
    theme,
    setTheme,
    adapterId: adapterId ?? null,
  }), [theme, adapterId]);
  
  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens(): TokenContextValue {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within BioTokenProvider');
  }
  return context;
}
```

---

## 7. Validation & Enforcement

### 7.1 CI Checks

```yaml
# .github/workflows/token-validation.yml
name: Design Token Validation

on: [push, pull_request]

jobs:
  no-hardcoded-colors:
    runs-on: ubuntu-latest
    steps:
      - name: Check for hardcoded colors
        run: |
          # Check for hex colors in component files
          if grep -rn "#[0-9a-fA-F]\{3,8\}" packages/bioskin/src --include="*.tsx" | grep -v "tokens.css"; then
            echo "❌ Found hardcoded colors in components"
            exit 1
          fi
          
      - name: Check for hardcoded colors in styles
        run: |
          # Check for colors that should use tokens
          if grep -rn "rgb\|rgba\|hsl" packages/bioskin/src --include="*.tsx" | grep -v "tokens.css"; then
            echo "❌ Found hardcoded rgb/hsl colors"
            exit 1
          fi
          
      - name: Verify token usage
        run: |
          # Ensure components use var(--bio-*)
          node scripts/verify-token-usage.js
```

### 7.2 Token Usage Verification Script

```javascript
// scripts/verify-token-usage.js
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('packages/bioskin/src/**/*.tsx');
const violations = [];

const forbiddenPatterns = [
  { pattern: /#[0-9a-fA-F]{3,8}/g, name: 'Hardcoded hex color' },
  { pattern: /rgba?\([^)]+\)/g, name: 'Hardcoded rgb color' },
  { pattern: /hsla?\([^)]+\)/g, name: 'Hardcoded hsl color' },
];

for (const file of files) {
  if (file.includes('tokens.css') || file.includes('tokens.ts')) continue;
  
  const content = fs.readFileSync(file, 'utf8');
  
  for (const { pattern, name } of forbiddenPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push({ file, name, matches });
    }
  }
}

if (violations.length > 0) {
  console.error('❌ Token violations found:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.name} - ${v.matches.slice(0, 3).join(', ')}`);
  }
  process.exit(1);
}

console.log('✅ All components use design tokens');
```

---

## 8. Summary

### Key Decisions

1. **CSS Variables** — Runtime switchable, no rebuild required
2. **Semantic Naming** — Purpose-based, not appearance-based
3. **Three Layers** — Primitive → Semantic → Component
4. **Adapter Injection** — Industry adapters can override tokens

### Token Rules

| Rule | Description |
|------|-------------|
| **No hardcoded colors** | All colors via `var(--bio-*)` |
| **Semantic naming** | `--bio-primary`, not `--bio-blue` |
| **Adapter scoped** | `[data-adapter="x"]` for overrides |
| **Dark mode ready** | `[data-theme="dark"]` for theme |

---

**Status:** ✅ ACTIVE  
**Supersedes:** None (New Contract)  
**Depends On:** CONT_10, CONT_12  
**Last Updated:** 2025-01-XX  
**Maintainer:** AI-BOS Design System Team  
**Review Cycle:** Quarterly
