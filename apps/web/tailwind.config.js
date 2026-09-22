/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  },
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF', foreground: '#26364A', silver: '#F3F5F7', blush: '#FFF1F3', border: '#D7DEE6', focus: '#C8102E',
        brand: { 50: '#FFF1F3', 100: '#FFE1E7', 200: '#FFC2CE', 300: '#F88AA0', 400: '#E64B68', 500: '#D92949', 600: '#C8102E', 700: '#A30E26', 800: '#851020', 900: '#641019' },
        ink: { 50: '#F3F5F7', 100: '#E9EDF1', 200: '#D7DEE6', 300: '#B4C0CC', 400: '#7D8B99', 500: '#516173', 600: '#405164', 700: '#34465A', 800: '#2C3C50', 900: '#26364A' },
        success: { 50: '#ecfdf5', 600: '#059669', 700: '#047857' },
        warning: { 50: '#fffbeb', 600: '#d97706', 700: '#b45309' },
        danger: { 50: '#fef2f4', 600: '#B4233C', 700: '#8D1D32' },
      },
      fontFamily: { sans: ['var(--font-space-grotesk)', 'Arial', 'Helvetica', 'sans-serif'], mono: ['var(--font-geist-mono)', 'Consolas', 'monospace'] },
      borderRadius: { card: '0.5rem' },
      boxShadow: { panel: '0 18px 45px rgba(15, 23, 42, 0.08)' },
      spacing: { touch: '2.75rem' },
    },
  },
  plugins: [],
};
