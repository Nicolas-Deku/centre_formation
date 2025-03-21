/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{html,ts}",
    ],
    theme: {
      extend: {
        animation: {
          'slide-down': 'slideDown 0.3s ease-in-out',
          'fade-in': 'fadeIn 0.5s ease-in'
        },
        keyframes: {
          slideDown: {
            '0%': { transform: 'translateY(-100%)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' }
          },
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' }
          }
        }
      },
    },
    plugins: [],
  }