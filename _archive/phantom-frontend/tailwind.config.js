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
          dark: '#0b0f1a',
          deeper: '#111a2e',
          cyan: '#00e5ff',
          purple: '#9c27ff',
          gold: '#ffcc00',
          red: '#ff0055'
        }
      },
      fontFamily: {
        mono: ['Space Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(to bottom, #0b0f1a, #111a2e)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'brightness(1) blur(0px)' },
          '50%': { opacity: 0.8, filter: 'brightness(1.5) blur(2px)' },
        }
      }
    },
  },
  plugins: [],
}
