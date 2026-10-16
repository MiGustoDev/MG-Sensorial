/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mg: {
          dark: '#0a0b10',
          card: '#12141e',
          border: '#1d2130',
          blue: '#3b68ff',
          red: '#ff5757',
          soft: '#8ea2ff',
        },
        qc: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#8ea2ff',
          400: '#5c7cfa',
          500: '#3b68ff',
          600: '#2c52e8',
          700: '#1d3ec7',
          800: '#1531a3',
          900: '#102680',
          950: '#0a164f',
        },
        dark: {
          950: '#0a0b10',
          900: '#12141e',
          850: '#161926',
          800: '#1d2130',
          700: '#282d40',
        }
      }
    },
  },
  plugins: [],
}
