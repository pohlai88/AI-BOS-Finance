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
        /* =====================================================================
           SHADCN/UI COMPATIBILITY (Maps to CSS Variables)
           These use HSL format: hsl(var(--variable))
           ===================================================================== */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* =====================================================================
           SUPABASE GRAY SCALES (12-Step Architecture)
           Usage: text-gray-dark-500, bg-gray-light-100
           ===================================================================== */
        "gray-dark": {
          100: "hsl(var(--colors-gray-dark-100))",
          200: "hsl(var(--colors-gray-dark-200))",
          300: "hsl(var(--colors-gray-dark-300))",
          400: "hsl(var(--colors-gray-dark-400))",
          500: "hsl(var(--colors-gray-dark-500))",
          600: "hsl(var(--colors-gray-dark-600))",
          700: "hsl(var(--colors-gray-dark-700))",
          800: "hsl(var(--colors-gray-dark-800))",
          900: "hsl(var(--colors-gray-dark-900))",
          1000: "hsl(var(--colors-gray-dark-1000))",
          1100: "hsl(var(--colors-gray-dark-1100))",
          1200: "hsl(var(--colors-gray-dark-1200))",
        },
        "gray-light": {
          100: "hsl(var(--colors-gray-light-100))",
          200: "hsl(var(--colors-gray-light-200))",
          300: "hsl(var(--colors-gray-light-300))",
          400: "hsl(var(--colors-gray-light-400))",
          500: "hsl(var(--colors-gray-light-500))",
          600: "hsl(var(--colors-gray-light-600))",
          700: "hsl(var(--colors-gray-light-700))",
          800: "hsl(var(--colors-gray-light-800))",
          900: "hsl(var(--colors-gray-light-900))",
          1000: "hsl(var(--colors-gray-light-1000))",
          1100: "hsl(var(--colors-gray-light-1100))",
          1200: "hsl(var(--colors-gray-light-1200))",
        },

        /* =====================================================================
           BRAND COLORS (AI-BOS Electric Blue - Supabase Scale Structure)
           Usage: bg-brand-500, text-brand-default, border-brand-600
           ===================================================================== */
        brand: {
          200: "hsl(var(--brand-200))",
          300: "hsl(var(--brand-300))",
          400: "hsl(var(--brand-400))",
          500: "hsl(var(--brand-500))",
          600: "hsl(var(--brand-600))",
          DEFAULT: "hsl(var(--brand-default))",
          link: "hsl(var(--brand-link))",
        },

        /* =====================================================================
           STATUS COLORS (Supabase Scale Structure - Muted Professional)
           Usage: text-warning-default, bg-destructive-200, border-success-400
           ===================================================================== */
        warning: {
          200: "hsl(var(--warning-200))",
          300: "hsl(var(--warning-300))",
          400: "hsl(var(--warning-400))",
          500: "hsl(var(--warning-500))",
          600: "hsl(var(--warning-600))",
          DEFAULT: "hsl(var(--warning-default))",
        },
        destructive: {
          200: "hsl(var(--destructive-200))",
          300: "hsl(var(--destructive-300))",
          400: "hsl(var(--destructive-400))",
          500: "hsl(var(--destructive-500))",
          600: "hsl(var(--destructive-600))",
          DEFAULT: "hsl(var(--destructive-default))",
        },
        success: {
          200: "hsl(var(--success-200))",
          300: "hsl(var(--success-300))",
          400: "hsl(var(--success-400))",
          500: "hsl(var(--success-500))",
          600: "hsl(var(--success-600))",
          DEFAULT: "hsl(var(--success-default))",
        },
        secondary: {
          200: "hsl(var(--secondary-200))",
          400: "hsl(var(--secondary-400))",
          DEFAULT: "hsl(var(--secondary-default))",
        },

        /* =====================================================================
           SUPABASE FOREGROUND HIERARCHY
           Usage: text-foreground-light, text-foreground-lighter
           ===================================================================== */
        foreground: {
          DEFAULT: "hsl(var(--foreground-default))",
          light: "hsl(var(--foreground-light))",
          lighter: "hsl(var(--foreground-lighter))",
          muted: "hsl(var(--foreground-muted))",
          contrast: "hsl(var(--foreground-contrast))",
        },

        /* =====================================================================
           SUPABASE BACKGROUND SURFACES
           Usage: bg-background-surface-100, bg-background-surface-200
           ===================================================================== */
        "background-surface": {
          75: "hsl(var(--background-surface-75))",
          100: "hsl(var(--background-surface-100))",
          200: "hsl(var(--background-surface-200))",
          300: "hsl(var(--background-surface-300))",
          400: "hsl(var(--background-surface-400))",
        },
        "background-overlay": {
          DEFAULT: "hsl(var(--background-overlay-default))",
          hover: "hsl(var(--background-overlay-hover))",
        },
        "background-control": "hsl(var(--background-control))",
        "background-selection": "hsl(var(--background-selection))",
        "background-muted": "hsl(var(--background-muted))",

        /* =====================================================================
           SUPABASE BORDER VARIANTS
           Usage: border-border-muted, border-border-strong
           ===================================================================== */
        "border-muted": "hsl(var(--border-muted))",
        "border-strong": "hsl(var(--border-strong))",
        "border-stronger": "hsl(var(--border-stronger))",
        "border-control": "hsl(var(--border-control))",
        "border-overlay": "hsl(var(--border-overlay))",
        "border-alternative": "hsl(var(--border-alternative))",
      },

      /* =======================================================================
         COMPONENT HEIGHTS (Supabase Density System)
         Usage: h-height-small, min-h-height-medium
         ======================================================================= */
      height: {
        "height-tiny": "var(--height-tiny)",       // 26px
        "height-small": "var(--height-small)",     // 34px
        "height-medium": "var(--height-medium)",   // 38px
        "height-large": "var(--height-large)",     // 42px
        "height-xlarge": "var(--height-xlarge)",   // 50px
        "datatable-row": "var(--datatable-rowheight)", // 28px
      },

      minHeight: {
        "height-tiny": "var(--height-tiny)",
        "height-small": "var(--height-small)",
        "height-medium": "var(--height-medium)",
        "height-large": "var(--height-large)",
        "height-xlarge": "var(--height-xlarge)",
      },

      /* =======================================================================
         SPACING (Supabase Scale)
         ======================================================================= */
      spacing: {
        "xs": "var(--spacing-xs)",   // 4px
        "sm": "var(--spacing-sm)",   // 8px
        "md": "var(--spacing-md)",   // 16px
        "lg": "var(--spacing-lg)",   // 32px
        "xl": "var(--spacing-xl)",   // 64px
      },

      /* =======================================================================
         BORDER RADIUS (Supabase)
         ======================================================================= */
      borderRadius: {
        "none": "0",
        "xs": "var(--borderradius-xs)",     // 2px
        "sm": "var(--borderradius-sm)",     // 4px
        "md": "var(--borderradius-md)",     // 6px
        "lg": "var(--borderradius-lg)",     // 8px - DEFAULT
        "xl": "var(--borderradius-xl)",     // 16px
        "panel": "var(--radius-panel)",     // 6px
        "full": "9999px",
        DEFAULT: "var(--radius)",
      },

      /* =======================================================================
         TYPOGRAPHY
         ======================================================================= */
      fontFamily: {
        sans: ["var(--font-family-body)"],
        mono: ["var(--font-family-mono)"],
      },

      /* =======================================================================
         ANIMATIONS (Magic UI + Supabase)
         ======================================================================= */
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
