/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          void: "#000000",
          matter: "#0A0A0A",
          structure: "#1F1F1F",
          subtle: "#333333",
          signal: "#FFFFFF",
          noise: "#888888",
          green: "#28E7A2",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        headline: "-0.04em",
        widest: "0.08em",
      },
      spacing: {
        120: "120px",
      },
    },
  },
  plugins: [],
};
