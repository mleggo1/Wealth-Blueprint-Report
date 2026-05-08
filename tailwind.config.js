/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        gold: {
          50: '#fff9e6',
          100: '#fff1cc',
          200: '#ffe699',
          300: '#ffdb66',
          400: '#ffd033',
          500: '#ffc500',
          600: '#cc9e00',
          700: '#997700',
          800: '#664f00',
          900: '#332800',
        },
        charcoal: {
          50: '#f7f7f7',
          100: '#e1e1e1',
          700: '#515151',
          800: '#3b3b3b',
          900: '#222222',
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
        },
        teal: {
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
        'wb-navy': '#102a43',
        'wb-gold': '#ffc500',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'wb-ocean':
          'linear-gradient(to bottom right, #f0f9ff, #f0fdfa, #e0f2fe)',
      },
    },
  },
  plugins: [],
};
