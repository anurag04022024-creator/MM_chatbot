/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Claude warm palette
        brand: {
          bg: '#FAF9F5',
          darkBg: '#262624',
          surface: '#FFFFFF',
          darkSurface: '#30302E',
          sidebar: '#F3F1EC',
          darkSidebar: '#1F1F1D',
          border: '#E8E6DC',
          darkBorder: '#3F3E3B',
          text: '#1F1E1D',
          darkText: '#ECEBE6',
          muted: '#6B6A66',
          darkMuted: '#9C9A92',
          accent: '#D97757',
          accentHover: '#C66545',
          accentSoft: '#F6ECE7',
          darkAccentSoft: '#3C2822',
        }
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'claude': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'claude-lg': '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03)',
        'claude-inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 180ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
