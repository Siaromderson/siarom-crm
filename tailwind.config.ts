import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
          400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
          800: "#065f46", 900: "#064e3b", 950: "#022c22",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(16, 185, 129, 0.18)",
        ring: "0 0 0 1px rgba(16, 185, 129, 0.15)",
        glow: "0 0 40px -10px rgba(16, 185, 129, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
