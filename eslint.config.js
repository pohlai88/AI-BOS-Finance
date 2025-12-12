// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

// Canon Identity Contract - Local ESLint Rules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const canonRules = require('./eslint-local-rules.cjs');

export default tseslint.config(
  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,

  // Main config for source files
  {
    files: [
      'src/**/*.{ts,tsx}',
      'app/**/*.{ts,tsx}',
      // Future monorepo support
      'apps/**/app/**/*.{ts,tsx}',
      'apps/**/src/**/*.{ts,tsx}',
      'packages/**/src/**/*.{ts,tsx}',
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettier,
      'canon': {
        rules: {
          'require-page-meta': canonRules['require-page-meta'],
          'no-raw-colors': canonRules['no-raw-colors'],
          'no-inline-style-colors': canonRules['no-inline-style-colors'],
          'no-svg-hardcoded-colors': canonRules['no-svg-hardcoded-colors'],
        },
      },
    },
    rules: {
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // The "Forensic" Rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Prettier integration
      'prettier/prettier': 'warn',

      // 🛡️ Drift Police: Ban hardcoded colors
      'canon/no-raw-colors': 'error',
    },
  },

  // 🛡️ Drift Police: Apply to all UI code paths (repo-wide coverage)
  {
    files: [
      'app/**/*.{ts,tsx}',
      'src/**/*.{ts,tsx}',
      // Future monorepo support
      'apps/**/app/**/*.{ts,tsx}',
      'apps/**/src/**/*.{ts,tsx}',
      'packages/**/src/**/*.{ts,tsx}',
    ],
    ignores: [
      // Escape hatch: Legacy/migration folders (quarantined drift)
      '**/__legacy__/**',
      '**/migration__/**',
      '**/__migration__/**',
    ],
    rules: {
      'canon/no-raw-colors': 'error',
      'canon/no-inline-style-colors': 'error',
      'canon/no-svg-hardcoded-colors': 'error',
    },
  },

  // Tailwind Governance: Ban arbitrary values in all files
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Warn on arbitrary values (w-[350px], p-[13px], etc.)
      // This enforces use of semantic tokens from tailwind.config.js
      // Example violations:
      // ❌ className="w-[350px]" → Should use: className="w-card" or semantic spacing
      // ❌ className="p-[13px]" → Should use: className="p-layout-md" or standard spacing
      // ✅ className="bg-surface-card" → Correct (semantic token)
      // ✅ className="p-4" → Correct (standard Tailwind spacing)
    },
  },

  // Canon Identity Contract - Enforce PAGE_META in canonical pages
  {
    files: [
      'src/views/**/*.tsx',
      'src/modules/**/*Page.tsx',
      'apps/web/canon-pages/**/*.tsx',
    ],
    rules: {
      'canon/require-page-meta': 'error',
    },
  },

  // Ignore patterns
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '*.config.ts'],
  },

  storybook.configs["flat/recommended"]
);

