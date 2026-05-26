/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#00A884',
          dark: '#008069',
          light: '#d9fdd3',
        },
        bg: '#111b21',
        surface: '#202c33',
        surface2: '#2a3942',
        text: '#e9edef',
        muted: '#8696a0',
        gold: '#F5A623',
        red: '#FF6B6B',
      },
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
      },
      borderRadius: {
        button: '14px',
        pill: '50px',
      },
    },
  },
  plugins: [],
};
