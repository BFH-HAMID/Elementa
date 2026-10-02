import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './simulations/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' }
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem'
      },
      colors: {
        ink: {
          50: '#f3f7fb',
          100: '#e5edf6',
          200: '#cddae9',
          500: '#59718e',
          700: '#2d4158',
          900: '#14283d'
        },
        physics: {
          50: '#eff7ff',
          100: '#d9edff',
          200: '#b9dcff',
          300: '#8fc6f5',
          400: '#4b9ee4',
          500: '#1677d2',
          600: '#075db1',
          700: '#064a8c',
          900: '#082e55'
        },
        chemistry: {
          50: '#effcf7',
          100: '#d7f8e9',
          200: '#a9efd0',
          300: '#78dfb8',
          400: '#3cc398',
          500: '#0e9f78',
          600: '#087d60',
          700: '#07614d',
          900: '#073c31'
        },
        sun: '#f4b942',
        coral: '#e8795b'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-bengali)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        bengali: ['var(--font-bengali)', 'Noto Sans Bengali', 'Hind Siliguri', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        card: '0 12px 35px rgba(20, 40, 61, 0.08)',
        float: '0 18px 55px rgba(20, 40, 61, 0.14)',
        glow: '0 0 0 4px rgba(22, 119, 210, 0.12)'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(20px, -16px, 0) rotate(5deg)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.9' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        drift: 'drift 12s ease-in-out infinite',
        'drift-slow': 'drift 18s ease-in-out infinite reverse',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite'
      }
    }
  },
  plugins: []
};

export default config;
