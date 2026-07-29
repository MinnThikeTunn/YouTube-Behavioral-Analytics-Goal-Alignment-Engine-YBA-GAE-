/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        '32px': '32px',
      },
      colors: {
        perplexity: {
          dark: '#131415',
          cardDark: '#1c1d1f',
          borderDark: '#2e3034',
          accent: '#20b2aa',
        }
      }
    },
  },
  plugins: [],
}
