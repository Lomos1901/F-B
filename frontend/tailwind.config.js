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
        'dark-bg': '#111827',
        'dark-surface': '#1F2937',
        'dark-border': '#374151',
        'dark-text-primary': '#F9FAFB',
        'dark-text-secondary': '#9CA3AF',
        'brand-amber': {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
