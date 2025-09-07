import animate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // primary
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        accent: "#f59e0b",
      },
      boxShadow: {
        smooth: "0 10px 30px rgba(0,0,0,.2)", // ✅ custom smooth shadow
      },
      borderRadius: {
        "2xl": "1.25rem", // ✅ overrides default 2xl
      },
    },
  },
  plugins: [animate],
};

export default config;
