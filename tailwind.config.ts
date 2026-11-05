import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F1",
        parchment: "#F3EDE2",
        ink: "#17211B",
        forest: "#12452A",
        leaf: "#1F7A4D",
        mint: "#E5F1E8",
        gold: "#B0802A",
        rose: "#A93F55",
        lilac: "#EDE7F4",
        muted: "#68705F",
        line: "#E3DCCF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-bengali)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "var(--font-bengali)", "Georgia", "serif"],
        bangla: ["var(--font-bengali)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,33,27,0.04), 0 8px 24px -12px rgba(23,33,27,0.18)",
        lift: "0 2px 4px rgba(23,33,27,0.05), 0 18px 40px -18px rgba(23,33,27,0.28)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(.22,.61,.36,1) both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
