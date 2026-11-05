/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: '#778873',
        softGreen: '#A1BC98',
        beige: '#DCCFC0',
        cream: '#FDF6ED',
        darkGreen: '#1D3B30',
        charcoal: '#252922',
        mint: {
          50: '#F7FAF6',
          100: '#EBF3EA',
          200: '#DDE9DC',
          300: '#C7DBC5',
          border: '#D1E0CE'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}

