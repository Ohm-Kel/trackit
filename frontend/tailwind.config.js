/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        'primary-hover': '#4338CA',
        'primary-light': '#EEF2FF',
        'primary-mid': '#C7D2FE',
        'primary-faint': '#F5F3FF',

        bg: '#F8FAFC',
        border: '#E8ECF0',
        border2: '#D1D9E0',

        'text-1': '#0F172A',
        'text-2': '#475569',
        'text-3': '#94A3B8',
      },
      boxShadow: {
        xs: '0 1px 3px rgba(15,23,42,0.06)',
        sm: '0 2px 8px rgba(15,23,42,0.08)',
        md: '0 4px 16px rgba(15,23,42,0.10)',
      },
      borderRadius: {
        'r': '12px',
        'rs': '8px',
      }
    },
  },
  plugins: [],
}
