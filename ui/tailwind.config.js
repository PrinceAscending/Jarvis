/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#0A0E17',
        surface: {
          DEFAULT: '#121829',
          elevated: '#182035',
          subtle: '#0E1321',
          border: 'rgba(255, 255, 255, 0.07)',
        },
        glass: {
          DEFAULT: '#1A2236',
          active: '#222C46',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        signal: {
          DEFAULT: '#4F6AE8',
          hover: '#6079EE',
          dim: 'rgba(79, 106, 232, 0.12)',
          border: 'rgba(79, 106, 232, 0.3)',
        },
        warm: {
          DEFAULT: '#E2A869',
          bright: '#F3BE86',
          dim: 'rgba(226, 168, 105, 0.15)',
        },
        text: {
          DEFAULT: '#C8CDD8',
          muted: '#636A84',
          bright: '#F1F3F9',
        },
        semantic: {
          online: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          thinking: '#A78BFA',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0, 0, 0, 0.4)',
        elevated: '0 4px 20px rgba(0, 0, 0, 0.3)',
        'orb-glow': '0 0 50px rgba(79, 106, 232, 0.25)',
      },
    },
  },
  plugins: [],
}
