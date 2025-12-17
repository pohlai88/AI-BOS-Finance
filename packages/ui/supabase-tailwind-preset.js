/**
 * Supabase Design System - Tailwind CSS Preset
 * =============================================
 * 
 * Extracted from: github.com/supabase/supabase/packages/config
 * Version: December 2024 (Latest)
 * 
 * Usage in tailwind.config.js:
 *   const supabasePreset = require('./packages/ui/supabase-tailwind-preset');
 *   
 *   module.exports = {
 *     presets: [supabasePreset],
 *     // ... your config
 *   };
 * 
 * Or merge manually:
 *   theme: {
 *     extend: {
 *       ...supabasePreset.theme.extend,
 *       // your overrides
 *     }
 *   }
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme*="dark"]'],
  theme: {
    extend: {
      // =====================================================================
      // COLORS
      // =====================================================================
      colors: {
        // Supabase Brand (Green)
        brand: {
          DEFAULT: 'hsl(var(--brand-default) / <alpha-value>)',
          200: 'hsl(var(--brand-200) / <alpha-value>)',
          300: 'hsl(var(--brand-300) / <alpha-value>)',
          400: 'hsl(var(--brand-400) / <alpha-value>)',
          500: 'hsl(var(--brand-500) / <alpha-value>)',
          600: 'hsl(var(--brand-600) / <alpha-value>)',
          link: 'hsl(var(--brand-link) / <alpha-value>)',
        },

        // Secondary (Purple)
        'supabase-secondary': {
          DEFAULT: 'hsl(var(--secondary-default) / <alpha-value>)',
          200: 'hsl(var(--secondary-200) / <alpha-value>)',
          400: 'hsl(var(--secondary-400) / <alpha-value>)',
        },

        // Destructive (Red)
        destructive: {
          DEFAULT: 'hsl(var(--destructive-default) / <alpha-value>)',
          200: 'hsl(var(--destructive-200) / <alpha-value>)',
          300: 'hsl(var(--destructive-300) / <alpha-value>)',
          400: 'hsl(var(--destructive-400) / <alpha-value>)',
          500: 'hsl(var(--destructive-500) / <alpha-value>)',
          600: 'hsl(var(--destructive-600) / <alpha-value>)',
        },

        // Warning (Amber)
        warning: {
          DEFAULT: 'hsl(var(--warning-default) / <alpha-value>)',
          200: 'hsl(var(--warning-200) / <alpha-value>)',
          300: 'hsl(var(--warning-300) / <alpha-value>)',
          400: 'hsl(var(--warning-400) / <alpha-value>)',
          500: 'hsl(var(--warning-500) / <alpha-value>)',
          600: 'hsl(var(--warning-600) / <alpha-value>)',
        },

        // Gray Scales
        'gray-dark': {
          100: 'hsl(var(--colors-gray-dark-100) / <alpha-value>)',
          200: 'hsl(var(--colors-gray-dark-200) / <alpha-value>)',
          300: 'hsl(var(--colors-gray-dark-300) / <alpha-value>)',
          400: 'hsl(var(--colors-gray-dark-400) / <alpha-value>)',
          500: 'hsl(var(--colors-gray-dark-500) / <alpha-value>)',
          600: 'hsl(var(--colors-gray-dark-600) / <alpha-value>)',
          700: 'hsl(var(--colors-gray-dark-700) / <alpha-value>)',
          800: 'hsl(var(--colors-gray-dark-800) / <alpha-value>)',
          900: 'hsl(var(--colors-gray-dark-900) / <alpha-value>)',
          1000: 'hsl(var(--colors-gray-dark-1000) / <alpha-value>)',
          1100: 'hsl(var(--colors-gray-dark-1100) / <alpha-value>)',
          1200: 'hsl(var(--colors-gray-dark-1200) / <alpha-value>)',
        },

        'gray-light': {
          100: 'hsl(var(--colors-gray-light-100) / <alpha-value>)',
          200: 'hsl(var(--colors-gray-light-200) / <alpha-value>)',
          300: 'hsl(var(--colors-gray-light-300) / <alpha-value>)',
          400: 'hsl(var(--colors-gray-light-400) / <alpha-value>)',
          500: 'hsl(var(--colors-gray-light-500) / <alpha-value>)',
          600: 'hsl(var(--colors-gray-light-600) / <alpha-value>)',
          700: 'hsl(var(--colors-gray-light-700) / <alpha-value>)',
          800: 'hsl(var(--colors-gray-light-800) / <alpha-value>)',
          900: 'hsl(var(--colors-gray-light-900) / <alpha-value>)',
          1000: 'hsl(var(--colors-gray-light-1000) / <alpha-value>)',
          1100: 'hsl(var(--colors-gray-light-1100) / <alpha-value>)',
          1200: 'hsl(var(--colors-gray-light-1200) / <alpha-value>)',
        },

        // Code Block Syntax
        'code-block': {
          1: 'hsl(var(--code-block-1) / <alpha-value>)',
          2: 'hsl(var(--code-block-2) / <alpha-value>)',
          3: 'hsl(var(--code-block-3) / <alpha-value>)',
          4: 'hsl(var(--code-block-4) / <alpha-value>)',
          5: 'hsl(var(--code-block-5) / <alpha-value>)',
        },
      },

      // Text Colors (Semantic)
      textColor: ({ theme }) => ({
        ...theme('colors'),
        'foreground': {
          DEFAULT: 'hsl(var(--foreground-default) / <alpha-value>)',
          light: 'hsl(var(--foreground-light) / <alpha-value>)',
          lighter: 'hsl(var(--foreground-lighter) / <alpha-value>)',
          muted: 'hsl(var(--foreground-muted) / <alpha-value>)',
          contrast: 'hsl(var(--foreground-contrast) / <alpha-value>)',
        },
      }),

      // Background Colors (Semantic)
      backgroundColor: ({ theme }) => ({
        ...theme('colors'),
        'background': {
          DEFAULT: 'hsl(var(--background-default) / <alpha-value>)',
          200: 'hsl(var(--background-200) / <alpha-value>)',
          alternative: 'hsl(var(--background-alternative-default) / <alpha-value>)',
          selection: 'hsl(var(--background-selection) / <alpha-value>)',
          control: 'hsl(var(--background-control) / <alpha-value>)',
          muted: 'hsl(var(--background-muted) / <alpha-value>)',
          dialog: 'hsl(var(--background-dialog-default) / <alpha-value>)',
          'dash-sidebar': 'hsl(var(--background-dash-sidebar) / <alpha-value>)',
          'dash-canvas': 'hsl(var(--background-dash-canvas) / <alpha-value>)',
        },
        'surface': {
          75: 'hsl(var(--background-surface-75) / <alpha-value>)',
          100: 'hsl(var(--background-surface-100) / <alpha-value>)',
          200: 'hsl(var(--background-surface-200) / <alpha-value>)',
          300: 'hsl(var(--background-surface-300) / <alpha-value>)',
          400: 'hsl(var(--background-surface-400) / <alpha-value>)',
        },
        'overlay': {
          DEFAULT: 'hsl(var(--background-overlay-default) / <alpha-value>)',
          hover: 'hsl(var(--background-overlay-hover) / <alpha-value>)',
        },
        // Studio-specific
        'studio': 'hsl(var(--background-200) / <alpha-value>)',
      }),

      // Border Colors (Semantic)
      borderColor: ({ theme }) => ({
        ...theme('colors'),
        'border': {
          DEFAULT: 'hsl(var(--border-default) / <alpha-value>)',
          muted: 'hsl(var(--border-muted) / <alpha-value>)',
          secondary: 'hsl(var(--border-secondary) / <alpha-value>)',
          overlay: 'hsl(var(--border-overlay) / <alpha-value>)',
          control: 'hsl(var(--border-control) / <alpha-value>)',
          alternative: 'hsl(var(--border-alternative) / <alpha-value>)',
          strong: 'hsl(var(--border-strong) / <alpha-value>)',
          stronger: 'hsl(var(--border-stronger) / <alpha-value>)',
        },
      }),

      // =====================================================================
      // TYPOGRAPHY
      // =====================================================================
      fontFamily: {
        sans: ['var(--font-custom, Inter)', 'Circular', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['var(--font-source-code-pro, Source Code Pro)', 'Office Code Pro', 'Menlo', 'monospace'],
      },

      fontSize: {
        'grid': '13px',
      },

      // =====================================================================
      // SPACING
      // =====================================================================
      spacing: {
        'content': '21px', // Supabase panel padding
      },

      // =====================================================================
      // BORDER RADIUS
      // =====================================================================
      borderRadius: {
        'panel': '6px',
        'lg': 'var(--borderradius-lg)',
        'md': 'calc(var(--borderradius-lg) - 2px)',
        'sm': 'calc(var(--borderradius-lg) - 4px)',
      },

      // =====================================================================
      // SIZING
      // =====================================================================
      width: {
        'listbox': 'var(--width-listbox, 320px)',
      },

      // =====================================================================
      // BREAKPOINTS
      // =====================================================================
      screens: {
        'xs': '480px',
      },

      // =====================================================================
      // ANIMATIONS
      // =====================================================================
      keyframes: {
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
        'fadeIn': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fadeOut': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'overlayContentShow': {
          '0%': { opacity: '0', transform: 'translate(0%, -2%) scale(1)' },
          '100%': { opacity: '1', transform: 'translate(0%, 0%) scale(1)' },
        },
        'overlayContentHide': {
          '0%': { opacity: '1', transform: 'translate(0%, 0%) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(0%, -2%) scale(1)' },
        },
        'fadeInOverlayBg': {
          '0%': { opacity: '0' },
          '100%': { opacity: '0.75' },
        },
        'fadeOutOverlayBg': {
          '0%': { opacity: '0.75' },
          '100%': { opacity: '0' },
        },
        'slideDown': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'slideUp': {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        'slideDownNormal': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'inherit', opacity: '1' },
        },
        'slideUpNormal': {
          '0%': { height: 'inherit', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        'panelSlideLeftOut': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'panelSlideLeftIn': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        'panelSlideRightOut': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'panelSlideRightIn': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'lineLoading': {
          '0%': { marginLeft: '-10%', width: '80px' },
          '25%': { width: '240px' },
          '50%': { marginLeft: '100%', width: '80px' },
          '75%': { width: '240px' },
          '100%': { marginLeft: '-10%', width: '80px' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },

      animation: {
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
        'accordion-down': 'accordion-down 0.15s ease-out',
        'accordion-up': 'accordion-up 0.15s ease-out',
        'collapsible-down': 'collapsible-down 0.10s ease-out',
        'collapsible-up': 'collapsible-up 0.10s ease-out',
        'fade-in': 'fadeIn 300ms both',
        'fade-out': 'fadeOut 300ms both',
        'dropdown-content-show': 'overlayContentShow 100ms cubic-bezier(0.16, 1, 0.3, 1)',
        'dropdown-content-hide': 'overlayContentHide 100ms cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-show': 'overlayContentShow 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-hide': 'overlayContentHide 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-overlay-bg': 'fadeInOverlayBg 300ms',
        'fade-out-overlay-bg': 'fadeOutOverlayBg 300ms',
        'slide-down': 'slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'slide-down-normal': 'slideDownNormal 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'slide-up-normal': 'slideUpNormal 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-left-out': 'panelSlideLeftOut 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-left-in': 'panelSlideLeftIn 250ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-right-out': 'panelSlideRightOut 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-right-in': 'panelSlideRightIn 250ms cubic-bezier(0.87, 0, 0.13, 1)',
        'line-loading': 'lineLoading 1.8s infinite',
        'line-loading-slower': 'lineLoading 2.3s infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },

      // =====================================================================
      // TRANSFORM ORIGINS
      // =====================================================================
      transformOrigin: {
        'dropdown': 'var(--radix-dropdown-menu-content-transform-origin)',
        'popover': 'var(--radix-popover-menu-content-transform-origin)',
      },

      // =====================================================================
      // TYPOGRAPHY PLUGIN CONFIG
      // =====================================================================
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            '--tw-prose-body': 'hsl(var(--foreground-light))',
            '--tw-prose-headings': 'hsl(var(--foreground-default))',
            '--tw-prose-lead': 'hsl(var(--foreground-light))',
            '--tw-prose-links': 'hsl(var(--foreground-light))',
            '--tw-prose-bold': 'hsl(var(--foreground-light))',
            '--tw-prose-counters': 'hsl(var(--foreground-light))',
            '--tw-prose-bullets': 'hsl(var(--foreground-muted))',
            '--tw-prose-hr': 'hsl(var(--background-surface-300))',
            '--tw-prose-quotes': 'hsl(var(--foreground-light))',
            '--tw-prose-quote-borders': 'hsl(var(--background-surface-300))',
            '--tw-prose-captions': 'hsl(var(--border-strong))',
            '--tw-prose-code': 'hsl(var(--foreground-default))',
            '--tw-prose-pre-code': 'hsl(var(--foreground-muted))',
            '--tw-prose-pre-bg': 'hsl(var(--background-surface-200))',
            '--tw-prose-th-borders': 'hsl(var(--background-surface-300))',
            '--tw-prose-td-borders': 'hsl(var(--background-default))',
            'h1, h2, h3, h4, h5, h6': {
              fontWeight: '400',
            },
            'article h2, article h3, article h4, article h5, article h6': {
              marginTop: '2em',
              marginBottom: '1em',
            },
            p: {
              fontWeight: '400',
            },
            pre: {
              background: 'none',
              padding: 0,
              marginBottom: '32px',
            },
            code: {
              fontWeight: '400',
              padding: '0.2rem 0.4rem',
              backgroundColor: 'hsl(var(--background-surface-200))',
              border: '1px solid hsl(var(--background-surface-300))',
              borderRadius: theme('borderRadius.lg'),
            },
            a: {
              position: 'relative',
              transition: 'all 0.18s ease',
              fontWeight: '400',
              color: 'hsl(var(--foreground-default))',
              textDecorationLine: 'underline',
              textDecorationColor: 'hsl(var(--foreground-muted))',
              textDecorationThickness: '1px',
              textUnderlineOffset: '2px',
            },
            'a:hover': {
              textDecorationColor: 'hsl(var(--foreground-default))',
            },
          },
        },
      }),
    },
  },

  // =========================================================================
  // PLUGINS
  // =========================================================================
  plugins: [
    // Add custom utilities
    function ({ addUtilities, addVariant }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.mask-fadeout-right': {
          '-webkit-mask-image': 'linear-gradient(to right, white 98%, transparent 100%)',
          'mask-image': 'linear-gradient(to right, white 98%, transparent 100%)',
        },
        '.mask-fadeout-left': {
          '-webkit-mask-image': 'linear-gradient(to left, white 98%, transparent 100%)',
          'mask-image': 'linear-gradient(to left, white 98%, transparent 100%)',
        },
      });

      // Add data-state variants
      addVariant('data-open-parent', '[data-state="open"] &');
      addVariant('data-closed-parent', '[data-state="closed"] &');
      addVariant('data-open', '&[data-state="open"]');
      addVariant('data-closed', '&[data-state="closed"]');
      addVariant('data-show', '&[data-state="show"]');
      addVariant('data-hide', '&[data-state="hide"]');
      addVariant('data-checked', '&[data-state="checked"]');
      addVariant('data-unchecked', '&[data-state="unchecked"]');
      addVariant('aria-expanded', '&[aria-expanded="true"]');
      addVariant('not-disabled', '&:not(:disabled)');
    },
  ],
};
