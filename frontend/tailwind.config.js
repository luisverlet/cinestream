/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#111827',
        'surface-elevated': '#1f293d',
        accent: '#10b981', // Emerald 500
        'accent-hover': '#34d399', // Emerald 400
      },
      spacing: {
        'tv-x': '4vw',
        'tv-y': '3vh',
      },
      boxShadow: {
        'focus-glow': '0 0 25px rgba(16, 185, 129, 0.45)',
      }
    },
  },
  plugins: [],
}

