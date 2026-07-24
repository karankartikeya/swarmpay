import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        bone: "#ffffff",
        ash: "#bdbdbd",
        smoke: "#9a9a9a",
        "plum-voltage": "#8052ff",
        "amber-spark": "#ffb829",
        lichen: "#15846e",
        sp: {
          bg: "#000000",
          surface: "#000000",
          border: "rgba(255,255,255,0.10)",
          primary: "#8052ff",
          "primary-dark": "#6a3de8",
          success: "#22C55E",
          warning: "#FBBF24",
          danger: "#EF4444",
          muted: "#9a9a9a",
          white: "#ffffff",
          dark: "#000000",
          "dark-surface": "#000000",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        pill: "24px",
      },
    },
  },
  plugins: [],
};
export default config;
