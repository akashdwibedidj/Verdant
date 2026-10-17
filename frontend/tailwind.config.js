/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17221d',
        muted: '#78837c',
        forest: '#174b38',
        lime: '#c4e878',
        canvas: '#f6f7f3',
        line: '#e8ebe5',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 28px rgba(25, 43, 33, .045)',
      },
    },
  },
}
