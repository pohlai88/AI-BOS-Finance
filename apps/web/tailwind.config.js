/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./canon-pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== SEMANTIC COLOR TOKENS (Hybrid v2.0) =====
        // Surface hierarchy
        'surface-subtle': 'var(--color-surface-subtle)',
        'surface-card': 'var(--color-surface-card)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-nested': 'var(--color-surface-nested)',

        // Border hierarchy
        'border-default': 'var(--color-border-default)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-active': 'var(--color-border-active)',
        'border-emphasis': 'var(--color-border-emphasis)',

        // Text hierarchy
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-disabled': 'var(--color-text-disabled)',

        // Status colors
        'status-success': 'var(--color-status-success)',
        'status-warning': 'var(--color-status-warning)',
        'status-danger': 'var(--color-status-danger)',
        'status-info': 'var(--color-status-info)',

        // Brand accents (NEW in v2.0)
        'brand-primary': 'var(--color-primary)',
        'brand-secondary': 'var(--color-secondary)',
        'brand-highlight': 'var(--color-highlight)',
        'brand-nexus': 'var(--color-nexus-green)',

        // ===== SHADCN/UI COMPATIBILITY =====
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--color-primary-hover)",
          muted: "var(--color-primary-muted)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        // Highlight accent (NEW)
        highlight: {
          DEFAULT: "var(--color-highlight)",
          foreground: "var(--color-highlight-fg)",
        },
      },

      spacing: {
        // Semantic spacing (8px grid)
        'layout-xxs': 'var(--spacing-layout-xxs)',  // 4px
        'layout-xs': 'var(--spacing-layout-xs)',    // 8px
        'layout-sm': 'var(--spacing-layout-sm)',    // 16px
        'layout-md': 'var(--spacing-layout-md)',    // 24px
        'layout-lg': 'var(--spacing-layout-lg)',    // 32px
        'layout-xl': 'var(--spacing-layout-xl)',    // 40px
        'layout-2xl': 'var(--spacing-layout-2xl)',  // 64px
        'layout-3xl': 'var(--spacing-layout-3xl)',  // 120px
        'card-gap': 'var(--spacing-card-gap)',      // 24px
        'card-px': 'var(--spacing-card-px)',        // 24px
        'card-py': 'var(--spacing-card-py)',        // 16px
      },

      fontSize: {
        'display': ['var(--text-display)', { lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-tight)', fontWeight: '700' }],
        'heading': ['var(--text-heading)', { lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-tight)', fontWeight: '600' }],
        'subheading': ['var(--text-subheading)', { lineHeight: '1.4', letterSpacing: 'var(--tracking-normal)', fontWeight: '500' }],
        'body': ['var(--text-body)', { lineHeight: 'var(--leading-body)', letterSpacing: 'var(--tracking-normal)' }],
        'small': ['var(--text-small)', { lineHeight: 'var(--leading-body)', letterSpacing: 'var(--tracking-normal)' }],
        'caption': ['var(--text-caption)', { lineHeight: '1.4', letterSpacing: 'var(--tracking-normal)' }],
        'label': ['var(--text-label)', { lineHeight: '1.4', letterSpacing: 'var(--tracking-wide)' }],
        'micro': ['var(--text-micro)', { lineHeight: '1.4', letterSpacing: 'var(--tracking-wider)' }],
      },

      letterSpacing: {
        'tight': 'var(--tracking-tight)',
        'normal': 'var(--tracking-normal)',
        'wide': 'var(--tracking-wide)',
        'wider': 'var(--tracking-wider)',
        'widest': 'var(--tracking-widest)',
      },

      fontFamily: {
        sans: ["var(--font-inter)"],
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },

      borderRadius: {
        'none': '0',
        'sm': 'var(--radius-sm)',    // 4px
        'md': 'var(--radius-md)',    // 6px
        'lg': 'var(--radius-lg)',    // 8px
        'xl': 'var(--radius-xl)',    // 12px
        'full': 'var(--radius-full)', // 9999px
        DEFAULT: 'var(--radius)',     // 8px
      },

      boxShadow: {
        'card': 'var(--shadow-card)',
        'hover': 'var(--shadow-hover)',
        'dropdown': 'var(--shadow-dropdown)',
      },

      transitionDuration: {
        'fast': 'var(--duration-fast)',     // 150ms
        'normal': 'var(--duration-normal)', // 200ms
        'slow': 'var(--duration-slow)',     // 300ms
      },

      transitionTimingFunction: {
        'default': 'var(--easing-default)',
      },

      maxWidth: {
        'container-mobile': 'var(--container-mobile)',
        'container-tablet': 'var(--container-tablet)',
        'container-desktop': 'var(--container-desktop)',
      },

      // Animation keyframes for Magic UI
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },

      animation: {
        'fade-in': 'fade-in var(--duration-normal) var(--easing-default)',
        'slide-up': 'slide-up var(--duration-normal) var(--easing-default)',
        'slide-down': 'slide-down var(--duration-normal) var(--easing-default)',
        'scale-in': 'scale-in var(--duration-normal) var(--easing-default)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
