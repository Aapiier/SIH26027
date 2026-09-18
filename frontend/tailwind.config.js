/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0f17',
        surface1: '#111827',
        surface2: '#1e293b',
        surface3: '#273549',
        border1: '#334155',
        ai: '#6366f1',
        nominal: '#10b981',
        warning: '#f59e0b',
        emergency: '#ef4444',
        trd: '#06b6d4',
        snt: '#8b5cf6',
        eng: '#f97316',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
