/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wb-navy': '#0c1e3c',
        'wb-gold': '#b8860b',
      },
    },
  },
  plugins: [],
};

