import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Bagel Fat One", "sans-serif"],
        serif: ["Gloock", "serif"],
      },
      animation: {
        sparkle: "sparkle 3s infinite ease-in-out",
      },
      keyframes: {
        sparkle: {
          "0%": { transform: "rotate(0deg) scale(0.5)" },
          "25%": { transform: "rotate(45deg) scale(1)" },
          "50%": { transform: "rotate(90deg) scale(0.8)" },
          "75%": { transform: "rotate(135deg) scale(1.1)" },
          "100%": { transform: "rotate(180deg) scale(0.5)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
