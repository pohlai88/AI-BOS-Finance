/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🛡️ GOVERNANCE: Surface tokens (The Bridge to globals.css)
        // Usage: bg-surface-base / bg-surface-flat
        surface: {
          base: "rgb(var(--surface-base) / <alpha-value>)",
          flat: "rgb(var(--surface-flat) / <alpha-value>)",
          ghost: "transparent", // Ghost is special, always transparent
        },
        // 🛡️ GOVERNANCE: Border tokens for Surface
        // Usage: border-border-surface-base
        border: {
          surface: {
            base: "rgb(var(--border-base) / <alpha-value>)",
            flat: "rgb(var(--border-flat) / <alpha-value>)",
          },
          // Legacy semantic aliases (mapped from CSS variables in globals.css)
          default: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          active: 'var(--color-border-active)',
        },
        // Legacy semantic color aliases (mapped from CSS variables in globals.css)
        'surface-subtle': 'var(--color-surface-subtle)',
        'surface-card': 'var(--color-surface-card)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-nested': 'var(--color-surface-nested)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'status-success': 'var(--color-status-success)',
        'status-warning': 'var(--color-status-warning)',
        'status-danger': 'var(--color-status-danger)',
        'status-info': 'var(--color-status-info)',
        // Shadcn/ui standard mappings (legacy compatibility)
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
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
      },
      spacing: {
        // Semantic spacing aliases (4px grid enforcement)
        'layout-xs': 'var(--spacing-layout-xs)',   // 8px
        'layout-sm': 'var(--spacing-layout-sm)',   // 16px
        'layout-md': 'var(--spacing-layout-md)',   // 24px
        'layout-lg': 'var(--spacing-layout-lg)',   // 32px
        'layout-xl': 'var(--spacing-layout-xl)',   // 64px
        'layout-2xl': 'var(--spacing-layout-2xl)', // 120px
        'layout-3xl': 'var(--spacing-layout-3xl)', // 240px
        'card-gap': 'var(--spacing-card-gap)',     // 24px
      },
      fontSize: {
        'display': ['var(--text-display)', { lineHeight: '1.2', letterSpacing: 'var(--tracking-tight)' }],
        'heading': ['var(--text-heading)', { lineHeight: '1.3', letterSpacing: 'var(--tracking-tight)' }],
        'subheading': ['var(--text-subheading)', { lineHeight: '1.4', letterSpacing: 'var(--tracking-normal)' }],
        'body': ['var(--text-body)', { lineHeight: '1.5', letterSpacing: 'var(--tracking-normal)' }],
        'small': ['var(--text-small)', { lineHeight: '1.5', letterSpacing: 'var(--tracking-normal)' }],
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
        mono: ["var(--font-jetbrains)"],
      },
      borderRadius: {
        // 🛡️ GOVERNANCE: Surface radius token
        // Usage: rounded-surface
        surface: "var(--radius-surface)",
        // Legacy radius tokens
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
