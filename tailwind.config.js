/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Paleta Institucional BEN ───────────────────────────────────
        primary: {
          DEFAULT: '#19385C',
          50:  '#e8edf7',
          100: '#c5d0e8',
          200: '#9fb0d7',
          300: '#7890c6',
          400: '#5b78ba',
          500: '#3e60ae',
          600: '#2d4f8a',
          700: '#1e3870',
          800: '#19385C',
          900: '#0f2044',
        },
        navy: {
          DEFAULT: '#19385C',
          deep:    '#0f2044',
          mid:     '#1e3470',
          light:   '#2d4a8a',
        },
        gold: {
          DEFAULT: '#DEC078',
          light:   '#F0D090',
          dark:    '#C8A052',
        },
        // ── Semânticos ────────────────────────────────────────────────
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
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'Georgia', 'serif'],
        mono:  ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Base legível 18px conforme padrão institucional
        'base': ['18px', { lineHeight: '1.6' }],
        'sm':   ['0.875rem', { lineHeight: '1.5' }],
        'xs':   ['0.75rem',  { lineHeight: '1.4' }],
      },
      lineHeight: {
        'reading': '1.6',
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
