/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0B0F1A',
          card: '#111A2E',
          cyan: '#00E5FF',
          purple: '#9C27FF',
          gold: '#FFD54F',
          red: '#FF0055',
          green: '#00FF9D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 229, 255, 0.5), 0 0 30px rgba(0, 229, 255, 0.2)',
        'neon-purple': '0 0 15px rgba(156, 39, 255, 0.5), 0 0 30px rgba(156, 39, 255, 0.2)',
        'neon-gold': '0 0 15px rgba(255, 213, 79, 0.5), 0 0 30px rgba(255, 213, 79, 0.2)',
        'neon-red': '0 0 15px rgba(255, 0, 85, 0.5), 0 0 30px rgba(255, 0, 85, 0.2)',
      }
    },
  },
  plugins: [],
}
