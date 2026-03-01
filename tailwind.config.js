/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Paleta Principal Ben Growth Center ────────────────────────
        primary: {
          DEFAULT: '#0f2044',
          50:  '#e8edf7',
          100: '#c5d0e8',
          200: '#9fb0d7',
          300: '#7890c6',
          400: '#5b78ba',
          500: '#3e60ae',
          600: '#3858a6',
          700: '#2f4d9c',
          800: '#274292',
          900: '#0f2044',
        },
        navy: {
          DEFAULT: '#0f2044',
          deep:    '#07182e',
          mid:     '#1e3470',
          light:   '#2d4a8a',
        },
        gold: {
          DEFAULT: '#D4A017',
          light:   '#F0C040',
          dark:    '#C8960E',
        },
        growth: {
          DEFAULT: '#00b37e',
          50:  '#e6f9f3',
          100: '#c0f0e1',
          400: '#4dd4a7',
          500: '#00b37e',
          600: '#00a272',
          700: '#008f63',
        },
        emerald: '#00b37e',
        amber:   '#f59e0b',
        crimson: '#e11d48',
        violet:  '#7c3aed',
        cyan:    '#0891b2',
      },
      fontFamily: {
        sans:  ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                            '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
