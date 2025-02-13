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
      },
      animation: {
        sparkle: "sparkle 3s infinite ease-in-out",
      },
      keyframes: {
        sparkle: {
          "0%": { 
            transform: "translate(0, 0) rotate(0deg) scale(0.5)", 
            opacity: "0.6" 
          },
          "25%": { 
            transform: "translate(40px, -30px) rotate(45deg) scale(1)", 
            opacity: "1" 
          },
          "50%": { 
            transform: "translate(-30px, 60px) rotate(90deg) scale(0.8)", 
            opacity: "0.8" 
          },
          "75%": { 
            transform: "translate(30px, -50px) rotate(135deg) scale(1.1)", 
            opacity: "0.9" 
          },
          "100%": { 
            transform: "translate(-50px, 30px) rotate(180deg) scale(0.5)", 
            opacity: "0.6" 
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
