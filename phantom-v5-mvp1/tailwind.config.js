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
          cyan: '#00e5ff',
          purple: '#9c27ff',
          gold: '#ffcc00',
          red: '#ff0055',
          bg: '#0b0f1a',
          card: '#111a2e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 10s linear infinite',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 229, 255, 0.5), 0 0 30px rgba(0, 229, 255, 0.2)',
        'neon-purple': '0 0 15px rgba(156, 39, 255, 0.5), 0 0 30px rgba(156, 39, 255, 0.2)',
        'neon-gold': '0 0 15px rgba(255, 204, 0, 0.5), 0 0 30px rgba(255, 204, 0, 0.2)',
        'neon-red': '0 0 15px rgba(255, 0, 85, 0.5), 0 0 30px rgba(255, 0, 85, 0.2)',
      }
    },
  },
  plugins: [],
}
