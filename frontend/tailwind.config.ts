import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand primary — gold
        primary: {
          DEFAULT: "#D4A63A",
          dark: "#B8860B",
          foreground: "#000000",
        },
        // Brand secondary — blue
        secondary: {
          DEFAULT: "#2EA8FF",
          dark: "#0A6DCC",
          foreground: "#ffffff",
        },
        // Dark backgrounds
        background: {
          DEFAULT: "#0B0B0F",
          card: "#141821",
          panel: "#1E2430",
        },
        // UI semantic tokens
        surface: "#141821",
        border: "#2A3244",
        muted: "#374151",
        "muted-foreground": "#9CA3AF",
        foreground: "#E5E7EB",
        "foreground-muted": "#9CA3AF",
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#000000",
        },
        // shadcn/ui compat
        card: {
          DEFAULT: "#141821",
          foreground: "#E5E7EB",
        },
        popover: {
          DEFAULT: "#1E2430",
          foreground: "#E5E7EB",
        },
        input: "#1E2430",
        ring: "#D4A63A",
        accent: {
          DEFAULT: "#1E2430",
          foreground: "#E5E7EB",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
