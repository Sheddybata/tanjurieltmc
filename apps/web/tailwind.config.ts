import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f0',
          100: '#d5ecd9',
          200: '#aed9b8',
          300: '#7bbf8c',
          400: '#4da264',
          500: '#2d8647',
          600: '#1f6b38',
          700: '#1a5530',
          800: '#174428',
          900: '#133822',
          950: '#0a1f13',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8faf9',
          tertiary: '#f1f5f3',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
