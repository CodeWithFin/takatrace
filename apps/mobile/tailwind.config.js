/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00C853',
          greenDim: '#00A843',
          yellow: '#FFD600',
          bg: '#0A0A0A',
          surface: '#141414',
          card: '#1C1C1C',
          border: '#2A2A2A',
          text: '#F5F5F5',
          muted: '#7A7A7A',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
