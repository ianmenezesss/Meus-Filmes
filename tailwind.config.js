/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0d1117",
        surface: "#161b22",
        surfaceHover: "#1f2530",
        border: "#2a303c",
        accent: "#22c55e",
        accent2: "#38bdf8",
      },
    },
  },
  plugins: [],
};
