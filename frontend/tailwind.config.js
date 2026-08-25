/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yt: {
          primary: '#e1002d',
          'primary-hover': '#cc0026',
          'primary-active': '#b30000',
          'primary-container': '#ffcccc',
          'on-primary-container': '#8b0000',
          'inverse-primary': '#ff5577',
          secondary: '#2ba640',
          'secondary-container': '#c8e6c9',
          'on-secondary-container': '#1b5e20',
          tertiary: '#3ea6ff',
          'tertiary-container': '#b3e5fc',
          'on-tertiary-container': '#01579b',
          surface: '#ffffff',
          'surface-dim': '#f5f5f5',
          'surface-container-lowest': '#fafafa',
          'surface-container-low': '#f9f9f9',
          'surface-container': '#f5f5f5',
          'surface-container-high': '#eeeeee',
          'surface-container-highest': '#e8e8e8',
          'on-surface': '#0f0f0f',
          'on-surface-variant': '#606060',
          'inverse-surface': '#0f0f0f',
          'inverse-on-surface': '#f5f5f5',
          outline: '#dbdbdb',
          'outline-variant': '#9b9b9b',
          error: '#dd2c00',
          'error-container': '#ffcccc',
          'on-error-container': '#8b0000',
          // Dark mode surface stack
          'dark-surface': '#0f0f0f',
          'dark-container': '#1f1f1f',
          'dark-high': '#272727',
          'dark-highest': '#383838',
          'dark-outline': '#3f3f3f',
          'dark-text': '#f1f1f1',
          'dark-text-variant': '#aaaaaa',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
        display: ['"YouTube Sans"', 'Roboto', 'Arial', 'sans-serif'],
        headline: ['"YouTube Sans"', 'Roboto', 'Arial', 'sans-serif'],
        title: ['"YouTube Sans"', 'Roboto', 'Arial', 'sans-serif'],
        body: ['Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'yt-sm': '0 1px 2px rgba(0, 0, 0, 0.06)',
        'yt-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'yt-lg': '0 16px 40px rgba(0, 0, 0, 0.12)',
      },
      maxWidth: {
        'yt-container': '1440px',
      }
    },
  },
  plugins: [],
}

