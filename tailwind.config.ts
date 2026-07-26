import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        court: {
          950: '#0a0a0f',
          900: '#12121b',
          800: '#1b1b28',
          700: '#26263a',
          600: '#343450',
        },
        flame: {
          400: '#ff9a4d',
          500: '#f97316',
          600: '#e05f0a',
        },
        hardwood: '#c8873f',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        ripple: {
          from: { opacity: '0.8', transform: 'scale(0.4)' },
          to: { opacity: '0', transform: 'scale(1.6)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 260ms ease-out both',
        ripple: 'ripple 400ms ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
