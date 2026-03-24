import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

const safeArea = plugin(({ addUtilities }) => {
  addUtilities({
    ".pt-safe": { paddingTop: "env(safe-area-inset-top)" },
    ".pb-safe": { paddingBottom: "env(safe-area-inset-bottom)" },
    ".pl-safe": { paddingLeft: "env(safe-area-inset-left)" },
    ".pr-safe": { paddingRight: "env(safe-area-inset-right)" },
    ".mt-safe": { marginTop: "env(safe-area-inset-top)" },
    ".mb-safe": { marginBottom: "env(safe-area-inset-bottom)" },
    ".ml-safe": { marginLeft: "env(safe-area-inset-left)" },
    ".mr-safe": { marginRight: "env(safe-area-inset-right)" },
  });
});

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        ring: "var(--ring)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
      },
    },
  },
  plugins: [tailwindcssAnimate, safeArea],
};

export default config;
