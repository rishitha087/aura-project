/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#03050A',
          900: '#080C15',
          800: '#0E1525',
          700: '#141D35',
          600: '#1C2847',
          500: '#243360',
        },
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        accent: {
          coral:   '#F87171',
          emerald: '#34D399',
          violet:  '#A78BFA',
          amber:   '#FBBF24',
          cyan:    '#22D3EE',
          rose:    '#FB7185',
        }
      },
      fontFamily: {
        sans:    ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-1': 'radial-gradient(at 40% 20%, hsla(245,100%,70%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.08) 0px, transparent 50%)',
        'mesh-2': 'radial-gradient(at 80% 50%, hsla(245,100%,70%,0.15) 0px, transparent 50%), radial-gradient(at 20% 80%, hsla(155,100%,50%,0.10) 0px, transparent 50%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)',   opacity: '0' },
        },
        'orbit': {
          '0%':   { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blob-1': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%':      { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in-up':      'fade-in-up 0.6s ease-out forwards',
        'fade-in-down':    'fade-in-down 0.4s ease-out forwards',
        'fade-in':         'fade-in 0.5s ease-out forwards',
        'slide-in-right':  'slide-in-right 0.5s ease-out forwards',
        'shimmer':         'shimmer 2.5s linear infinite',
        'float':           'float 4s ease-in-out infinite',
        'float-slow':      'float 6s ease-in-out infinite',
        'pulse-ring':      'pulse-ring 1.5s ease-out infinite',
        'orbit':           'orbit 8s linear infinite',
        'gradient-shift':  'gradient-shift 4s ease infinite',
        'blob-1':          'blob-1 8s ease-in-out infinite',
        'spin-slow':       'spin-slow 12s linear infinite',
      },
      boxShadow: {
        'glow-primary': '0 0 30px -5px rgba(99, 102, 241, 0.5)',
        'glow-violet':  '0 0 30px -5px rgba(167, 139, 250, 0.4)',
        'glow-emerald': '0 0 20px -5px rgba(52, 211, 153, 0.4)',
        'glow-coral':   '0 0 20px -5px rgba(248, 113, 113, 0.4)',
        'card':         '0 4px 24px -4px rgba(0, 0, 0, 0.5)',
        'card-hover':   '0 20px 60px -15px rgba(0, 0, 0, 0.7)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
