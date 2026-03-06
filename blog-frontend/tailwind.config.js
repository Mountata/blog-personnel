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
        primary:        '#4F6EF7',
        'primary-dark': '#3B55D9',
        'primary-light':'#EEF1FE',
        secondary:      '#0EA5E9',
        surface:        '#F7F8FC',
        muted:          '#6B7280',
        border:         '#E5E7EB',
      },
      boxShadow: {
        nav:  '0 1px 0 0 #E5E7EB',
        card: '0 1px 3px 0 rgba(0,0,0,.07)',
        fab:  '0 8px 32px rgba(79,110,247,.35)',
      },
    },
  },
  plugins: [],
}