/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Construction safety amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        copper: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#ea580c',
          600: '#c2410c',
          700: '#9a3412',
          900: '#431407',
        },
        obsidian: {
          900: '#080C14',
          800: '#0F172A',
          700: '#1E293B',
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 25px -5px rgba(28, 25, 23, 0.06), 0 8px 10px -6px rgba(28, 25, 23, 0.04)',
        'card': '0 1px 3px 0 rgba(28, 25, 23, 0.05), 0 1px 2px -1px rgba(28, 25, 23, 0.05)',
      }
    },
  },
  plugins: [],
}

