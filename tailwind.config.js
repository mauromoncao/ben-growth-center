/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul-noite profundo — identidade Ben Growth Center
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
        // Verde-esmeralda — crescimento, conversão, sucesso
        growth: {
          DEFAULT: '#00b37e',
          50:  '#e6f9f3',
          100: '#c0f0e1',
          200: '#97e7ce',
          300: '#6dddba',
          400: '#4dd4a7',
          500: '#00b37e',
          600: '#00a272',
          700: '#008f63',
          800: '#007c55',
          900: '#005c3f',
        },
        // Dourado jurídico — destaque, badges, alertas
        gold: {
          DEFAULT: '#c9a84c',
          50:  '#fdf8ec',
          100: '#faeece',
          200: '#f5e0a0',
          300: '#f0d070',
          400: '#e8c048',
          500: '#c9a84c',
          600: '#b8963e',
          700: '#a07e2c',
          800: '#896821',
          900: '#71551a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
