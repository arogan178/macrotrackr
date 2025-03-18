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
        'shrink-x': 'shrink 1s linear forwards',
        'fade-in': 'fadeIn 0.3s ease-in-out',
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
        },
        shrink: {
          '0%': { width: '100%' },
          '100%': { width: '0%' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}