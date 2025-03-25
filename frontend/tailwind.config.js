/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in-out': 'fade-in-out 3s ease-in-out forwards',
      },
      keyframes: {
        'fade-in-out': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-1rem) translateX(-50%)'
          },
          '10%': {
            opacity: '1',
            transform: 'translateY(0) translateX(-50%)'
          },
          '90%': {
            opacity: '1',
            transform: 'translateY(0) translateX(-50%)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-1rem) translateX(-50%)'
          }
        }
      }
    },
  },
  plugins: [],
}