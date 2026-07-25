/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': '#F8F9FA',
        'dark-surface': '#FFFFFF',
        'dark-border': '#DEE2E6',
        'dark-text-primary': '#212529',
        'dark-text-secondary': '#6C757D',
        'brand-amber': {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // THÊM PLUGIN MỚI
    require('tailwind-scrollbar-hide'),
  ],
};