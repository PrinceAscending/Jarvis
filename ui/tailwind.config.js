/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#030508',
          900: '#070A10',
          850: '#0B0F17',
          800: '#0E131F',
          700: '#161D2E',
          600: '#232C42',
        },
        cyan: {
          neon: '#00F0FF',
          glow: '#00D1E0',
          dim: 'rgba(0, 240, 255, 0.12)',
          border: 'rgba(0, 240, 255, 0.3)',
        },
        violet: {
          neon: '#8B5CF6',
          glow: '#A78BFA',
          dim: 'rgba(139, 92, 246, 0.12)',
        },
        amber: {
          neon: '#F59E0B',
          dim: 'rgba(245, 158, 11, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 25px rgba(0, 240, 255, 0.35)',
        'neon-violet': '0 0 25px rgba(139, 92, 246, 0.35)',
        'glass-edge': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
        'reactor-glow': '0 0 60px rgba(0, 240, 255, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 18s linear infinite',
        'spin-reverse': 'spin 24s linear infinite reverse',
      },
    },
  },
  plugins: [],
}
