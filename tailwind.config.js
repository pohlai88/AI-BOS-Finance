/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === THE NEXUS BRIDGE ===
        // Maps Tailwind classes (bg-nexus-void) to CSS variables (var(--nexus-void))
        nexus: {
          void: "var(--nexus-void)",
          matter: "var(--nexus-matter)",
          structure: "var(--nexus-structure)",
          subtle: "var(--nexus-subtle)",
          signal: "var(--nexus-signal)",
          noise: "var(--nexus-noise)",
          green: "var(--nexus-green)",
        },
        // Shadcn/ui standard mappings
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
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-mono)"],
      },
      letterSpacing: {
        // OPTICAL TYPOGRAPHY - Fortune 500 Grade
        tighter: "-0.04em",  // Headlines (6xl+)
        tight: "-0.02em",    // Subheads (3xl-5xl)
        normal: "-0.01em",   // Body text (crisp)
        wide: "0.02em",      // Small text
        widest: "0.08em",    // ALL CAPS LABELS
        headline: "-0.04em", // Alias for tighter
        micro: "0.12em",     // Tiny labels
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        120: "120px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
