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
        // Material Design 3 - White & Blue palette
        'dark-bg': '#F1F5F9',           // slate-100 - nền tổng thể
        'dark-surface': '#FFFFFF',       // card trắng
        'dark-border': '#E2E8F0',        // slate-200 - viền
        'dark-text-primary': '#1E293B',  // slate-800 - chữ chính
        'dark-text-secondary': '#64748B',// slate-500 - chữ phụ
        'brand-amber': {
          DEFAULT: '#2563EB',            // blue-600 - primary
          dark: '#1D4ED8',               // blue-700 - primary hover
          light: '#EFF6FF',              // blue-50 - tonal
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // THÊM PLUGIN MỚI
    require('tailwind-scrollbar-hide'),
  ],
};